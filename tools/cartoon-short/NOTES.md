# The Clocks Came Down: production notes

Peta: [[HOME]] · skill: `cartoon-3d-short` · alat lain: [[tools/README|tools]] · [[tools/cartoon-short/CREDITS|kredit]] · [[tools/cartoon-short/SCRIPT|naskah contoh]] · [[tools/cartoon-short/NASKAH_PERFORMA|naskah performa]] · [[tools/cartoon-short/audio/cues|cue audio]]

Original 70 s vertical short (1440x2560, 30 fps): flat 2D cartoon characters with round white heads and stick limbs in a
3D world, deadpan narrator, word-by-word captions. Built on the cartoon-3d-short template (three.js inside Remotion).

## Files
- `SCRIPT.md`: facts with sources, voice-over, set list.
- `audio/make_voice.py`: edge-tts voice (en-US-GuyNeural, +10 %) and word timings (`audio/words.json`).
- `audio/casino_mix.py`: original lounge/western/tense score and synthesized SFX, ducked under the voice.
  The mix is normalized to -14 LUFS with ffmpeg loudnorm into `audio/mix.wav`.
- `src/videos/casino/story.ts`: shots, camera keys, kicks, depth of field, character marks.
- `src/videos/casino/sets.ts`: CASINO (x 0), TOWN 1931 (x 400), SALOON (x 800), HOSPITAL (x 1200).
- `src/videos/casino/cast.ts`: who stands where per shot, expressions, props (phone, clipboard, money bags).
- `src/videos/casino/captions.tsx`: word-by-word captions from `words.json`.
- `src/videos/casino/Bridge.tsx`: composition (`CasinoShort`) and post chain.

## Commands (PowerShell, from this folder)
Stills at half size:
`$env:REMOTION_TMP="D:/remotion-tmp"; node scripts/bridge-stills.mjs out/stills/x_ 100,400 0.5`

Final render (the scale must be exactly 4/3, or Remotion rejects the 2559.94 px height):
`npx remotion render src/index.ts CasinoShort out/casino/video.mp4 --codec h264 --crf 16 --scale 1.3333333333333333 --gl=angle`

Mux the sound (Remotion writes a silent track, so map the video from the render and the audio from the mix):
`ffmpeg -i out/casino/video.mp4 -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k out/casino/The_Clocks_Came_Down.mp4`

## Gotchas found on this build
- `@react-three/postprocessing` v3 with fiber 9 rendered a blank frame. `Bridge.tsx` now drives the `postprocessing`
  EffectComposer directly from a `useFrame` at priority 1.
- Remotion temp bundles go to `D:/remotion-tmp`. Delete the `remotion-webpack-bundle-*` folders there when finished.
