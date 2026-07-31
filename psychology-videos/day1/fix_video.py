"""Regenerate TTS at 1.3x speed + rebuild video with better subtitles"""
import subprocess
import os
import math

OUTPUT_DIR = r"E:\my project\psychology-videos\day1"
W, H = 1080, 1920

# ═══════════════════════════════════════════════
# Step 1: Regenerate faster TTS
# ═══════════════════════════════════════════════
print("[1/3] Generating TTS at 1.3x speed...")

VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "+30%"
text_file = os.path.join(OUTPUT_DIR, "script_text.txt")
audio_path = os.path.join(OUTPUT_DIR, "audio.mp3")
vtt_path = os.path.join(OUTPUT_DIR, "subtitles.vtt")

# Rebuild text file from segments
SEGMENTS = [
    "你肯定有过这种感觉——走进教室，所有人都抬头看你；衣服上沾了块油渍，觉得全公司都在笑话你；说错一句话，半夜还在反复回放，尴尬到睡不着觉。",
    "但今天我要告诉你一个扎心的真相：根本没那么多人在看你。这，就是心理学上著名的聚光灯效应。我们每个人都以为，自己站在舞台中央，聚光灯时刻打在脸上。但实际上——你只是台下观众里，连脸都看不清的路人甲。",
    "1999年，康奈尔大学的心理学家做了个实验。他们让一群大学生穿上一件印着过气歌手大头的T恤——对大学生来说，这等于社会性死亡。穿之前，学生们估计：至少会有一半的人注意到这件衣服。结果，你猜多少人注意到了？只有百分之二十三。连四分之一都不到。也就是说，你为了一件全世界都在看的事尴尬到半夜，其实四分之三的人根本没看见。",
    "聚光灯效应告诉我们一件事：每个人都在忙着当自己人生的主角。你所谓的社死瞬间，在别人眼里可能连三秒都停留不了。所以，下次你因为一件小事尴尬到失眠——记住这句话：你在别人的人生里，连配角都算不上，顶多是个群演。",
    "你经历过哪些以为全世界都看到了其实根本没人在意的尴尬瞬间？在评论区说出来，我们一起把社死现场变成治愈现场。关注我，每天一个让你活得明白的心理学冷知识。",
]

full_text = "".join(SEGMENTS)
with open(text_file, 'w', encoding='utf-8') as f:
    f.write(full_text)

cmd = f'edge-tts --voice {VOICE} --rate={RATE} -f "{text_file}" --write-media "{audio_path}" --write-subtitles "{vtt_path}"'
print(f"  {cmd[:100]}...")
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
if result.returncode != 0:
    print(f"  [ERROR] {result.stderr}")
    exit(1)

# ═══════════════════════════════════════════════
# Step 2: Get new duration
# ═══════════════════════════════════════════════
print("\n[2/3] Getting audio duration...")
result = subprocess.run(f'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "{audio_path}"',
                       shell=True, capture_output=True, text=True)
duration = float(result.stdout.strip())
print(f"  New duration: {duration:.1f}s (was 104.3s, now {(1-duration/104.3)*100:.0f}% faster)")

# ═══════════════════════════════════════════════
# Step 3: Build video with better subtitles
# ═══════════════════════════════════════════════
print("\n[3/3] Assembling video with optimized subtitles...")

IMG_NAMES = ["cover.png", "card1-concept.png", "card2-experiment.png", "card3-quote.png", "cover.png"]

text_lengths = [len(t) for t in SEGMENTS]
total_len = sum(text_lengths)
segment_durations = [duration * tl / total_len for tl in text_lengths]
xfade_dur = 0.5

print("  Segment timings:")
for i, (img, dur) in enumerate(zip(IMG_NAMES, segment_durations)):
    print(f"    {i}: {img} -> {dur:.1f}s")

# Build inputs
input_args = []
for img_name, dur in zip(IMG_NAMES, segment_durations):
    img_path = os.path.join(OUTPUT_DIR, img_name)
    input_args.append(f'-loop 1 -t {dur:.2f} -i "{img_path}"')
input_str = " ".join(input_args)

def safe_filter_path(p):
    s = p.replace('\\', '/')
    if len(s) > 1 and s[1] == ':':
        s = s[0] + '\\:' + s[2:]
    return s

def safe_cmd_path(p):
    return p.replace('\\', '/')

vtt_safe = safe_filter_path(vtt_path)
output_safe = safe_cmd_path(os.path.join(OUTPUT_DIR, "final.mp4"))
audio_safe = safe_cmd_path(audio_path)

# Scale all inputs
scale_filters = []
for i in range(len(IMG_NAMES)):
    scale_filters.append(f'[{i}:v]scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v{i}]')

# Xfade chain
xfade_filters = []
current = "[v0]"
cumulative_t = segment_durations[0] - xfade_dur
for i in range(1, len(IMG_NAMES)):
    next_name = f"[x{i}]" if i < len(IMG_NAMES)-1 else "[outv]"
    xfade_filters.append(f'{current}[v{i}]xfade=transition=fade:duration={xfade_dur}:offset={cumulative_t:.2f}{next_name}')
    current = next_name
    cumulative_t += segment_durations[i] - xfade_dur

# Optimized subtitle styling:
# - Semi-transparent white text (CC = ~80% opacity)
# - Semi-transparent dark outline (66 = ~40% opacity)
# - More bottom margin (MarginV=60)
# - Clean outline, subtle shadow
sub_style = (
    'FontName=Microsoft YaHei,'
    'FontSize=20,'
    'Alignment=2,'
    'MarginV=65,'
    'PrimaryColour=&HCCFFFFFF,'
    'OutlineColour=&H66000000,'
    'Outline=2.5,'
    'Shadow=1,'
    'BorderStyle=1,'
    'Bold=0'
)

sub_filter = f'[outv]subtitles=\'{vtt_safe}\':force_style=\'{sub_style}\'[outvsub]'
filter_parts = scale_filters + xfade_filters + [sub_filter]
filter_graph = ";".join(filter_parts)

cmd = (
    f'ffmpeg -y {input_str} -i "{audio_safe}" '
    f'-filter_complex "{filter_graph}" '
    f'-map "[outvsub]" -map {len(IMG_NAMES)}:a '
    f'-c:v libx264 -preset fast -crf 22 '
    f'-c:a aac -b:a 128k '
    f'-shortest -pix_fmt yuv420p '
    f'"{output_safe}"'
)

print(f"  Running FFmpeg...")
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

if result.returncode != 0:
    print(f"  [FAIL] {result.stderr[-500:]}")
    exit(1)

size_mb = os.path.getsize(os.path.join(OUTPUT_DIR, "final.mp4")) / (1024*1024)
print(f"\n  [OK] final.mp4 - {size_mb:.1f} MB, {duration:.0f}s")
print(f"  Font: Microsoft YaHei | Outline semi-transparent | Margin bottom 65px")
