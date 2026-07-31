"""Redesign: shrink images to leave dedicated subtitle safe zone at bottom"""
import subprocess, os

OUTPUT_DIR = r"E:\my project\psychology-videos\day1"
W, H = 1080, 1920
audio_path = os.path.join(OUTPUT_DIR, "audio.mp3")
vtt_path = os.path.join(OUTPUT_DIR, "subtitles.vtt")
output_path = os.path.join(OUTPUT_DIR, "final.mp4")

result = subprocess.run(f'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "{audio_path}"', shell=True, capture_output=True, text=True)
duration = float(result.stdout.strip())
print(f"Audio: {duration:.1f}s")

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

vtt_safe = sfp(vtt_path)
output_safe = os.path.join(OUTPUT_DIR, "final.mp4").replace('\\','/')
audio_safe = audio_path.replace('\\','/')

# === KEY FIX: shrink images to leave subtitle safe zone ===
# Content area: 1080 x 1632 (upper 85%)
# Subtitle zone: 1080 x 288 (bottom 15%, ~288px)
CONTENT_H = 1632
PAD_TOP = 0  # content at very top, subtitle zone at bottom

# Crop upper 85% of each image, add black subtitle bar at bottom
# This avoids letterboxing: full width, no side bars
scale_filters = []
for i in range(len(SEGMENTS)):
    scale_filters.append(
        f'[{i}:v]crop={W}:{CONTENT_H}:0:0,'
        f'pad={W}:{H}:0:{PAD_TOP}:black,'
        f'setsar=1,fps=30[v{i}]'
    )

# Xfade
xfade_filters, current, ct = [], "[v0]", segment_durations[0]-xfade_dur
for i in range(1,len(SEGMENTS)):
    nn = f"[x{i}]" if i<len(SEGMENTS)-1 else "[outv]"
    xfade_filters.append(f'{current}[v{i}]xfade=transition=fade:duration={xfade_dur}:offset={ct:.2f}{nn}')
    current, ct = nn, ct+segment_durations[i]-xfade_dur

# Subtitles now safely in the bottom black zone (288px)
# - Alignment=2 (bottom center)
# - MarginV=60 (within the 288px safe zone, ~60px from bottom edge)
# - Same warm styling as before
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
sub_filter = f'[outv]subtitles=\'{vtt_safe}\':force_style=\'{sub_style}\'[outvsub]'

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

print(f"Filter: {len(filter_graph)} chars")
print("Running FFmpeg (content 85% + subtitle zone 15%)...")
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

if result.returncode == 0:
    size_mb = os.path.getsize(output_path)/(1024*1024)
    print(f"OK! {size_mb:.1f}MB, {duration:.0f}s")
    print("Layout: upper 85% = image content | bottom 15% = subtitle safe zone")
else:
    print(f"Failed: {result.stderr[-500:]}")
