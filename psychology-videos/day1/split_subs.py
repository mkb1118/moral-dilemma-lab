"""Split long subtitles into short phrases + rebuild video"""
import subprocess, os, re

OUTPUT_DIR = r"E:\my project\psychology-videos\day1"
audio_path = os.path.join(OUTPUT_DIR, "audio.mp3")

# ═══════════════════════════════════════════════
# Step 1: Split text into short phrases
# ═══════════════════════════════════════════════
print("[1/3] Splitting subtitles into short phrases...")

# Original subtitle entries: (start_sec, end_sec, text)
original_subs = [
    (0.100, 10.403, "你肯定有过这种感觉——走进教室，所有人都抬头看你；衣服上沾了块油渍，觉得全公司都在笑话你；说错一句话，半夜还在反复回放，尴尬到睡不着觉。"),
    (10.403, 14.346, "但今天我要告诉你一个扎心的真相：根本没那么多人在看你。"),
    (14.346, 17.250, "这，就是心理学上著名的聚光灯效应。"),
    (17.250, 21.990, "我们每个人都以为，自己站在舞台中央，聚光灯时刻打在脸上。"),
    (21.990, 25.942, "但实际上——你只是台下观众里，连脸都看不清的路人甲。"),
    (25.942, 29.557, "1999年，康奈尔大学的心理学家做了个实验。"),
    (29.557, 35.971, "他们让一群大学生穿上一件印着过气歌手大头的T恤——对大学生来说，这等于社会性死亡。"),
    (35.971, 40.269, "穿之前，学生们估计：至少会有一半的人注意到这件衣服。"),
    (40.269, 42.384, "结果，你猜多少人注意到了？"),
    (42.384, 43.903, "只有百分之二十三。"),
    (43.903, 45.461, "连四分之一都不到。"),
    (45.461, 51.692, "也就是说，你为了一件全世界都在看的事尴尬到半夜，其实四分之三的人根本没看见。"),
    (51.692, 56.201, "聚光灯效应告诉我们一件事：每个人都在忙着当自己人生的主角。"),
    (56.201, 60.480, "你所谓的社死瞬间，在别人眼里可能连三秒都停留不了。"),
    (60.480, 68.211, "所以，下次你因为一件小事尴尬到失眠——记住这句话：你在别人的人生里，连配角都算不上，顶多是个群演。"),
    (68.211, 72.692, "你经历过哪些以为全世界都看到了其实根本没人在意的尴尬瞬间？"),
    (72.692, 76.750, "在评论区说出来，我们一起把社死现场变成治愈现场。"),
    (76.750, 80.192, "关注我，每天一个让你活得明白的心理学冷知识。"),
]

def split_phrase(text):
    """Split Chinese text into short readable phrases"""
    # First split by punctuation
    parts = re.split(r'([，。！？；：、——])', text)

    phrases = []
    buffer = ""
    for part in parts:
        if re.match(r'^[，。！？；：、——]$', part):
            if buffer:
                phrases.append(buffer)
                buffer = ""
        elif part.strip():
            buffer += part
            # If buffer is long enough, flush it
            if len(buffer) >= 8:
                phrases.append(buffer)
                buffer = ""
    if buffer:
        phrases.append(buffer)

    # Merge very short phrases (1-2 chars) with neighbors
    merged = []
    for p in phrases:
        if merged and len(p) <= 2:
            merged[-1] += p
        else:
            merged.append(p)

    return [p for p in merged if p.strip()]

# Generate fine-grained subtitle entries
fine_subs = []
for start, end, text in original_subs:
    duration = end - start
    phrases = split_phrase(text)
    if not phrases:
        continue

    # Distribute time proportionally by character count
    char_counts = [len(p) for p in phrases]
    total_chars = sum(char_counts)

    t = start
    for phrase, cc in zip(phrases, char_counts):
        phrase_duration = duration * (cc / total_chars)
        # Minimum 0.8s, maximum 3.0s per phrase
        phrase_duration = max(0.8, min(3.0, phrase_duration))
        # Don't exceed sentence end
        phrase_end = min(t + phrase_duration, end)
        if phrase_end - t >= 0.3:  # at least 0.3s
            fine_subs.append((t, phrase_end, phrase))
        t = phrase_end

# Adjust to prevent overlapping
for i in range(len(fine_subs) - 1):
    if fine_subs[i][1] > fine_subs[i+1][0]:
        # Push next start to current end
        fine_subs[i+1] = (fine_subs[i][1], fine_subs[i+1][1], fine_subs[i+1][2])

