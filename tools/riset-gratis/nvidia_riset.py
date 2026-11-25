"""Helper riset NVIDIA NIM untuk agen SORA (ENVY, GLUTTONY).

Model NVIDIA ini TIDAK bisa browsing. Dipakai hanya untuk pekerjaan teks yang
berat: membuat daftar ide, dan merangkum teks sumber yang SUDAH diambil agen
lewat WebFetch. Angka, tanggal, dan nama harus disalin dari sumber asli, bukan
dari keluaran model.

Key dibaca dari env var NVIDIA_API_KEY (tidak pernah ditulis ke file).

Pemakaian:
    python nvidia_riset.py --prompt prompt.txt --out hasil.md
    python nvidia_riset.py --prompt prompt.txt --input sumber1.txt --input sumber2.txt --out hasil.md
    python nvidia_riset.py --prompt prompt.txt --model nvidia/nemotron-3.5-bolt-e4b --out hasil.md
    echo "teks" | python nvidia_riset.py --prompt prompt.txt --out hasil.md

Urutan model (--model dicoba lebih dulu, lalu daftar cadangan). Model yang
muncul di daftar belum tentu bisa dipanggil dari akun ini (contoh: gemma-3
mengembalikan 404 walau ada di daftar), jadi script mencoba satu per satu.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

BASE = "https://integrate.api.nvidia.com/v1"
TIMEOUT = 180

# Diuji 2026-11-25 dengan teks sampel: kedua model ini membalas dengan tabel fakta.
# Keduanya salah memberi label "Kuat" untuk fakta dari satu sumber, jadi hasilnya draf saja.
CADANGAN = [
    "nvidia/nemotron-3.5-super-vl-120b-a12b",
    "nvidia/nemotron-3-ultra-550b-a55b",
    "nvidia/nemotron-3.5-bolt-e4b",
]


def call(method, path, key, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    r = urllib.request.Request(
        BASE + path,
        data=data,
        method=method,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(r, timeout=TIMEOUT) as resp:
        return json.loads(resp.read().decode("utf-8"))


def bangun_pesan(prompt, sumber_list):
    isi = prompt.strip()
    if sumber_list:
        blok = "\n\n".join(
            f"--- SUMBER {i} ---\n{s.strip()}" for i, s in enumerate(sumber_list, 1)
        )
        isi += (
            "\n\nAturan: pakai HANYA informasi dari SUMBER di bawah. "
            "Jangan menambah fakta dari luar. Jika tidak ada di sumber, tulis 'tidak ada di sumber'.\n\n"
            + blok
        )
    return [{"role": "user", "content": isi}]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True, help="file berisi instruksi")
    ap.add_argument("--input", action="append", default=[], help="file sumber teks (boleh berkali-kali)")
    ap.add_argument("--model", help="model yang dicoba pertama")
    ap.add_argument("--out", required=True, help="file hasil (.md)")
    args = ap.parse_args()

    key = os.environ.get("NVIDIA_API_KEY", "").strip()
    if not key:
        print("NVIDIA_API_KEY belum diset di environment.", file=sys.stderr)
        return 1

    with open(args.prompt, encoding="utf-8") as f:
        prompt = f.read()
    sumber = []
    for p in args.input:
        with open(p, encoding="utf-8") as f:
            sumber.append(f.read())
    if not sys.stdin.isatty() and not args.input:
        stdin_teks = sys.stdin.read()
        if stdin_teks.strip():
            sumber.append(stdin_teks)

    kandidat = ([args.model] if args.model else []) + [m for m in CADANGAN if m != args.model]
    galat = []
    for model in kandidat:
        body = {
            "model": model,
            "messages": bangun_pesan(prompt, sumber),
            "max_tokens": 4096,
            "temperature": 0.2,
        }
        try:
            out = call("POST", "/chat/completions", key, body)
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")[:200]
            galat.append(f"{model}: HTTP {e.code} {detail}")
            continue
        except urllib.error.URLError as e:
            galat.append(f"{model}: koneksi gagal {e.reason}")
            continue
        teks = out["choices"][0]["message"]["content"].strip()
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(f"<!-- model: {model} | dibuat oleh model NVIDIA, verifikasi ke sumber asli -->\n\n")
            f.write(teks + "\n")
        print(f"OK: {model} -> {args.out}")
        return 0

    print("Semua model gagal:", file=sys.stderr)
    for g in galat:
        print(" -", g, file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
