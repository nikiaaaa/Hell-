# Finds the anchor phrases of the v2 script in words.json IN ORDER and writes beats.json (seconds + TOTAL frames),
# the single source of timing for story.ts, the sound mix and the QA shot list. A missing phrase is an error.
# usage: python -I audio/beats.py <words.json> <beats.json>
import json, math, re, sys

words = json.load(open(sys.argv[1], encoding="utf-8"))
norm = lambda x: re.sub(r"[^a-z0-9'-]", "", x.lower().replace("’", "'"))
toks = [norm(w["w"]) for w in words]
ANCHORS = [
    ("andEverybody", "and everybody"), ("they", "they want"), ("lose", "lose track"), ("noClocks", "no clocks"), ("noWindows", "no windows"),
    ("just", "just you"), ("slot", "slot machine"), ("carpet", "carpet"), ("headache", "headache"), ("but", "but it didn't"),
    ("in1931", "in nineteen"), ("nevada", "nevada"), ("legal", "legal"), ("firstCasinos", "the first casinos"), ("big", "big clocks"),
    ("then", "then the biggest"), ("complain", "complain"), ("aMan", "a man"), ("lost", "lost his ranch"), ("threeAM", "three in the morning"),
    ("does", "does not"), ("telling", "telling him"), ("so", "so the high"), ("deal", "deal"), ("take", "take the clocks"), ("orWe", "or we stop"),
    ("andDown", "and down"), ("came", "came"), ("luckily", "luckily"), ("unluckily", "unluckily"), ("mostMoney", "most money"),
    ("think", "think of"), ("hospital", "hospital"), ("nobody", "nobody has"), ("years", "years later"), ("fifteen", "fifteen"),
    ("found", "found no"), ("proof", "proof"), ("soThe", "so the casinos"), ("theGamblers", "the gamblers hid"), ("themselves", "themselves"),
    ("andToday", "and today"), ("theClock", "the clock is"), ("pocket", "pocket"), ("right", "right next"), ("money", "money you're"), ("loseEnd", "lose"),
]
out, i = {}, 0
for key, phrase in ANCHORS:
    p = phrase.split()
    while i <= len(toks) - len(p) and toks[i : i + len(p)] != p: i += 1
    if i > len(toks) - len(p): sys.exit(f"anchor not found in order: {key} = '{phrase}'")
    out[key] = words[i]["s"]; out[key + "_e"] = words[i + len(p) - 1]["e"]; i += len(p)
out["end"] = words[-1]["e"]
out["TOTAL"] = math.ceil((words[-1]["e"] + 1.7) * 30)
json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), indent=1)
print(len(ANCHORS), "anchors, TOTAL", out["TOTAL"], "frames =", round(out["TOTAL"] / 30, 2), "s")
