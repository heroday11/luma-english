import json, hashlib
from pathlib import Path
ROOT = Path(__file__).resolve().parent
source_path = ROOT / "exam_vocab.json"
vocab = json.loads(source_path.read_text(encoding="utf-8"))
changes = {
  "rose-tint": {
    "word": "rose-tint",
    "pos": "v",
    "meanings": [
      "染上玫瑰色；粉饰；美化"
    ]
  },
  "prompt to do": {
    "word": "prompt sb. to do sth.",
    "pos": "phrase",
    "meanings": [
      "提示某人做某事"
    ]
  },
  "have less to do": {
    "word": "have less to do with",
    "pos": "phrase",
    "meanings": [
      "与……关联更小"
    ]
  },
  "it easier to do": {
    "word": "make it easier to do sth.",
    "pos": "phrase",
    "meanings": [
      "使做某事变得更容易"
    ]
  },
  "the national health": {
    "word": "the National Health Service (NHS)",
    "pos": "phrase",
    "meanings": [
      "英国国民医疗服务体系"
    ]
  },
  "the burden": {
    "word": "lighten the burden of",
    "pos": "phrase",
    "meanings": [
      "减轻……的负担"
    ]
  },
  "keep under great": {
    "word": "keep sth. under great pressure",
    "pos": "phrase",
    "meanings": [
      "使……承受巨大压力"
    ]
  },
  "be bolstered": {
    "word": "be bolstered with",
    "pos": "phrase",
    "meanings": [
      "配备有……"
    ]
  },
  "to mind": {
    "word": "spring to mind",
    "pos": "phrase",
    "meanings": [
      "立即被想到"
    ]
  },
  "and down": {
    "word": "up and down",
    "pos": "phrase",
    "meanings": [
      "到处；四面八方"
    ]
  },
  "the beans": {
    "word": "spill the beans",
    "pos": "phrase",
    "meanings": [
      "泄露秘密；说漏嘴"
    ]
  },
  "terms of": {
    "word": "in terms of",
    "pos": "phrase",
    "meanings": [
      "在……方面；从……角度来看"
    ]
  },
  "the meantime": {
    "word": "in the meantime",
    "pos": "phrase",
    "meanings": [
      "在此期间；与此同时"
    ]
  },
  "festgoer": {
    "word": "festgoer",
    "pos": "n",
    "meanings": [
      "节庆活动参与者"
    ]
  }
}
originals = {
  "rose-tint": {
    "senses": [
      {
        "pos": "v.",
        "en": "To give something a pink or rosy color.",
        "zh": "染上玫瑰色；使呈粉红色。",
        "exampleEn": "The evening light rose-tinted the clouds.",
        "exampleZh": "傍晚的光线把云朵染成了玫瑰色。"
      },
      {
        "pos": "v.",
        "en": "To make something appear better or more pleasant than it really is.",
        "zh": "粉饰；美化；把事物看得比实际更美好。",
        "exampleEn": "Nostalgia can rose-tint our memories of the past.",
        "exampleZh": "怀旧之情会美化我们对过去的记忆。"
      }
    ],
    "imageQuery": "rosy sunset clouds",
    "scene": "玫瑰色的晚霞，联想美化回忆"
  },
  "prompt sb. to do sth.": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To encourage or cause someone to take a particular action.",
        "zh": "提示或促使某人做某事。",
        "exampleEn": "The reminder prompted me to finish the form.",
        "exampleZh": "这条提醒促使我填完了表格。"
      }
    ],
    "imageQuery": "reminder note form",
    "scene": "提醒促使人采取行动"
  },
  "have less to do with": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To be connected with something to a smaller degree.",
        "zh": "与某事的关联更小；与某事关系较少。",
        "exampleEn": "The result may have less to do with talent than with practice.",
        "exampleZh": "这个结果可能更多地与练习有关，而不是与天赋有关。"
      }
    ],
    "imageQuery": "student practice notebook",
    "scene": "比较不同因素与结果的联系"
  },
  "make it easier to do sth.": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To reduce the difficulty of taking a particular action.",
        "zh": "使做某事变得更容易。",
        "exampleEn": "Clear examples make it easier to understand the rules.",
        "exampleZh": "清晰的例子使理解规则变得更容易。"
      }
    ],
    "imageQuery": "clear instructions steps",
    "scene": "清晰的步骤让任务更容易"
  },
  "the National Health Service (NHS)": {
    "senses": [
      {
        "pos": "proper noun phrase",
        "en": "The publicly funded healthcare service in the United Kingdom.",
        "zh": "英国国民医疗服务体系；由公共资金支持的医疗服务体系。",
        "exampleEn": "The National Health Service provides a wide range of medical care.",
        "exampleZh": "英国国民医疗服务体系提供广泛的医疗服务。"
      }
    ],
    "imageQuery": "NHS hospital United Kingdom",
    "scene": "英国的公共医疗服务"
  },
  "lighten the burden of": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To make a responsibility, difficulty, or cost less heavy or demanding.",
        "zh": "减轻某种责任、困难或费用带来的负担。",
        "exampleEn": "The new service helps lighten the burden of caring for relatives.",
        "exampleZh": "这项新服务有助于减轻照顾亲属的负担。"
      }
    ],
    "imageQuery": "caregiver support helping elderly",
    "scene": "分担照护任务，减轻负担"
  },
  "keep sth. under great pressure": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To cause something to remain under a high level of strain or demand.",
        "zh": "使某事物持续承受巨大压力或负荷。",
        "exampleEn": "Extreme heat keeps the power system under great pressure.",
        "exampleZh": "极端高温使电力系统持续承受巨大压力。"
      }
    ],
    "imageQuery": "power system heatwave",
    "scene": "高温让电力系统承受压力"
  },
  "be bolstered with": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To be strengthened or supported by adding something useful.",
        "zh": "通过增加有用的事物得到加强或支持；原词汇表语境译为配备有。",
        "exampleEn": "The plan was bolstered with extra funding.",
        "exampleZh": "这项计划通过额外资金得到了加强。"
      }
    ],
    "imageQuery": "funding support project",
    "scene": "额外资源为计划提供支持"
  },
  "spring to mind": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To come into one's thoughts immediately or unexpectedly.",
        "zh": "立即被想到；突然浮现在脑海中。",
        "exampleEn": "Her name was the first to spring to mind.",
        "exampleZh": "她的名字是第一个浮现在我脑海中的名字。"
      }
    ],
    "imageQuery": "person idea lightbulb",
    "scene": "一个想法突然出现在脑海中"
  },
  "up and down": {
    "senses": [
      {
        "pos": "adv. phrase",
        "en": "In both directions along or throughout a place.",
        "zh": "来回；到处；遍及某一地方。",
        "exampleEn": "Small clinics operate up and down the country.",
        "exampleZh": "小型诊所遍布全国各地。"
      },
      {
        "pos": "adv. phrase",
        "en": "Alternately in a higher and a lower direction or position.",
        "zh": "上下地；交替向上和向下。",
        "exampleEn": "The child jumped up and down with excitement.",
        "exampleZh": "孩子兴奋地上下跳跃。"
      }
    ],
    "imageQuery": "people places country map",
    "scene": "各地都有活动，或上下运动"
  },
  "spill the beans": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To reveal information that was supposed to remain secret.",
        "zh": "泄露秘密；说漏嘴。",
        "exampleEn": "Please don't spill the beans about the surprise party.",
        "exampleZh": "请不要说漏嘴，透露惊喜派对的秘密。"
      }
    ],
    "imageQuery": "friends secret conversation",
    "scene": "一不小心把秘密说了出来"
  },
  "in terms of": {
    "senses": [
      {
        "pos": "prep. phrase",
        "en": "With regard to a particular aspect or way of considering something.",
        "zh": "在某个方面；从某种角度来看。",
        "exampleEn": "The bus is better in terms of cost.",
        "exampleZh": "从费用的角度来看，公交车更合适。"
      }
    ],
    "imageQuery": "transport cost comparison",
    "scene": "从费用这个角度比较选择"
  },
  "in the meantime": {
    "senses": [
      {
        "pos": "adv. phrase",
        "en": "During the time before another event happens.",
        "zh": "在此期间；与此同时；等待另一件事发生的这段时间。",
        "exampleEn": "The repairs will take a week; in the meantime, use the other room.",
        "exampleZh": "维修需要一周；在此期间，请使用另一个房间。"
      }
    ],
    "imageQuery": "clock waiting time",
    "scene": "等待下一件事发生的这段时间"
  },
  "festgoer": {
    "senses": [
      {
        "pos": "n.",
        "en": "A person who attends a festival; a shortened form used in the source vocabulary list.",
        "zh": "节庆活动参与者；原词汇表使用的缩略词形。",
        "exampleEn": "The festgoer arrived early to enjoy the music.",
        "exampleZh": "这位节庆活动参与者早早到达，准备欣赏音乐。"
      }
    ],
    "imageQuery": "festival crowd music",
    "scene": "参加节庆音乐活动的人群"
  }
}
content_path = ROOT / "learning-content.json"
content = json.loads(content_path.read_text(encoding="utf-8"))
for headword, entry in originals.items():
    content[headword.lower()] = entry
