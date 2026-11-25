"""Tes koneksi Ollama Cloud untuk agen riset SORA.

Membaca API key dari env var OLLAMA_API_KEY (tidak pernah ditulis ke file).
Pemakaian:
    python tes_ollama.py                 # cek daftar model + satu chat singkat
    python tes_ollama.py nama-model      # pakai model tertentu untuk chat
"""
import json
import os
import sys
import urllib.error
import urllib.request

BASE = "https://ollama.com"


def req(method, path, key, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    r = urllib.request.Request(
        BASE + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(r, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    key = os.environ.get("OLLAMA_API_KEY", "").strip()
    if not key:
        print("OLLAMA_API_KEY belum diset di environment.")
        return 1

    try:
        tags = req("GET", "/api/tags", key)
    except urllib.error.HTTPError as e:
        print(f"Gagal cek daftar model: HTTP {e.code} (401/403 = key salah atau tidak aktif)")
        return 1
    names = [m.get("name", "?") for m in tags.get("models", [])]
    print(f"Key diterima. Jumlah model: {len(names)}")
    for n in names[:30]:
        print(" -", n)
    if not names:
        return 0

    model = sys.argv[1] if len(sys.argv) > 1 else names[0]
    print(f"\nTes chat dengan model: {model}")
    try:
        out = req(
            "POST",
            "/api/chat",
            key,
            {
                "model": model,
                "messages": [{"role": "user", "content": "Balas satu kata: siap"}],
                "stream": False,
            },
        )
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:300]
        print(f"Chat gagal: HTTP {e.code} {detail}")
        return 1
    print("Balasan:", out.get("message", {}).get("content", "(kosong)").strip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
