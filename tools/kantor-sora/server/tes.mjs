// Tes kecil parser server: node server/tes.mjs
import assert from 'node:assert/strict';
import { bacaStatus, normalisasi, ringkasAlat } from './api.mjs';

const st = bacaStatus(`Judul kerja: Uji
Channel: channel-01

| Tahap | Agent | File | Status | Catatan |
|---|---|---|---|---|
| 1 Tren | ENVY | 01-tren.md | 🔄 | sedang cari |
| ✋ Gerbang 1 | Tuan | — | ⏳ | ! pilih hook |
`);
assert.equal(st.judul, 'Uji');
assert.equal(st.baris.length, 2);
assert.deepEqual([st.baris[0].agen, st.baris[0].status, st.baris[0].catatan], ['envy', '🔄', 'sedang cari']);
assert.equal(st.baris[1].status, '⏳');

const peta = new Map();
const a = normalisasi({ type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'tool_use', id: 't1', name: 'Agent', input: { subagent_type: 'sora-envy', description: 'cari tren' } }] } }, peta);
assert.deepEqual([a[0].jenis, a[0].agen], ['tugaskan', 'envy']);
const b = normalisasi({ type: 'assistant', parent_tool_use_id: 't1', message: { content: [{ type: 'tool_use', id: 't2', name: 'WebSearch', input: { query: 'tren tiktok' } }] } }, peta);
assert.deepEqual([b[0].jenis, b[0].agen, b[0].ringkas], ['alat', 'envy', 'tren tiktok']);
const c = normalisasi({ type: 'user', parent_tool_use_id: null, message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: [{ type: 'text', text: 'selesai' }] }] } }, peta);
assert.deepEqual([c[0].jenis, c[0].agen, c[0].selesaiAgen], ['hasil', 'envy', true]);
assert.equal(ringkasAlat('TodoWrite', { todos: [{ content: 'a', status: 'completed' }] }), '☑ a');
console.log('tes server lulus');