for entry in content.values():
    entry["source"] = "WordTrail original"
    for sense in entry["senses"]:
        sense["source"] = "WordTrail original"
content_path.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")
corrections = []
for index, row in enumerate(vocab):
    if row["year"] == "2024" and row["page"] == 31:
        corrected = dict(row)
        corrected["text"] = "Text 3"
        if corrected["pos"] == "phrase" and any(m.startswith("a.") for m in corrected["meanings"]):
            corrected["pos"] = "adj"
            corrected["meanings"] = [m.removeprefix("a.") for m in corrected["meanings"]]
        if row["word"] == "notify":
            corrected["pos"] = "v"
            corrected["meanings"] = ["申报；报告"]
        if row["word"] == "algorithm":
            corrected["meanings"] = ["（尤指电脑程序中的）算法；运算法则"]
        reason = "PDF 第30页底部 Text 3 标题覆盖第31页；第32页起为 Text 4。"
    elif row["word"].lower() in changes:
        corrected = dict(row)
        corrected.update(changes[row["word"].lower()])
        reason = "已逐行核对 PDF 图像，恢复完整词组或词性；保留原始记录索引。"
    else:
        continue
    corrections.append({"index": index, "originalIndex": index, "originalWord": row["word"], "originalYear": row["year"], "originalText": row["text"], "originalPage": row["page"], **corrected, "reviewRequired": False, "verified": True, "note": reason})
