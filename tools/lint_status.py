"""Lint status.md semua produksi + cek duplikasi ledger.

Pemakaian:
  python tools/lint_status.py                 # periksa semua productions/*/status.md
  python tools/lint_status.py --ledger "taksi nintendo"   # cari kata kunci di ledger semua channel
Exit code 1 kalau ada masalah status.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SIMBOL = {'⏳', '🔄', '✅', '❌'}


def baris_tabel(teks):
    for line in teks.splitlines():
        t = line.strip()
        if not t.startswith('|'):
            continue
        sel = [s.strip() for s in t.strip('|').split('|')]
        if len(sel) < 4 or re.match(r'^:?-{2,}', sel[0]) or sel[0].lower() == 'tahap':
            continue
        yield sel


def lint_status():
    masalah = []
    for st in sorted(ROOT.glob('productions/*/status.md')):
        if st.parent.name.startswith('_'):
            continue
        rows = list(baris_tabel(st.read_text(encoding='utf-8')))
        id_ = st.parent.name
        sedang = [r[0] for r in rows if '🔄' in r[3]]
        for i, r in enumerate(rows):
            s = r[3]
            if not any(x in s for x in SIMBOL):
                masalah.append(f'{id_}: tahap "{r[0]}" status tidak dikenal "{s}" (pakai ⏳ 🔄 ✅ ❌, tanpa cuti)')
            if '✅' in s and 'gerbang' not in r[0].lower() and not re.search(r'dirangkap|0 klip', r[4] if len(r) > 4 else ''):
                for f in [x.strip() for x in r[2].split(',')]:
                    if f.endswith('.md') and not (st.parent / f).exists():
                        masalah.append(f'{id_}: "{r[0]}" ✅ tapi {f} tidak ada')
            if '✅' in s and i > 0 and 'gerbang' in rows[i - 1][0].lower() and '✅' not in rows[i - 1][3]:
                masalah.append(f'{id_}: "{r[0]}" ✅ padahal "{rows[i - 1][0]}" belum ✅ (gerbang dilewati?)')
        if len(sedang) > 3:
            masalah.append(f'{id_}: {len(sedang)} tahap 🔄 sekaligus ({", ".join(sedang)}), lupa menutup?')
        g_suara = next((r for r in rows if 'gerbang suara' in r[0].lower()), None)
        if g_suara and '✅' in g_suara[3] and not (st.parent / 'audio' / 'vo.mp3').exists():
            masalah.append(f'{id_}: Gerbang Suara ✅ tapi audio/vo.mp3 tidak ada')
    return masalah


def cari_ledger(kunci):
    kata = [k.lower() for k in re.findall(r'\w+', kunci) if len(k) > 2]
    for lg in sorted(ROOT.glob('channels/*/ledger.md')):
        if lg.parent.name.startswith('_'):
            continue
        for n, line in enumerate(lg.read_text(encoding='utf-8').splitlines(), 1):
            low = line.lower()
            kena = [k for k in kata if k in low]
            if kena and line.strip().startswith('|'):
                print(f'{lg.relative_to(ROOT)}:{n}: [{", ".join(kena)}] {line.strip()[:160]}')


if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == '--ledger':
        cari_ledger(' '.join(sys.argv[2:]))
        sys.exit(0)
    m = lint_status()
    for x in m:
        print('❌', x)
    print('status.md: OK' if not m else f'{len(m)} masalah')
    sys.exit(1 if m else 0)
