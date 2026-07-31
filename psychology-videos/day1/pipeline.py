"""
Pipeline: Full-auto psychology video production
Input: Script segments → Output: Final .mp4 with voiceover + images + subtitles

Dependencies: edge-tts, Pillow, ffmpeg
"""
import subprocess
import os
import re
import math
import sys
import asyncio
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ═══════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════
OUTPUT_DIR = r"E:\my project\psychology-videos\day1"
VOICE = "zh-CN-XiaoxiaoNeural"  # Warm storytelling female voice
W, H = 1080, 1920
FONT_SERIF = r"C:\Windows\Fonts\Source Han Serif SC Heavy (TrueType).ttf"
FONT_SANS = r"C:\Windows\Fonts\SourceHanSansCN-Normal.ttf"
FONT_HEI = r"C:\Windows\Fonts\simhei.ttf"

# Each segment: (image_filename, spoken_text)
SEGMENTS = [
    ("cover.png", "你肯定有过这种感觉——走进教室，所有人都抬头看你；衣服上沾了块油渍，觉得全公司都在笑话你；说错一句话，半夜还在反复回放，尴尬到睡不着觉。"),
    ("card1-concept.png", "但今天我要告诉你一个扎心的真相：根本没那么多人在看你。这，就是心理学上著名的聚光灯效应。我们每个人都以为，自己站在舞台中央，聚光灯时刻打在脸上。但实际上——你只是台下观众里，连脸都看不清的路人甲。"),
    ("card2-experiment.png", "1999年，康奈尔大学的心理学家做了个实验。他们让一群大学生穿上一件印着过气歌手大头的T恤——对大学生来说，这等于社会性死亡。穿之前，学生们估计：至少会有一半的人注意到这件衣服。结果，你猜多少人注意到了？只有百分之二十三。连四分之一都不到。也就是说，你为了一件全世界都在看的事尴尬到半夜，其实四分之三的人根本没看见。"),
    ("card3-quote.png", "聚光灯效应告诉我们一件事：每个人都在忙着当自己人生的主角。你所谓的社死瞬间，在别人眼里可能连三秒都停留不了。所以，下次你因为一件小事尴尬到失眠——记住这句话：你在别人的人生里，连配角都算不上，顶多是个群演。"),
    ("cover.png", "你经历过哪些以为全世界都看到了其实根本没人在意的尴尬瞬间？在评论区说出来，我们一起把社死现场变成治愈现场。关注我，每天一个让你活得明白的心理学冷知识。"),
]

def load_font(path, size):
    try: return ImageFont.truetype(path, size)
    except: return ImageFont.load_default()

def run(cmd, **kw):
    print(f"  [CMD] {cmd[:120]}...")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, **kw)
    if result.returncode != 0:
        print(f"  [STDERR] {result.stderr[:300]}")
    return result