result = {"schemaVersion": 1, "sourceFile": source_path.name, "sourceSha256": hashlib.sha256(source_path.read_bytes()).hexdigest(), "verifiedPages": [9,30,31,32,33,34,35,36,37,39,40], "corrections": corrections, "additions": [], "notes": ["2024 Text 3 并非缺词：第31页59个已提取记录全部误归为 Text 2。原 PDF 有60个表格词位，require 出现两次，原词库已合并其两条释义。", "务必先以原始 word/year/text/index 建立稳定 ID，再应用 corrections；不要替换原源文件。", "homo-grown、integrate A to B、a wide range array of 在原 PDF 中也如此书写，仍需语言层面的核对，没有据猜测改成另一词。"]}
(ROOT / "recovered-content.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
review_path = ROOT / "source-review.json"
review = json.loads(review_path.read_text(encoding="utf-8"))
for old, new in changes.items():
    review[old] = {"reviewRequired": False, "note": "已在 PDF 图像中核对完整原行。", "sourceCorrection": new}
review["homo-grown"]["note"] = "PDF 第30页原行也写作 homo-grown；常见表达为 home-grown，原资料疑似拼写错误，暂不自动纠正。"
review["integrate a to b"]["note"] = "PDF 第36页原行也写作 integrate A to B；常见搭配为 integrate A into B，原资料介词需核对，暂不自动纠正。"
review["a wide range array of"]["note"] = "PDF 第37页原行也写作 a wide range array of；疑似合并两种搭配，原资料需核对，暂不自动纠正。"
review_path.write_text(json.dumps(review, ensure_ascii=False, indent=2), encoding="utf-8")
print("corrections", len(corrections), "reassigned", sum(c["text"]=="Text 3" and c["year"]=="2024" for c in corrections), "original content", len(content))

