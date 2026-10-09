"""Online neural speech. This module does not run or download a speech model."""
from __future__ import annotations
import asyncio
import hashlib
import json
import threading
from pathlib import Path
import edge_tts

VOICES = {
    "en-US-AriaNeural": "美音 · Aria 女声",
    "en-US-GuyNeural": "美音 · Guy 男声",
    "en-GB-SoniaNeural": "英音 · Sonia 女声",
    "en-GB-RyanNeural": "英音 · Ryan 男声",
}
CACHE = Path(__file__).resolve().parent / ".study-audio"
LOCK = threading.Lock()
KEY_LOCKS = {}
LIMIT = threading.BoundedSemaphore(3)


def generate(text: str, voice: str, rate: float = 1) -> dict:
    if not isinstance(text, str) or not 1 <= len(text.strip()) <= 1200:
        raise ValueError("朗读文字需为 1–1200 个字符")
    if voice not in VOICES:
        raise ValueError("请选择支持的英文音色")
    text = text.strip()
    rate = round(max(.6, min(1.3, float(rate))), 2)
    key = hashlib.sha256(json.dumps([text, voice, rate]).encode()).hexdigest()
    CACHE.mkdir(exist_ok=True)
    audio, metadata = CACHE / f"{key}.mp3", CACHE / f"{key}.json"
    with LOCK:
        key_lock = KEY_LOCKS.setdefault(key, threading.Lock())
    with key_lock:
        if audio.exists() and metadata.exists():
            result = json.loads(metadata.read_text(encoding="utf-8"))
            result["cached"] = True
            return result
        async def collect():
            timings, chunks = [], []
            communication = edge_tts.Communicate(
                text, voice, rate=f"{round((rate-1)*100):+d}%",
                boundary="WordBoundary", connect_timeout=8, receive_timeout=20,
            )
            async for chunk in communication.stream():
                if chunk["type"] == "audio":
                    chunks.append(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    timings.append({"text": chunk["text"], "start": chunk["offset"]/10_000_000,
                                    "end": (chunk["offset"]+chunk["duration"])/10_000_000})
            if not chunks:
                raise RuntimeError("在线语音没有返回音频，请稍后重试")
            return b"".join(chunks), timings
        with LIMIT:
            body, timings = asyncio.run(asyncio.wait_for(collect(), timeout=35))
        result = {"url": f"/api/audio/{key}.mp3", "voice": voice, "text": text,
                  "rate": rate, "timings": timings, "provider": "Microsoft Edge 在线自然语音",
                  "cached": False}
        temporary = audio.with_suffix(".tmp")
        temporary.write_bytes(body)
        temporary.replace(audio)
        metadata.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
        return result
