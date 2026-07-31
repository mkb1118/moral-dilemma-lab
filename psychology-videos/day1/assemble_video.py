"""Quick fix: just run FFmpeg video assembly with existing assets"""
import subprocess
import os

OUTPUT_DIR = r"E:\my project\psychology-videos\day1"
W, H = 1080, 1920
audio_path = os.path.join(OUTPUT_DIR, "audio.mp3")
vtt_path = os.path.join(OUTPUT_DIR, "subtitles.vtt")
output_path = os.path.join(OUTPUT_DIR, "final.mp4")

# Get audio duration
import json
result = subprocess.run(f'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "{audio_path}"',
                       shell=True, capture_output=True, text=True)
duration = float(result.stdout.strip())
print(f"Audio duration: {duration:.1f}s")

# Segment config
SEGMENTS = [
    ("cover.png", "你肯定有过这种感觉——走进教室，所有人都抬头看你；衣服上沾了块油渍，觉得全公司都在笑话你；说错一句话，半夜还在反复回放，尴尬到睡不着觉。"),
    ("card1-concept.png", "但今天我要告诉你一个扎心的真相：根本没那么多人在看你。这，就是心理学上著名的聚光灯效应。我们每个人都以为，自己站在舞台中央，聚光灯时刻打在脸上。但实际上——你只是台下观众里，连脸都看不清的路人甲。"),
    ("card2-experiment.png", "1999年，康奈尔大学的心理学家做了个实验。他们让一群大学生穿上一件印着过气歌手大头的T恤——对大学生来说，这等于社会性死亡。穿之前，学生们估计：至少会有一半的人注意到这件衣服。结果，你猜多少人注意到了？只有百分之二十三。连四分之一都不到。也就是说，你为了一件全世界都在看的事尴尬到半夜，其实四分之三的人根本没看见。"),
    ("card3-quote.png", "聚光灯效应告诉我们一件事：每个人都在忙着当自己人生的主角。你所谓的社死瞬间，在别人眼里可能连三秒都停留不了。所以，下次你因为一件小事尴尬到失眠——记住这句话：你在别人的人生里，连配角都算不上，顶多是个群演。"),
    ("cover.png", "你经历过哪些以为全世界都看到了其实根本没人在意的尴尬瞬间？在评论区说出来，我们一起把社死现场变成治愈现场。关注我，每天一个让你活得明白的心理学冷知识。"),
]

text_lengths = [len(t) for _, t in SEGMENTS]
total_len = sum(text_lengths)
segment_durations = [duration * tl / total_len for tl in text_lengths]
xfade_dur = 0.5

print("Segment timings:")
cumulative = 0
for i, (img, dur) in enumerate(zip([s[0] for s in SEGMENTS], segment_durations)):
    print(f"  {i}: {img} -> {dur:.1f}s")

# Build inputs
input_args = []
for img_name, dur in zip([s[0] for s in SEGMENTS], segment_durations):
    img_path = os.path.join(OUTPUT_DIR, img_name)
    input_args.append(f'-loop 1 -t {dur:.2f} -i "{img_path}"')
input_str = " ".join(input_args)

# Safe paths (forward slashes, escape colon for filter args)
def safe_filter_path(p):
    s = p.replace('\\', '/')
    if len(s) > 1 and s[1] == ':':
        s = s[0] + '\\:' + s[2:]
    return s

def safe_cmd_path(p):
    return p.replace('\\', '/')

vtt_safe = safe_filter_path(vtt_path)
output_safe = safe_cmd_path(output_path)

# Build filter with subtitles
scale_filters = []
for i in range(len(SEGMENTS)):
    scale_filters.append(f'[{i}:v]scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1[v{i}]')

xfade_filters = []
current = "[v0]"
cumulative_t = segment_durations[0] - xfade_dur
for i in range(1, len(SEGMENTS)):
    next_name = f"[x{i}]" if i < len(SEGMENTS)-1 else "[outv]"
    xfade_filters.append(f'{current}[v{i}]xfade=transition=fade:duration={xfade_dur}:offset={cumulative_t:.2f}{next_name}')
    current = next_name
    cumulative_t += segment_durations[i] - xfade_dur

# Try with subtitles
sub_filter = f'[outv]subtitles=\'{vtt_safe}\':force_style=\'FontSize=20,Alignment=2,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1\'[outvsub]'
filter_parts = scale_filters + xfade_filters + [sub_filter]
filter_graph = ";".join(filter_parts)

cmd = f'ffmpeg -y {input_str} -i "{safe_cmd_path(audio_path)}" -filter_complex "{filter_graph}" -map "[outvsub]" -map {len(SEGMENTS)}:a -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -shortest -pix_fmt yuv420p "{output_safe}"'

print("\nRunning FFmpeg...")
print(f"Filter graph length: {len(filter_graph)} chars")
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

if result.returncode != 0:
    print(f"Failed! {result.stderr[-500:]}")
    # Retry without subtitles
    print("\nRetrying without subtitles...")
    filter_parts2 = scale_filters + xfade_filters
    filter_graph2 = ";".join(filter_parts2)
    cmd2 = f'ffmpeg -y {input_str} -i "{safe_cmd_path(audio_path)}" -filter_complex "{filter_graph2}" -map "[outv]" -map {len(SEGMENTS)}:a -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -shortest -pix_fmt yuv420p "{output_safe}"'
    result2 = subprocess.run(cmd2, shell=True, capture_output=True, text=True)
    if result2.returncode != 0:
        print(f"Also failed! {result2.stderr[-500:]}")
    else:
        print(f"SUCCESS (no subtitles): {output_path}")
        print(f"Size: {os.path.getsize(output_path)/1024/1024:.1f} MB")
else:
    print(f"SUCCESS: {output_path}")
    print(f"Size: {os.path.getsize(output_path)/1024/1024:.1f} MB")