# ═══════════════════════════════════════════════
# STEP 1: Generate Images
# ═══════════════════════════════════════════════
def create_images():
    print("\n[1/4] Generating images...")

    # --- COVER ---
    print("  Creating cover...")
    img = Image.new('RGBA', (W, H), (10, 14, 26, 255))
    draw = ImageDraw.Draw(img)

    # Radial spotlight
    step = 3
    spot_img = Image.new('RGBA', (W//step, H//step), (0,0,0,0))
    spix = spot_img.load()
    scx, scy = W//(2*step), int(H*0.18)//step
    smax = int(H*0.75)//step
    for y in range(H//step):
        for x in range(W//step):
            dist = math.sqrt((x-scx)**2 + (y-scy)**2)
            ratio = min(dist/smax, 1.0) ** 1.8
            r = int(255 - 245*ratio)
            g = int(220 - 206*ratio)
            b = int(160 - 134*ratio)
            a = int(120 - 120*ratio)
            spix[x,y] = (r,g,b,a)
    spot_img = spot_img.resize((W,H), Image.LANCZOS)
    img.paste(spot_img, (0,0), spot_img)

    # Stage floor ellipse
    floor = Image.new('RGBA', (W,H), (0,0,0,0))
    fd = ImageDraw.Draw(floor)
    stage_y = int(H*0.78)
    fd.ellipse([int(W*0.05), stage_y, int(W*0.95), stage_y+int(H*0.08)], fill=(255,200,140,8))
    img.paste(floor.filter(ImageFilter.GaussianBlur(4)), (0,0), floor)

    # Silhouette
    cx, by, s = W//2, int(H*0.82), 1.3
    hr = int(28*s)
    hy = by - int(220*s)
    draw.ellipse([cx-hr, hy-hr, cx+hr, hy+hr], fill=(20,24,38,255))
    nw, nh = int(14*s), int(20*s)
    ny = hy+hr
    draw.rectangle([cx-nw, ny, cx+nw, ny+nh], fill=(20,24,38,255))
    bwt, bwb, bh = int(40*s), int(55*s), int(100*s)
    by2 = ny+nh
    draw.polygon([cx-bwt,by2, cx+bwt,by2, cx+bwb,by2+bh, cx-bwb,by2+bh], fill=(20,24,38,255))
    lw, lh, ly = int(16*s), int(90*s), by2+bh
    draw.rectangle([cx-int(25*s),ly, cx-int(25*s)+lw, ly+lh], fill=(20,24,38,255))
    draw.rectangle([cx+int(9*s),ly, cx+int(9*s)+lw, ly+lh], fill=(20,24,38,255))

    # Title
    tf = load_font(FONT_SERIF, 96)
    title = "聚光灯效应"
    bbox = draw.textbbox((0,0), title, font=tf)
    tx = (W - (bbox[2]-bbox[0])) // 2
    title_y = int(H*0.48)
    draw.text((tx+3, title_y+3), title, font=tf, fill=(0,0,0,60))
    draw.text((tx, title_y), title, font=tf, fill=(255,235,190,255))

    # Decorative line
    ly2 = title_y + 130
    lw2 = 200
    lx = (W-lw2)//2
    draw.rectangle([lx, ly2, lx+lw2, ly2+2], fill=(255,200,130,180))

    # Subtitle
    sf = load_font(FONT_SANS, 44)
    sub = "你总觉得别人在盯着你看？"
    bbox = draw.textbbox((0,0), sub, font=sf)
    draw.text(((W-(bbox[2]-bbox[0]))//2, ly2+40), sub, font=sf, fill=(210,200,185,255))

    # Bottom
    bf = load_font(FONT_SANS, 28)
    bot = "每天一个心理学冷知识  ·  关注解锁更多"
    bbox = draw.textbbox((0,0), bot, font=bf)
    draw.text(((W-(bbox[2]-bbox[0]))//2, int(H*0.91)), bot, font=bf, fill=(160,150,130,200))

    img_rgb = Image.new('RGB', (W,H), (10,14,26))
    img_rgb.paste(img, (0,0), img)
    img_rgb.save(os.path.join(OUTPUT_DIR, 'cover.png'), 'PNG')
    print("    cover.png done")

    # --- CARD 1: Concept ---
    print("  Creating card1...")
    bg = (245,240,232)
    img = Image.new('RGBA', (W,H), bg+(255,))
    draw = ImageDraw.Draw(img)
    draw.rectangle([0,0,W,8], fill=(180,140,80,255))

    nf = load_font(FONT_SERIF, 200)
    draw.text((80,60), "01", font=nf, fill=(220,210,195,120))

    qf1 = load_font(FONT_SERIF, 64)
    draw.text((80,140), "什么是", font=qf1, fill=(50,40,30,255))
    qf2 = load_font(FONT_SERIF, 80)
    draw.text((80,220), "聚光灯效应？", font=qf2, fill=(50,40,30,255))
    draw.rectangle([80,340,280,344], fill=(200,160,100,255))

    # Lightbulb
    bcx, bcy = W//2, 620
    glow = Image.new('RGBA', (W,H), (0,0,0,0))
    gd = ImageDraw.Draw(glow)
    for r in range(180,40,-20):
        gd.ellipse([bcx-r,bcy-r, bcx+r,bcy+r], fill=(255,210,140,int(40*(1-r/180))))
    img.paste(glow.filter(ImageFilter.GaussianBlur(15)), (0,0), glow)

    br = 50
    draw.ellipse([bcx-br,bcy-br, bcx+br,bcy+br], fill=(255,210,140,255), outline=(200,160,100,255), width=3)
    bw2, bh2 = 40, 35
    draw.rectangle([bcx-bw2//2,bcy+br-5, bcx+bw2//2,bcy+br+bh2], fill=(160,120,70,255))
    for i in range(3):
        sy = bcy+br+5+i*10
        draw.line([bcx-bw2//2+3,sy, bcx+bw2//2-3,sy], fill=(140,100,60,255), width=2)
    draw.line([bcx-15,bcy+20, bcx,bcy-10], fill=(180,140,80,200), width=2)
    draw.line([bcx+15,bcy+20, bcx,bcy-10], fill=(180,140,80,200), width=2)

    df1 = load_font(FONT_SERIF, 44)
    d1 = "我们总是高估"
    bbox = draw.textbbox((0,0), d1, font=df1)
    draw.text(((W-(bbox[2]-bbox[0]))//2, 800), d1, font=df1, fill=(60,45,30,255))
    df2 = load_font(FONT_SERIF, 48)
    d2 = "别人对自己的关注程度。"
    bbox = draw.textbbox((0,0), d2, font=df2)
    draw.text(((W-(bbox[2]-bbox[0]))//2, 870), d2, font=df2, fill=(60,45,30,255))

    sf2 = load_font(FONT_SANS, 30)
    s2 = "你以为自己是主角，其实你只是观众。"
    bbox = draw.textbbox((0,0), s2, font=sf2)
    draw.text(((W-(bbox[2]-bbox[0]))//2, 960), s2, font=sf2, fill=(150,130,110,255))

    draw.rectangle([int(W*0.25),1080,int(W*0.75),1081], fill=(200,190,170,150))

    m = 100
    bt = 1140
    draw.rounded_rectangle([m,bt, W-m,bt+160], radius=20, fill=(255,255,255,200), outline=(200,180,150,100), width=1)
    insf = load_font(FONT_SANS, 32)
    iy = bt+28
    for line in ["1999年，康奈尔大学心理学家 Gilovich & Savitsky","发现了一个惊人的事实：","别人注意到你的概率，远低于你的想象。"]:
        draw.text((m+40, iy), line, font=insf, fill=(80,60,40,255))
        iy += 42

    srcf = load_font(FONT_SANS, 22)
    src = "来源：Gilovich, T., & Savitsky, K. (1999) · JPSP"
    bbox = draw.textbbox((0,0), src, font=srcf)
    draw.text(((W-(bbox[2]-bbox[0]))//2, int(H*0.92)), src, font=srcf, fill=(160,140,120,200))
    draw.rectangle([0,H-8,W,H], fill=(180,140,80,255))

    img_rgb = Image.new('RGB', (W,H), bg)
    img_rgb.paste(img, (0,0), img)
    img_rgb.save(os.path.join(OUTPUT_DIR, 'card1-concept.png'), 'PNG')
    print("    card1-concept.png done")

    # --- CARD 2: Experiment Data ---
    print("  Creating card2...")
    bg2 = (8,20,40)
    img = Image.new('RGBA', (W,H), bg2+(255,))
    draw = ImageDraw.Draw(img)

    lf = load_font(FONT_SANS, 28)
    label = "C O R N E L L   U N I V E R S I T Y   E X P E R I M E N T"
    bbox = draw.textbbox((0,0), label, font=lf)
    draw.text(((W-(bbox[2]-bbox[0]))//2, 80), label, font=lf, fill=(180,200,220,200))
    clf = load_font(FONT_SERIF, 36)
    cl = "康奈尔大学实验"
    bbox = draw.textbbox((0,0), cl, font=clf)
    draw.text(((W-(bbox[2]-bbox[0]))//2, 115), cl, font=clf, fill=(220,210,190,230))
    slf2 = load_font(FONT_SANS, 22)
    sl2 = "穿尴尬T恤走进教室 · 多少人会注意到？"
    bbox = draw.textbbox((0,0), sl2, font=slf2)
    draw.text(((W-(bbox[2]-bbox[0]))//2, 165), sl2, font=slf2, fill=(140,150,170,180))

    rcy = 670
    lcx = int(W*0.32)

    elf = load_font(FONT_SANS, 30)
    el = "你估计的"
    bbox = draw.textbbox((0,0), el, font=elf)
    draw.text((lcx-(bbox[2]-bbox[0])//2, rcy-240), el, font=elf, fill=(130,140,160,200))

    enf = load_font(FONT_SERIF, 160)
    en = "50%"
    bbox = draw.textbbox((0,0), en, font=enf)
    enw = bbox[2]-bbox[0]
    draw.text((lcx-enw//2, rcy-180), en, font=enf, fill=(120,130,150,200))
    draw.line([lcx-enw//2-30, rcy-100, lcx+enw//2+30, rcy-100], fill=(200,80,60,180), width=6)

    rcx = int(W*0.68)

    alf2 = load_font(FONT_SANS, 30)
    al2 = "实际的"
    bbox = draw.textbbox((0,0), al2, font=alf2)
    draw.text((rcx-(bbox[2]-bbox[0])//2, rcy-240), al2, font=alf2, fill=(255,220,170,240))

    # Glow behind 23%
    glow2 = Image.new('RGBA', (W,H), (0,0,0,0))
    gd2 = ImageDraw.Draw(glow2)
    for r in range(180,20,-15):
        gd2.ellipse([rcx-r,rcy-100-r, rcx+r,rcy-100+r], fill=(255,190,100,int(30*(1-r/180))))
    img.paste(glow2.filter(ImageFilter.GaussianBlur(20)), (0,0), glow2)

    anf = load_font(FONT_SERIF, 220)
    an = "23%"
    bbox = draw.textbbox((0,0), an, font=anf)
    anw2 = bbox[2]-bbox[0]
    draw.text((rcx-anw2//2, rcy-180), an, font=anf, fill=(255,210,130,255))

    uly = rcy+80
    ulw = anw2+40
    draw.rectangle([rcx-ulw//2, uly, rcx+ulw//2, uly+4], fill=(255,190,100,220))

    exf = load_font(FONT_SANS, 36)
    d1s = "穿尴尬T恤走进教室"
    bbox = draw.textbbox((0,0), d1s, font=exf)
    draw.text(((W-(bbox[2]-bbox[0]))//2, 1050), d1s, font=exf, fill=(200,210,225,240))
    exf2 = load_font(FONT_SERIF, 40)
    d2s = "→  不到 1/4 的人注意到"
    bbox = draw.textbbox((0,0), d2s, font=exf2)
    draw.text(((W-(bbox[2]-bbox[0]))//2, 1110), d2s, font=exf2, fill=(255,210,150,255))

    dw2 = 300
    dy = 1280
    draw.rectangle([(W-dw2)//2,dy,(W+dw2)//2,dy+2], fill=(255,200,140,120))

    tkf = load_font(FONT_SERIF, 42)
    draw.text(((W-draw.textbbox((0,0),"你远没有自己想象中",font=tkf)[2])//2, 1380), "你远没有自己想象中", font=tkf, fill=(255,225,185,255))
    tkf2 = load_font(FONT_SERIF, 52)
    draw.text(((W-draw.textbbox((0,0),"那么引人注目。",font=tkf2)[2])//2, 1450), "那么引人注目。", font=tkf2, fill=(255,215,160,255))
    draw.rectangle([0,H-4,W,H], fill=(255,190,100,255))

    img_rgb = Image.new('RGB', (W,H), bg2)
    img_rgb.paste(img, (0,0), img)
    img_rgb.save(os.path.join(OUTPUT_DIR, 'card2-experiment.png'), 'PNG')
    print("    card2-experiment.png done")

    # --- CARD 3: Quote ---
    print("  Creating card3...")
    bg3 = (18,18,22)
    img = Image.new('RGBA', (W,H), bg3+(255,))
    draw = ImageDraw.Draw(img)

    cg = Image.new('RGBA', (W,H), (0,0,0,0))
    cd2 = ImageDraw.Draw(cg)
    for r in range(600,0,-30):
        cd2.ellipse([W//2-r,H//2-r, W//2+r,H//2+r], fill=(80,60,40,int(6*(1-r/600))))
    img.paste(cg.filter(ImageFilter.GaussianBlur(40)), (0,0), cg)

    lty = int(H*0.22)
    lw3 = 120
    lx3 = (W-lw3)//2
    draw.rectangle([lx3,lty,lx3+lw3,lty+3], fill=(200,160,100,220))
    ds2 = 10
    draw.polygon([W//2,lty-30-ds2, W//2+ds2,lty-30, W//2,lty-30+ds2, W//2-ds2,lty-30], fill=(200,160,100,200))

    quotes = [("你在别人的人生里，",52,200), ("连配角都算不上，",64,230), ("顶多是个群演。",72,255)]
    cy2 = int(H*0.28)
    for txt,sz,brt in quotes:
        f = load_font(FONT_SERIF, sz)
        bbox = draw.textbbox((0,0), txt, font=f)
        draw.text(((W-(bbox[2]-bbox[0]))//2, cy2), txt, font=f, fill=(brt,brt-20,brt-55,255))
        cy2 += int((bbox[3]-bbox[1])*1.35)

    lby = int(H*0.62)
    draw.rectangle([lx3,lby,lx3+lw3,lby+2], fill=(200,160,100,180))

    atf = load_font(FONT_SANS, 30)
    attr = "—— 聚光灯效应"
    bbox = draw.textbbox((0,0), attr, font=atf)
    draw.text(((W-(bbox[2]-bbox[0]))//2, lby+60), attr, font=atf, fill=(180,160,130,220))

    import random as rnd
    rnd.seed(42)
    for _ in range(30):
        dx = rnd.randint(int(W*0.05),int(W*0.95))
        dy = rnd.randint(int(H*0.15),int(H*0.70))
        rr = rnd.randint(1,3)
        draw.ellipse([dx-rr,dy-rr,dx+rr,dy+rr], fill=(200,170,120,rnd.randint(20,80)))

    btf = load_font(FONT_SANS, 22)
    bt2 = "截图保存  ·  分享给你在意的人"
    bbox = draw.textbbox((0,0), bt2, font=btf)
    draw.text(((W-(bbox[2]-bbox[0]))//2, int(H*0.90)), bt2, font=btf, fill=(140,130,110,160))

    img_rgb = Image.new('RGB', (W,H), bg3)
    img_rgb.paste(img, (0,0), img)
    img_rgb.save(os.path.join(OUTPUT_DIR, 'card3-quote.png'), 'PNG')
    print("    card3-quote.png done")
    print("  [OK] All 4 images generated")

# ═══════════════════════════════════════════════
# STEP 2: Generate TTS Audio + Subtitles
# ═══════════════════════════════════════════════
async def generate_tts():
    print("\n[2/4] Generating TTS audio + subtitles...")
    import edge_tts

    full_text = "".join(t for _, t in SEGMENTS)
    print(f"  Text length: {len(full_text)} chars, ~{len(full_text)//3} words")

    audio_path = os.path.join(OUTPUT_DIR, "audio.mp3")
    vtt_path = os.path.join(OUTPUT_DIR, "subtitles.vtt")

    communicate = edge_tts.Communicate(full_text, VOICE)
    await communicate.save(audio_path)

    # Also generate subtitles
    sub_communicate = edge_tts.Communicate(full_text, VOICE)
    await sub_communicate.save(vtt_path)  # This won't save audio properly, let me use the right approach

    print(f"  [OK] audio.mp3 saved")

    # edge-tts can generate subtitles with --write-subtitles flag via CLI
    # Let's use subprocess for that
    vtt_path2 = os.path.join(OUTPUT_DIR, "subtitles.vtt")
    cmd = f'edge-tts --voice {VOICE} --text "{full_text}" --write-media "{audio_path}" --write-subtitles "{vtt_path2}"'
    # Use a temp text file to avoid command line issues
    text_file = os.path.join(OUTPUT_DIR, "script_text.txt")
    with open(text_file, 'w', encoding='utf-8') as f:
        f.write(full_text)

    # Use --file flag
    cmd = f'edge-tts --voice {VOICE} -f "{text_file}" --write-media "{audio_path}" --write-subtitles "{vtt_path2}"'
    print(f"  Running edge-tts CLI...")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  [ERROR] {result.stderr}")
        raise RuntimeError("TTS generation failed")

    print(f"  [OK] audio.mp3 + subtitles.vtt generated")
    return audio_path, vtt_path2

# ═══════════════════════════════════════════════
# STEP 3: Get Audio Duration
# ═══════════════════════════════════════════════
def get_audio_duration(audio_path):
    print("\n[3/4] Analyzing audio...")
    cmd = f'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "{audio_path}"'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    duration = float(result.stdout.strip())
    print(f"  Audio duration: {duration:.1f}s")
    return duration

# ═══════════════════════════════════════════════
# STEP 4: Build Video with FFmpeg
# ═══════════════════════════════════════════════
def build_video(audio_path, audio_duration):
    print("\n[4/4] Assembling video with FFmpeg...")

    # Calculate segment durations proportional to text length
    text_lengths = [len(t) for _, t in SEGMENTS]
    total_len = sum(text_lengths)
    segment_durations = [audio_duration * tl / total_len for tl in text_lengths]

    # Crossfade duration
    xfade_dur = 0.4

    print("  Segment timings:")
    cumulative = 0
    for i, (img, dur) in enumerate(zip([s[0] for s in SEGMENTS], segment_durations)):
        print(f"    {i}: {img} -> {dur:.1f}s")

    # Build FFmpeg input args
    input_args = []
    for img_name, dur in zip([s[0] for s in SEGMENTS], segment_durations):
        img_path = os.path.join(OUTPUT_DIR, img_name)
        input_args.append(f'-loop 1 -t {dur:.2f} -i "{img_path}"')

    input_str = " ".join(input_args)
    audio_input = f'-i "{audio_path}"'

    # Build filter graph
    # First scale all inputs
    scale_filters = []
    for i in range(len(SEGMENTS)):
        scale_filters.append(f'[{i}:v]scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1[v{i}]')

    # Xfade chain
    xfade_chain = []
    xfade_filters = []
    current = "[v0]"
    cumulative_t = segment_durations[0] - xfade_dur
    for i in range(1, len(SEGMENTS)):
        next_name = f"[x{i}]" if i < len(SEGMENTS)-1 else "[outv]"
        xfade_filters.append(f'{current}[v{i}]xfade=transition=fade:duration={xfade_dur}:offset={cumulative_t:.2f}{next_name}')
        current = next_name
        cumulative_t += segment_durations[i] - xfade_dur

    # Subtitles - escape path for FFmpeg filter (Windows drive letter colon)
    vtt_path = os.path.join(OUTPUT_DIR, "subtitles.vtt")
    # Use forward slashes and escape the drive letter colon
    vtt_safe = vtt_path.replace('\\', '/')
    if vtt_safe[1] == ':':
        vtt_safe = vtt_safe[0] + '\\\\:' + vtt_safe[2:]
    sub_filter = f'[outv]subtitles=\'{vtt_safe}\':force_style=\'FontSize=18,Alignment=2,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1\'[outvsub]'

    # Complete filter
    filter_parts = scale_filters + xfade_filters + [sub_filter]
    filter_graph = ";".join(filter_parts)

    output_path = os.path.join(OUTPUT_DIR, "final.mp4")
    output_safe = output_path.replace('\\', '/')

    cmd = f'ffmpeg -y {input_str} {audio_input} -filter_complex "{filter_graph}" -map "[outvsub]" -map {len(SEGMENTS)}:a -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -shortest -pix_fmt yuv420p "{output_safe}"'

    print(f"  Running FFmpeg (this may take 1-2 minutes)...")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"  [FFmpeg STDERR] {result.stderr[-600:]}")
        # Try without subtitles as fallback
        print("  Retrying without subtitles...")
        filter_parts_no_sub = scale_filters + xfade_filters
        filter_graph_no_sub = ";".join(filter_parts_no_sub)
        cmd2 = f'ffmpeg -y {input_str} {audio_input} -filter_complex "{filter_graph_no_sub}" -map "[outv]" -map {len(SEGMENTS)}:a -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -shortest -pix_fmt yuv420p "{output_safe}"'
        result2 = subprocess.run(cmd2, shell=True, capture_output=True, text=True)
        if result2.returncode != 0:
            print(f"  [FFmpeg STDERR] {result2.stderr[-600:]}")
            raise RuntimeError("FFmpeg video assembly failed (with and without subtitles)")

    # Check output
    size_mb = os.path.getsize(output_path) / (1024*1024)
    print(f"\n  [OK] Video generated: {output_path}")
    print(f"  Size: {size_mb:.1f} MB")
    return output_path

# ═══════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════
async def main():
    print("="*60)
    print("  PSYCHOLOGY VIDEO PIPELINE - Day 1: Spotlight Effect")
    print("="*60)

    # Step 1: Images
    create_images()

    # Step 2: TTS
    audio_path, vtt_path = await generate_tts()

    # Step 3: Duration
    duration = get_audio_duration(audio_path)

    # Step 4: Video
    output = build_video(audio_path, duration)

    print(f"\n{'='*60}")
    print(f"  DONE! Final video: {output}")
    print(f"{'='*60}")

if __name__ == '__main__':
    asyncio.run(main())