print(f"  Original: {len(original_subs)} entries → Split: {len(fine_subs)} entries")

# ═══════════════════════════════════════════════
# Step 2: Write new SRT file
# ═══════════════════════════════════════════════
print("[2/3] Writing fine-grained SRT...")

def format_srt_time(seconds):
    ms = int((seconds % 1) * 1000)
    total_sec = int(seconds)
    h = total_sec // 3600
    m = (total_sec % 3600) // 60
    s = total_sec % 60
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

srt_path = os.path.join(OUTPUT_DIR, "fine_subtitles.srt")
with open(srt_path, 'w', encoding='utf-8') as f:
    for i, (start, end, text) in enumerate(fine_subs, 1):
        f.write(f"{i}\n")
        f.write(f"{format_srt_time(start)} --> {format_srt_time(end)}\n")
        f.write(f"{text}\n\n")

print(f"  Written: {srt_path}")

# ═══════════════════════════════════════════════
# Step 3: Rebuild video with fine-grained subtitles
# ═══════════════════════════════════════════════
print("[3/3] Rebuilding video with per-phrase subtitles...")

result = subprocess.run(f'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "{audio_path}"', shell=True, capture_output=True, text=True)
duration = float(result.stdout.strip())

W, H = 1080, 1920
CONTENT_H = 1632
SEGMENTS = [("cover.png",99),("card1-concept.png",103),("card2-experiment.png",169),("card3-quote.png",110),("cover.png",79)]
total_len = sum(n for _,n in SEGMENTS)
segment_durations = [duration*n/total_len for _,n in SEGMENTS]
xfade_dur = 0.5

input_args = []
for (img_name,_), dur in zip(SEGMENTS, segment_durations):
    input_args.append(f'-loop 1 -t {dur:.2f} -i "{os.path.join(OUTPUT_DIR, img_name)}"')

def sfp(p):
    s = p.replace('\\','/')
    if len(s)>1 and s[1]==':': s = s[0]+'\\:'+s[2:]
    return s

srt_safe = sfp(srt_path)
output_safe = os.path.join(OUTPUT_DIR, "final.mp4").replace('\\','/')
audio_safe = audio_path.replace('\\','/')

scale_filters = []
for i in range(len(SEGMENTS)):
    scale_filters.append(f'[{i}:v]crop={W}:{CONTENT_H}:0:0,pad={W}:{H}:0:0:black,setsar=1,fps=30[v{i}]')

xfade_filters, current, ct = [], "[v0]", segment_durations[0]-xfade_dur
for i in range(1,len(SEGMENTS)):
    nn = f"[x{i}]" if i<len(SEGMENTS)-1 else "[outv]"
    xfade_filters.append(f'{current}[v{i}]xfade=transition=fade:duration={xfade_dur}:offset={ct:.2f}{nn}')
    current, ct = nn, ct+segment_durations[i]-xfade_dur

sub_style = (
    'FontName=Microsoft YaHei,'
    'FontSize=19,'
    'Bold=1,'
    'Alignment=2,'
    'MarginV=55,'
    'MarginL=40,'
    'MarginR=40,'
    'PrimaryColour=&H00E6F0F5,'
    'OutlineColour=&H80000000,'
    'Outline=2,'
    'Shadow=1,'
    'ShadowColour=&H40000000,'
    'BorderStyle=1'
)
sub_filter = f'[outv]subtitles=\'{srt_safe}\':force_style=\'{sub_style}\'[outvsub]'
filter_graph = ";".join(scale_filters + xfade_filters + [sub_filter])

cmd = (
    f'ffmpeg -y {" ".join(input_args)} -i "{audio_safe}" '
    f'-filter_complex "{filter_graph}" '
    f'-map "[outvsub]" -map {len(SEGMENTS)}:a '
    f'-c:v libx264 -preset fast -crf 22 '
    f'-c:a aac -b:a 128k '
    f'-shortest -pix_fmt yuv420p '
    f'"{output_safe}"'
)

print(f"  Filter: {len(filter_graph)} chars")
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

if result.returncode == 0:
    size_mb = os.path.getsize(os.path.join(OUTPUT_DIR, "final.mp4")) / (1024*1024)
    print(f"  [OK] final.mp4 — {size_mb:.1f}MB, {duration:.0f}s")
    print(f"  Subtitles: {len(fine_subs)} short phrases, one at a time")
else:
    print(f"  [FAIL] {result.stderr[-400:]}")
