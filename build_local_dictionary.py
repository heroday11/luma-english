"""Build a small offline dictionary for the PDF vocabulary, without runtime dependencies.

ECDICT English and Chinese blocks are independent: they MUST NOT be zipped by row.
The optional WordNet/COW block instead joins senses using a shared WordNet 3.0 ID.
COW supplies Chinese equivalent words, not translated English definitions.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import re
import urllib.request
import zipfile
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CACHE = Path(os.environ.get('WORDTRAIL_DICTIONARY_CACHE') or
             str(Path(os.environ.get('LOCALAPPDATA') or Path.home() / '.cache') / 'WordTrail' / 'dictionary-cache'))
LICENSES = ROOT / "dictionary-licenses"
ECDICT_REV = "bc015ed2e24a7abef49fc6dbbb7fe32c1dadaf8b"
OMW_REV = "406bf83b3c507a3d1f26e88252d5d66893fd36bf"
ECDICT_BASE = f"https://raw.githubusercontent.com/skywind3000/ECDICT/{ECDICT_REV}"
OMW_BASE = f"https://raw.githubusercontent.com/omwn/omw-data/{OMW_REV}"
SOURCES = {
    "ecdict.csv": f"{ECDICT_BASE}/ecdict.csv",
    "cow.tab": f"{OMW_BASE}/wns/cow/wn-data-cmn.tab",
    "wordnet.zip": "https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/wordnet.zip",
    "ECDICT-LICENSE.txt": f"{ECDICT_BASE}/LICENSE",
    "COW-LICENSE.txt": f"{OMW_BASE}/wns/cow/LICENSE",
}
POS_LABEL = {"n": "n.", "v": "v.", "a": "adj.", "s": "adj.", "r": "adv."}
FORM_LABEL = {"p": "过去式", "d": "过去分词", "i": "现在分词", "3": "第三人称单数", "r": "比较级", "t": "最高级", "s": "复数"}


def download(item):
    name, url = item
    target = (LICENSES if name.endswith("LICENSE.txt") else CACHE) / name
    if not target.exists():
        request = urllib.request.Request(url, headers={"User-Agent": "VocabularyStudyRoom/1.0"})
        temporary = target.with_suffix(target.suffix + ".partial")
        with urllib.request.urlopen(request, timeout=45) as response, temporary.open("wb") as out:
            while chunk := response.read(1024 * 1024):
                out.write(chunk)
        temporary.replace(target)
    return name, target


def clean(value):
    return value.replace("\\n", "\n").replace("\\r", "\r").strip()


def split_definitions(value):
    result = []
    for line in clean(value).splitlines():
        line = line.strip()
        if not line:
            continue
        match = re.match(r"^([A-Za-z. &/-]{1,18})\.\s+(.+)$", line)
        if match:
            pos, text = match.groups()
            pos = {"a": "adj", "r": "adv", "s": "adj"}.get(pos, pos) + "."
        else:
            pos, text = "", line
        result.append({"pos": pos, "text": text})
    return result


def exchange_map(value):
    return dict(part.split(":", 1) for part in value.split("/") if ":" in part)


def exact_spellings(word):
    """Normalize punctuation only; never manufacture a lemma by removing suffixes."""
    return list(dict.fromkeys([word, word.replace("’", "'").replace("–", "-")]))


def load_ecdict(words, path, exceptions):
    wanted = {candidate for word in words for candidate in exact_spellings(word)}
    # WordNet exception files explicitly encode inflections for each part of speech.
    for word in words:
        for exception_map in exceptions.values():
            wanted.update(exception_map.get(word, []))
    rows = {}
    with path.open(encoding="utf-8-sig", newline="") as file:
        for row in csv.DictReader(file):
            word = row["word"].lower()
            if word in wanted:
                rows[word] = row
    # If a directly matched inflection explicitly identifies its lemma, load that lemma too.
    needed = {exchange_map(row["exchange"]).get("0", "").lower() for row in rows.values()} - rows.keys() - {""}
    if needed:
        with path.open(encoding="utf-8-sig", newline="") as file:
            for row in csv.DictReader(file):
                if row["word"].lower() in needed:
                    rows[row["word"].lower()] = row
    return rows


def load_wordnet(path):
    indices, synsets, exceptions = {}, {}, {}
    with zipfile.ZipFile(path) as archive:
        (LICENSES / "WORDNET-LICENSE.txt").write_bytes(archive.read("wordnet/LICENSE"))
        for name, pos in (("noun", "n"), ("verb", "v"), ("adj", "a"), ("adv", "r")):
            index = {}
            for line in archive.read(f"wordnet/index.{name}").decode("utf-8").splitlines():
                if not line or line[0].isspace():
                    continue
                parts = line.split()
                count = int(parts[2])
                index[parts[0]] = [f"{offset}-{pos}" for offset in parts[-count:]]
            indices[pos] = index
            for line in archive.read(f"wordnet/data.{name}").decode("utf-8").splitlines():
                if not line or not line[0].isdigit():
                    continue
                raw, gloss = line.split("|", 1)
                parts = raw.split()
                sense_id = f"{parts[0]}-{pos}"
                definition = re.split(r';\s*"', gloss.strip(), maxsplit=1)[0].rstrip("; ")
                examples = re.findall(r'"([^\"]+)"', gloss)
                synsets[sense_id] = {"en": definition, "examples": examples, "pos": POS_LABEL[pos]}
            exc = {}
            for line in archive.read(f"wordnet/{name}.exc").decode("utf-8").splitlines():
                pieces = line.split()
                exc[pieces[0]] = pieces[1:]
            exceptions[pos] = exc
    return indices, synsets, exceptions


def load_chinese(path):
    chinese = defaultdict(list)
    with path.open(encoding="utf-8") as file:
        for line in file:
            if line.startswith("#"):
                continue
            fields = line.strip().split("\t")
            if len(fields) == 3 and fields[1] == "cmn:lemma":
                value = fields[2].replace("_", " ")
                if value not in chinese[fields[0]]:
                    chinese[fields[0]].append(value)
    return chinese


def aligned_senses(word, base, preferred_pos, indices, synsets, exceptions, chinese, lemma_positions):
    out, seen = [], set()
    preferred = {"adj": "a", "ad": "r", "adv": "r", "n": "n", "v": "v"}.get(preferred_pos, "")
    pos_order = list(dict.fromkeys([preferred, "n", "v", "a", "r"]))
    for pos in pos_order:
        if pos not in indices:
            continue
        spellings = [spelling.replace(" ", "_") for spelling in exact_spellings(word)]
        if base != word and pos in lemma_positions:
            spellings.append(base.replace(" ", "_"))
        spellings += exceptions[pos].get(word, [])
        for spelling in dict.fromkeys(spellings):
            if spelling not in indices[pos]:
                continue
            for sense_id in indices[pos][spelling]:
                if sense_id in seen or sense_id not in chinese:
                    continue
                sense = synsets[sense_id]
                out.append({"id": sense_id, "pos": sense["pos"], "en": sense["en"], "zh": "；".join(chinese[sense_id]), "zhType": "equivalent-lemmas", "exampleEn": sense["examples"][0] if sense["examples"] else "", "source": "WordNet 3.0 + Chinese Open WordNet"})
                seen.add(sense_id)
            # An exact spelling or an explicit lemma was found; do not mix unrelated suffix guesses.
            break
    return out[:12]


def main():
    CACHE.mkdir(exist_ok=True)
    LICENSES.mkdir(exist_ok=True)
    with ThreadPoolExecutor(max_workers=5) as pool:
        files = dict(pool.map(download, SOURCES.items()))
    vocab = json.loads((ROOT / "exam_vocab.json").read_text(encoding="utf-8"))
    words = defaultdict(list)
    for entry in vocab:
        words[entry["word"].strip().lower()].append(entry)
    indices, synsets, exceptions = load_wordnet(files["wordnet.zip"])
    rows = load_ecdict(words, files["ecdict.csv"], exceptions)
    chinese = load_chinese(files["cow.tab"])
    curated = json.loads((ROOT / "learning-content.json").read_text(encoding="utf-8"))
    review_path = ROOT / "source-review.json"
    source_review = json.loads(review_path.read_text(encoding="utf-8")) if review_path.exists() else {}
    output = {}
    stats = {"pdfRecords": len(vocab), "uniqueWords": len(words), "ecdictDirect": 0, "ecdictLemmaFallback": 0, "withPhonetic": 0, "withChineseDictionary": 0, "withEnglishDefinitions": 0, "withAlignedSenses": 0, "alignedSenseCount": 0, "withWordNetAlignedSenses": 0, "wordNetAlignedSenseCount": 0, "withCuratedSenses": 0, "curatedSenseCount": 0, "pdfOnly": []}
    for word, exam_rows in words.items():
        row, match_type = rows.get(word), "exact"
        if row is None:
            explicit_candidates = []
            preferred = {"adj": "a", "ad": "r", "adv": "r", "n": "n", "v": "v"}.get(exam_rows[0]["pos"], "")
            for pos in ([preferred] if preferred else ["n", "v", "a", "r"]):
                explicit_candidates += exceptions[pos].get(word, [])
            for candidate in [*exact_spellings(word)[1:], *explicit_candidates]:
                if candidate in rows:
                    row, match_type = rows[candidate], "lemma"
                    break
        if row:
            stats["ecdictDirect" if match_type == "exact" else "ecdictLemmaFallback"] += 1
        else:
            stats["pdfOnly"].append(word)
        row = row or {}
        exchange = exchange_map(row.get("exchange", ""))
        lemma = exchange.get("0", row.get("word", word)).lower()
        dictionary_row = rows.get(lemma, row)
        zh = split_definitions(dictionary_row.get("translation", ""))
        en = split_definitions(dictionary_row.get("definition", ""))
        forms = [{"label": label, "word": exchange.get(key, "")} for key, label in FORM_LABEL.items() if exchange.get(key)]
        if not forms and dictionary_row:
            lemma_exchange = exchange_map(dictionary_row.get("exchange", ""))
            forms = [{"label": label, "word": lemma_exchange[key]} for key, label in FORM_LABEL.items() if lemma_exchange.get(key)]
        lemma_positions = set()
        inflection_kind = exchange.get("1", "")
        if any(kind in inflection_kind for kind in "pdi3"):
            lemma_positions.add("v")
        if "s" in inflection_kind:
            lemma_positions.add("n")
        if any(kind in inflection_kind for kind in "rt"):
            lemma_positions.add("a")
        if lemma != word and not lemma_positions:
            preferred = {"adj": "a", "ad": "r", "adv": "r", "n": "n", "v": "v"}.get(exam_rows[0]["pos"], "")
            if preferred:
                lemma_positions.add(preferred)
        pairs = aligned_senses(word, lemma, exam_rows[0]["pos"], indices, synsets, exceptions, chinese, lemma_positions)
        if pairs:
            stats["withWordNetAlignedSenses"] += 1
            stats["wordNetAlignedSenseCount"] += len(pairs)
        original = curated.get(word, {})
        original_pairs = [{"id": f"original:{word}:{index}", "pos": sense["pos"], "en": sense["en"], "zh": sense["zh"], "zhType": "definition", "exampleEn": sense.get("exampleEn", ""), "exampleZh": sense.get("exampleZh", ""), "source": "WordTrail original"} for index, sense in enumerate(original.get("senses", []))]
        if original_pairs:
            pairs = original_pairs + pairs
            stats["withCuratedSenses"] += 1
            stats["curatedSenseCount"] += len(original_pairs)
        phonetic = clean(row.get("phonetic", ""))
        if phonetic:
            phonetic = f"[{phonetic}]"
        phonetic = original.get("phonetic") or phonetic
        if phonetic:
            stats["withPhonetic"] += 1
        if zh:
            stats["withChineseDictionary"] += 1
        if en:
            stats["withEnglishDefinitions"] += 1
        if pairs:
            stats["withAlignedSenses"] += 1
            stats["alignedSenseCount"] += len(pairs)
        output[word] = {"headword": row.get("word", word), "lemma": lemma, "matchType": match_type if row else "pdf-only", "phonetic": phonetic, "chineseMeanings": zh, "englishDefinitions": en, "alignedSenses": pairs, "forms": forms, "tags": dictionary_row.get("tag", "").split(), "source": "WordTrail original + ECDICT" if original_pairs and row else "WordTrail original" if original_pairs else "ECDICT" if row else "用户提供的真题词汇 PDF"}
        if word in source_review:
            output[word].update(source_review[word])
    stats["reviewRequired"] = sum(bool(entry.get("reviewRequired")) for entry in output.values())
    (ROOT / "local-dictionary.json").write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    metadata = {"schemaVersion": 1, "sources": SOURCES, "revisions": {"ECDICT": ECDICT_REV, "OMW": OMW_REV}, "sha256": {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in files.items()}, "coverage": stats, "notes": ["ECDICT 英文释义与中文释义独立存储，不可按行号强行配对。", "alignedSenses 通过 WordNet 3.0 synset ID 关联英文定义与中文同义表达。zhType=equivalent-lemmas 表示中文等义词，不是英文解释全文的翻译。", "WordNet 例句仅提供原始英文，未虚构中文译文。", "离线读音使用浏览器语音；词典音标不等于录音，ECDICT audio 字段未提供音频。", "原 PDF 专属词义仍应在界面优先展示；词典义项是补充解释。"]}
    (ROOT / "dictionary-sources.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(stats, ensure_ascii=False))


if __name__ == "__main__":
    main()
