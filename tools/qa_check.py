"""Cek teknis otomatis master video SORA (dipakai SLOTH sebelum serah, dan WRATH di langkah 1).

Pemakaian:  python tools/qa_check.py productions/<ID>
Hasil: tabel di terminal + export/qa.json. Exit code 1 kalau ada GAGAL.
Butuh ffmpeg/ffprobe di PATH.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

DUR_MIN, DUR_MAX = 30.0, 60.0


def jalan(args):
    return subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace')


def master_dari(folder: Path) -> Path | None:
    cands = sorted(folder.glob('export/*_master.mp4'))
    return cands[0] if cands else None


def cek(folder: Path):
    hasil = []
    tambah = lambda nama, ok, nilai, perbaiki='SLOTH': hasil.append({'cek': nama, 'status': 'OK' if ok else 'GAGAL', 'nilai': nilai, 'kembali_ke': None if ok else perbaiki})

    m = master_dari(folder)
    if not m:
        tambah('master ada', False, 'export/*_master.mp4 tidak ditemukan')
        return None, hasil
    info = json.loads(jalan(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(m)]).stdout)
    v = next((s for s in info['streams'] if s['codec_type'] == 'video'), {})
    a = next((s for s in info['streams'] if s['codec_type'] == 'audio'), {})
    dur = float(info['format']['duration'])
    num, den = (v.get('r_frame_rate', '0/1').split('/') + ['1'])[:2]
    fps = float(num) / float(den or 1)

    tambah('resolusi 1080x1920', (v.get('width'), v.get('height')) == (1080, 1920), f"{v.get('width')}x{v.get('height')}")
    tambah('fps 30', abs(fps - 30) < 0.01, round(fps, 3))
    tambah('video H.264', v.get('codec_name') == 'h264', v.get('codec_name'))
    tambah('audio AAC', a.get('codec_name') == 'aac', a.get('codec_name') or 'tidak ada audio')
    tambah(f'durasi {DUR_MIN:.0f}–{DUR_MAX:.0f} dtk', DUR_MIN <= dur <= DUR_MAX, round(dur, 2))

    if a:
        out = jalan(['ffmpeg', '-hide_banner', '-nostats', '-i', str(m), '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
        ringkas = out[out.rfind('Summary:'):]
        i = re.search(r'I:\s+(-?[\d.]+) LUFS', ringkas)
        tp = re.search(r'Peak:\s+(-?[\d.]+) dBFS', ringkas)
        lufs = float(i.group(1)) if i else None
        peak = float(tp.group(1)) if tp else None
        tambah('loudness -14 LUFS (±1)', lufs is not None and abs(lufs + 14) <= 1, lufs, 'TEMPERANCE')
        tambah('true peak ≤ -1 dBTP', peak is not None and peak <= -1.0, peak, 'TEMPERANCE')

    out = jalan(['ffmpeg', '-hide_banner', '-nostats', '-i', str(m), '-vf', 'blackdetect=d=0.1:pix_th=0.10,freezedetect=n=0.003:d=0.8', '-an', '-f', 'null', '-']).stderr
    hitam = re.findall(r'black_start:([\d.]+)', out)
    beku = re.findall(r'freeze_start: ([\d.]+)', out)
    tambah('tanpa frame hitam', not hitam, [float(x) for x in hitam][:10], 'KINDNESS')
    tambah('tanpa frame beku ≥ 0,8 dtk', not beku, [float(x) for x in beku][:10], 'KINDNESS')

    vo = folder / 'audio' / 'vo.mp3'
    if vo.exists():
        dvo = float(jalan(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(vo)]).stdout.strip() or 0)
        tambah('master tidak memotong VO', dur + 0.05 >= dvo, f'VO {dvo:.2f} dtk vs master {dur:.2f} dtk')
    else:
        tambah('VO dari Tuan ada (audio/vo.mp3)', False, 'tidak ada: suara harus dari ElevenLabs Tuan', 'TEMPERANCE')

    if (folder / 'audio' / 'words.json').exists():
        w = json.loads((folder / 'audio' / 'words.json').read_text(encoding='utf-8'))
        akhir = max((x.get('e', x.get('end', 0)) for x in w), default=0)
        tambah('kata terakhir di dalam durasi', akhir <= dur + 0.05, f'kata terakhir {akhir:.2f} dtk')

    return m, hasil


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    folder = Path(sys.argv[1]).resolve()
    m, hasil = cek(folder)
    gagal = [h for h in hasil if h['status'] == 'GAGAL']
    for h in hasil:
        print(f"{'✅' if h['status'] == 'OK' else '❌'} {h['cek']}: {h['nilai']}" + (f"  → {h['kembali_ke']}" if h['kembali_ke'] else ''))
    print(f"\nTEKNIS: {'GAGAL' if gagal else 'LULUS'} ({len(gagal)} gagal dari {len(hasil)})")
    keluar = folder / 'export' / 'qa.json'
    if keluar.parent.exists():
        keluar.write_text(json.dumps({'master': str(m) if m else None, 'lulus': not gagal, 'hasil': hasil}, ensure_ascii=False, indent=2), encoding='utf-8')
    sys.exit(1 if gagal else 0)


if __name__ == '__main__':
    main()
