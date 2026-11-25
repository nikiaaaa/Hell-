"""Timestamp per kata dari VO ElevenLabs milik Tuan (dipakai TEMPERANCE, tahap 6).

Pemakaian:  python tools/words_whisper.py productions/<ID> [--model small] [--audio audio/vo.mp3]
Membaca audio/vo.mp3 dan naskah final (bagian "## Naskah lengkap" di 04-naskah.md), lalu menulis
audio/words.json berformat [{"w": kata_naskah, "s": mulai, "e": akhir}] yang dibaca captions.tsx.
Kata diambil dari naskah (ejaan benar), waktunya dari faster-whisper (GPU bila ada).
Tidak membuat suara apa pun.
"""
import argparse
import difflib
import json
import re
import sys
from pathlib import Path


def naskah_kata(folder: Path, teks_file: str | None):
    if teks_file:
        isi = (folder / teks_file).read_text(encoding='utf-8')
    else:
        teks = (folder / '04-naskah.md').read_text(encoding='utf-8')
        m = re.search(r'^##\s*Naskah lengkap.*?$(.*?)(?=^##\s|\Z)', teks, re.S | re.M | re.I)
        if not m:
            sys.exit('Bagian "## Naskah lengkap" tidak ada di 04-naskah.md. Pakai --teks <file teks bersih>.')
        isi = m.group(1)
    isi = re.sub(r'\[[A-Za-z /&]+\]', ' ', isi)          # [HOOK] dst.
    isi = re.sub(r'\*\*|__|`', '', isi)
    return [w for w in isi.split() if re.search(r'\w', w)]


def norm(w):
    return re.sub(r'[^\w]', '', w.lower())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('folder')
    ap.add_argument('--model', default='small')
    ap.add_argument('--audio', default='audio/vo.mp3')
    ap.add_argument('--teks', default=None, help='file teks naskah bersih (relatif ke folder), pengganti 04-naskah.md')
    a = ap.parse_args()
    folder = Path(a.folder).resolve()
    audio = folder / a.audio
    if not audio.exists():
        sys.exit(f'{audio} belum ada. Minta Tuan membuat VO di ElevenLabs dulu (tanpa TTS cadangan).')

    import subprocess
    import numpy as np
    from faster_whisper import WhisperModel
    # Decode sendiri lewat ffmpeg (PyAV bawaan faster-whisper kadang tidak cocok versinya).
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(audio), '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
    data = np.frombuffer(pcm, dtype=np.float32)

    def dengarkan(device, compute):
        model = WhisperModel(a.model, device=device, compute_type=compute)
        segs, _ = model.transcribe(data, language='id', word_timestamps=True, vad_filter=False)
        return [(w.word.strip(), w.start, w.end) for s in segs for w in (s.words or []) if w.word.strip()]

    try:
        dengar = dengarkan('cuda', 'float16')
    except Exception as e:  # mis. cuBLAS/cuDNN belum terpasang → CPU (lebih lambat, hasil sama)
        print(f'GPU tidak bisa dipakai ({str(e)[:80]}), pakai CPU.')
        dengar = dengarkan('cpu', 'int8')

    skrip = naskah_kata(folder, a.teks)
    sm = difflib.SequenceMatcher(a=[norm(w) for w in skrip], b=[norm(w[0]) for w in dengar], autojunk=False)
    waktu = [None] * len(skrip)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            _, s, e = dengar[blk.b + k]
            waktu[blk.a + k] = (s, e)
    cocok = sum(t is not None for t in waktu)

    # Isi kata yang tidak cocok dengan interpolasi di antara tetangga yang cocok.
    total = len(data) / 16000
    i = 0
    while i < len(waktu):
        if waktu[i] is not None:
            i += 1
            continue
        j = i
        while j < len(waktu) and waktu[j] is None:
            j += 1
        kiri = waktu[i - 1][1] if i > 0 else 0.0
        kanan = waktu[j][0] if j < len(waktu) else total
        langkah = (kanan - kiri) / (j - i)
        for k in range(i, j):
            waktu[k] = (kiri + (k - i) * langkah, kiri + (k - i + 1) * langkah)
        i = j

    out = [{'w': w, 's': round(s, 3), 'e': round(e, 3)} for w, (s, e) in zip(skrip, waktu)]
    (folder / 'audio' / 'words.json').write_text(json.dumps(out, ensure_ascii=False), encoding='utf-8')
    print(f'words.json: {len(out)} kata, {cocok} cocok langsung ({cocok / max(1, len(out)):.0%}), durasi VO {total:.2f} dtk')
    if cocok / max(1, len(out)) < 0.85:
        print('Peringatan: < 85% kata cocok. Cek apakah VO memakai naskah final, lalu periksa words.json manual.')
    if not 30 <= total <= 60:
        print(f'Peringatan: durasi VO {total:.1f} dtk di luar 30–60. Lapor Tuan (atur speed/regenerasi), jangan dipotong.')


if __name__ == '__main__':
    main()
