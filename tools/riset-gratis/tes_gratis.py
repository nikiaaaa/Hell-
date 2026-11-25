"""Tes koneksi provider AI gratis untuk riset SORA: NVIDIA NIM dan Gemini.

Key dibaca dari environment, tidak pernah ditulis ke file:
    NVIDIA_API_KEY   (dari build.nvidia.com)
    GEMINI_API_KEY   (dari aistudio.google.com)

Pemakaian:
    python tes_gratis.py nvidia
    python tes_gratis.py gemini
    python tes_gratis.py nvidia <nama-model>
    python tes_gratis.py gemini <nama-model>

Tanpa nama model, script memakai model pertama dari daftar yang dikembalikan provider.
"""
import json
import os
import sys
import urllib.error
import urllib.request


def call(method, url, headers, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    h = {"Content-Type": "application/json", **headers}
    r = urllib.request.Request(url, data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_fail(e, label):
    detail = e.read().decode("utf-8", errors="replace")[:300]
    print(f"{label} gagal: HTTP {e.code} {detail}")
    return 1


def tes_nvidia(model_arg):
    key = os.environ.get("NVIDIA_API_KEY", "").strip()
    if not key:
        print("NVIDIA_API_KEY belum diset.")
        return 1
    auth = {"Authorization": f"Bearer {key}"}
    base = "https://integrate.api.nvidia.com/v1"
    try:
        models = call("GET", f"{base}/models", auth)
    except urllib.error.HTTPError as e:
        return http_fail(e, "Daftar model NVIDIA")
    names = [m["id"] for m in models.get("data", [])]
    print(f"NVIDIA: key diterima, {len(names)} model tersedia.")
    if not names:
        return 0
    model = model_arg or names[0]
    print(f"Tes chat dengan model: {model}")
    try:
        out = call(
            "POST",
            f"{base}/chat/completions",
            auth,
            {
                "model": model,
                "messages": [{"role": "user", "content": "Balas satu kata: siap"}],
                "max_tokens": 20,
            },
        )
    except urllib.error.HTTPError as e:
        return http_fail(e, "Chat NVIDIA")
    print("Balasan:", out["choices"][0]["message"]["content"].strip())
    return 0


def tes_gemini(model_arg):
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        print("GEMINI_API_KEY belum diset.")
        return 1
    auth = {"x-goog-api-key": key}
    base = "https://generativelanguage.googleapis.com/v1beta"
    try:
        models = call("GET", f"{base}/models", auth)
    except urllib.error.HTTPError as e:
        return http_fail(e, "Daftar model Gemini")
    # hanya model yang bisa generateContent
    names = [
        m["name"].replace("models/", "")
        for m in models.get("models", [])
        if "generateContent" in m.get("supportedGenerationMethods", [])
    ]
    print(f"Gemini: key diterima, {len(names)} model bisa generateContent.")
    if not names:
        return 0
    model = model_arg or names[0]
    print(f"Tes chat dengan model: {model}")
    try:
        out = call(
            "POST",
            f"{base}/models/{model}:generateContent",
            auth,
            {"contents": [{"parts": [{"text": "Balas satu kata: siap"}]}]},
        )
    except urllib.error.HTTPError as e:
        return http_fail(e, "Chat Gemini")
    text = out["candidates"][0]["content"]["parts"][0]["text"]
    print("Balasan:", text.strip())
    return 0


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("nvidia", "gemini"):
        print(__doc__)
        return 1
    model_arg = sys.argv[2] if len(sys.argv) > 2 else None
    if sys.argv[1] == "nvidia":
        return tes_nvidia(model_arg)
    return tes_gemini(model_arg)


if __name__ == "__main__":
    sys.exit(main())
