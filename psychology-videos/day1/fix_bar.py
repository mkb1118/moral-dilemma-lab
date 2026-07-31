"""Quick fix: add dark letterbox bar using overlay approach"""
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

# Scale
scale_filters = [f'[{i}:v]scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v{i}]' for i in range(len(SEGMENTS))]

# Xfade
xfade_filters, current, ct = [], "[v0]", segment_durations[0]-xfade_dur
for i in range(1,len(SEGMENTS)):
    nn = f"[x{i}]" if i<len(SEGMENTS)-1 else "[outv]"
    xfade_filters.append(f'{current}[v{i}]xfade=transition=fade:duration={xfade_dur}:offset={ct:.2f}{nn}')
    current, ct = nn, ct+segment_durations[i]-xfade_dur

# Dark letterbox — use color source + overlay (more reliable than drawbox)
bar_h = int(H * 0.16)  # 16% height = ~307px
bar_y = H - bar_h       # bottom aligned
bar_filter = f'color=0x000000@0.25:size={W}x{bar_h}:rate=30,format=rgba[bar];[outv][bar]overlay=0:{bar_y}[outv_bar]'

# Subtitles on top
sub_style = (
    'FontName=Microsoft YaHei,'
    'FontSize=20,'
    'Bold=1,'
    'Alignment=2,'
    'MarginV=85,'
    'MarginL=40,'
    'MarginR=40,'
    'PrimaryColour=&H00E6F0F5,'   # warm off-white #F5F0E6
    'OutlineColour=&H80000000,'   # 50% black outline
    'Outline=2,'
    'Shadow=1,'
    'ShadowColour=&H40000000,'    # 25% black shadow
    'BorderStyle=1'
)
sub_filter = f'[outv_bar]subtitles=\'{vtt_safe}\':force_style=\'{sub_style}\'[outvsub]'

filter_graph = ";".join(scale_filters + xfade_filters + [bar_filter, sub_filter])

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
print("Running FFmpeg...")
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

if result.returncode == 0:
    size_mb = os.path.getsize(output_path)/(1024*1024)
    print(f"OK! {size_mb:.1f}MB, {duration:.0f}s")
else:
    print(f"Failed: {result.stderr[-400:]}")
