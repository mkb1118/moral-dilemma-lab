"""
Generate all 4 images for Day 1: 聚光灯效应 (Spotlight Effect)
1080x1920 vertical format for Douyin/TikTok
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os

OUTPUT_DIR = r"E:\my project\psychology-videos\day1"
W, H = 1080, 1920

# Font paths
FONT_SERIF = r"C:\Windows\Fonts\Source Han Serif SC Heavy (TrueType).ttf"
FONT_SANS = r"C:\Windows\Fonts\SourceHanSansCN-Normal.ttf"
FONT_HEI = r"C:\Windows\Fonts\simhei.ttf"

def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def radial_spotlight(draw, w, h, cx, cy, max_r, inner_color, outer_color):
    """Draw a radial spotlight gradient pixel by pixel (subsampled for speed)."""
    step = 3  # subsample for performance, will be smoothed by blur
    temp = Image.new('RGBA', (w // step, h // step), (0, 0, 0, 0))
    tpix = temp.load()
    scx, scy = cx / step, cy / step
    smax = max_r / step

    for y in range(h // step):
        for x in range(w // step):
            dist = math.sqrt((x - scx)**2 + (y - scy)**2)
            ratio = min(dist / smax, 1.0)
            ratio = ratio ** 1.8  # ease
            r = int(inner_color[0] + (outer_color[0] - inner_color[0]) * ratio)
            g = int(inner_color[1] + (outer_color[1] - inner_color[1]) * ratio)
            b = int(inner_color[2] + (outer_color[2] - inner_color[2]) * ratio)
            a = int(inner_color[3] + (outer_color[3] - inner_color[3]) * ratio)
            tpix[x, y] = (r, g, b, a)

    temp = temp.resize((w, h), Image.LANCZOS)
    draw.bitmap((0, 0), temp, fill=None)
    return temp

def draw_silhouette(draw, cx, base_y, scale=1.0):
    """Draw an abstract human silhouette using ellipses."""
    s = scale
    # Head
    head_r = int(28 * s)
    head_y = base_y - int(220 * s)
    draw.ellipse([cx - head_r, head_y - head_r, cx + head_r, head_y + head_r],
                 fill=(20, 24, 38, 255))
    # Neck
    nw, nh = int(14 * s), int(20 * s)
    ny = head_y + head_r
    draw.rectangle([cx - nw, ny, cx + nw, ny + nh], fill=(20, 24, 38, 255))
    # Body - trapezoid approximation
    bw_top = int(40 * s)
    bw_bot = int(55 * s)
    bh = int(100 * s)
    by = ny + nh
    # Use polygon for body
    draw.polygon([
        cx - bw_top, by,
        cx + bw_top, by,
        cx + bw_bot, by + bh,
        cx - bw_bot, by + bh
    ], fill=(20, 24, 38, 255))
    # Legs
    lw = int(16 * s)
    lh = int(90 * s)
    ly = by + bh
    draw.rectangle([cx - int(25 * s), ly, cx - int(25 * s) + lw, ly + lh], fill=(20, 24, 38, 255))
    draw.rectangle([cx + int(9 * s), ly, cx + int(9 * s) + lw, ly + lh], fill=(20, 24, 38, 255))

def draw_lightbeam(draw, top_cx, top_cy, bottom_width, bottom_y, color, alpha=30):
    """Draw a subtle light beam cone."""
    h = bottom_y - top_cy
    tw = int(bottom_width * 0.05)
    bw = bottom_width
    # Create a polygon for the light beam
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    points = [
        top_cx - tw, top_cy,
        top_cx + tw, top_cy,
        top_cx + bw, bottom_y,
        top_cx - bw, bottom_y
    ]
    odraw.polygon(points, fill=(color[0], color[1], color[2], alpha))
    overlay = overlay.filter(ImageFilter.GaussianBlur(30))
    draw.bitmap((0, 0), overlay, fill=None)

def add_noise_overlay(img, alpha=5):
    """Add subtle film grain / noise."""
    import random
    noise = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    npix = noise.load()
    for y in range(0, H, 4):
        for x in range(0, W, 4):
            v = random.randint(0, 255)
            npix[x, y] = (v, v, v, alpha)
    noise = noise.filter(ImageFilter.GaussianBlur(0.7))
    img.paste(noise, (0, 0), noise)

def text_centered(draw, text, font, y, color, max_width=None):
    """Draw centered text, return bottom y."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    draw.text((x, y), text, font=font, fill=color)
    return y + (bbox[3] - bbox[1])

def text_centered_multiline(draw, lines, font, start_y, color, line_spacing=1.3):
    """Draw multiple centered lines, return bottom y."""
    y = start_y
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        th = bbox[3] - bbox[1]
        tw = bbox[2] - bbox[0]
        x = (W - tw) // 2
        draw.text((x, y), line, font=font, fill=color)
        y += int(th * line_spacing)
    return y

# ═══════════════════════════════════════════════════════════
# 1. COVER IMAGE
# ═══════════════════════════════════════════════════════════
def create_cover():
    print("Creating cover...")
    img = Image.new('RGBA', (W, H), (10, 14, 26, 255))
    draw = ImageDraw.Draw(img)

    # Spotlight - warm golden center near top, radiating down
    spot = radial_spotlight(
        draw, W, H,
        cx=W//2, cy=int(H * 0.18),
        max_r=int(H * 0.75),
        inner_color=(255, 220, 160, 120),
        outer_color=(10, 14, 26, 0)
    )

    # Second softer spotlight below
    spot2 = radial_spotlight(
        draw, W, H,
        cx=W//2, cy=int(H * 0.38),
        max_r=int(H * 0.45),
        inner_color=(255, 200, 130, 40),
        outer_color=(10, 14, 26, 0)
    )

    # Light beam cone from top
    draw_lightbeam(draw, W//2, int(H * 0.06), int(W * 0.5), int(H * 0.70), (255, 200, 140), alpha=10)

    # Stage floor - subtle arc
    stage_y = int(H * 0.78)
    overlay_floor = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(overlay_floor)
    # Ellipse for stage floor
    fdraw.ellipse([
        int(W * 0.05), stage_y,
        int(W * 0.95), stage_y + int(H * 0.08)
    ], fill=(255, 200, 140, 8))
    overlay_floor = overlay_floor.filter(ImageFilter.GaussianBlur(4))
    img.paste(overlay_floor, (0, 0), overlay_floor)

    # Silhouette figure at bottom center
    draw_silhouette(draw, W//2, int(H * 0.82), scale=1.3)

    # Main title - "聚光灯效应"
    title_font = load_font(FONT_SERIF, 96)
    title_y = int(H * 0.48)
    # Draw title with slight letter spacing
    title = "聚光灯效应"
    # Calculate centered position
    bbox = draw.textbbox((0, 0), title, font=title_font)
    tw = bbox[2] - bbox[0]
    tx = (W - tw) // 2
    # Shadow
    draw.text((tx + 3, title_y + 3), title, font=title_font, fill=(0, 0, 0, 60))
    # Main text - warm gold
    draw.text((tx, title_y), title, font=title_font, fill=(255, 235, 190, 255))

    # Decorative line under title
    line_y = title_y + 130
    line_w = 200
    lx = (W - line_w) // 2
    draw.rectangle([lx, line_y, lx + line_w, line_y + 2], fill=(255, 200, 130, 180))

    # Subtitle
    sub_font = load_font(FONT_SANS, 44)
    sub = "你总觉得别人在盯着你看？"
    bbox = draw.textbbox((0, 0), sub, font=sub_font)
    sw = bbox[2] - bbox[0]
    draw.text(((W - sw)//2, line_y + 40), sub, font=sub_font, fill=(210, 200, 185, 255))

    # English subtitle
    en_font = load_font(FONT_SANS, 24)
    en = "THE SPOTLIGHT EFFECT"
    bbox = draw.textbbox((0, 0), en, font=en_font)
    ew = bbox[2] - bbox[0]
    draw.text(((W - ew)//2, line_y + 100), en, font=en_font, fill=(180, 170, 150, 180))

    # Bottom label
    bot_font = load_font(FONT_SANS, 28)
    bot = "每天一个心理学冷知识  ·  关注解锁更多"
    bbox = draw.textbbox((0, 0), bot, font=bot_font)
    bw = bbox[2] - bbox[0]
    draw.text(((W - bw)//2, int(H * 0.91)), bot, font=bot_font, fill=(160, 150, 130, 200))

    # Subtle grain
    add_noise_overlay(img, alpha=3)

    # Convert to RGB and save
    img_rgb = Image.new('RGB', (W, H), (10, 14, 26))
    img_rgb.paste(img, (0, 0), img)
    path = os.path.join(OUTPUT_DIR, 'cover.png')
    img_rgb.save(path, 'PNG', quality=100)
    print(f"  [OK] {path}")

# ═══════════════════════════════════════════════════════════
# 2. CONCEPT CARD
# ═══════════════════════════════════════════════════════════
def create_card1():
    print("Creating card 1 (concept)...")
    bg_color = (245, 240, 232)
    img = Image.new('RGBA', (W, H), bg_color + (255,))
    draw = ImageDraw.Draw(img)

    # Subtle texture - dotted grid
    for y in range(0, H, 60):
        for x in range(0, W, 60):
            draw.ellipse([x-1, y-1, x+1, y+1], fill=(200, 190, 175, 40))

    # Top decorative band
    draw.rectangle([0, 0, W, 8], fill=(180, 140, 80, 255))

    # Section number
    num_font = load_font(FONT_SERIF, 200)
    num_text = "01"
    bbox = draw.textbbox((0, 0), num_text, font=num_font)
    draw.text((80, 60), num_text, font=num_font, fill=(220, 210, 195, 120))

    # Main question
    q_font = load_font(FONT_SERIF, 64)
    q = "什么是"
    bbox = draw.textbbox((0, 0), q, font=q_font)
    draw.text((80, 140), q, font=q_font, fill=(50, 40, 30, 255))

    q2_font = load_font(FONT_SERIF, 80)
    q2 = "聚光灯效应？"
    bbox = draw.textbbox((0, 0), q2, font=q2_font)
    draw.text((80, 220), q2, font=q2_font, fill=(50, 40, 30, 255))

    # Decorative line
    line_y = 340
    draw.rectangle([80, line_y, 280, line_y + 4], fill=(200, 160, 100, 255))

    # Lightbulb illustration (simple geometric)
    bulb_cx, bulb_cy = W // 2, 620
    # Glow
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    for r in range(180, 40, -20):
        alpha = int(40 * (1 - r/180))
        gdraw.ellipse([bulb_cx - r, bulb_cy - r, bulb_cx + r, bulb_cy + r],
                      fill=(255, 210, 140, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(15))
    img.paste(glow, (0, 0), glow)

    # Bulb body (circle)
    bulb_r = 50
    draw.ellipse([bulb_cx - bulb_r, bulb_cy - bulb_r, bulb_cx + bulb_r, bulb_cy + bulb_r],
                 fill=(255, 210, 140, 255))
    draw.ellipse([bulb_cx - bulb_r, bulb_cy - bulb_r, bulb_cx + bulb_r, bulb_cy + bulb_r],
                 outline=(200, 160, 100, 255), width=3)

    # Bulb base
    base_w, base_h = 40, 35
    draw.rectangle([bulb_cx - base_w//2, bulb_cy + bulb_r - 5, bulb_cx + base_w//2, bulb_cy + bulb_r + base_h],
                   fill=(160, 120, 70, 255))
    # Screw lines
    for i in range(3):
        sy = bulb_cy + bulb_r + 5 + i * 10
        draw.line([bulb_cx - base_w//2 + 3, sy, bulb_cx + base_w//2 - 3, sy],
                  fill=(140, 100, 60, 255), width=2)

    # Filament lines inside bulb
    draw.line([bulb_cx - 15, bulb_cy + 20, bulb_cx, bulb_cy - 10], fill=(180, 140, 80, 200), width=2)
    draw.line([bulb_cx + 15, bulb_cy + 20, bulb_cx, bulb_cy - 10], fill=(180, 140, 80, 200), width=2)

    # Light rays
    ray_font = load_font(FONT_SANS, 30)
    for angle_deg in [30, 60, 120, 150, 210, 240, 300, 330]:
        rad = math.radians(angle_deg)
        ex = bulb_cx + int(95 * math.cos(rad))
        ey = bulb_cy + int(95 * math.sin(rad))
        draw.line([bulb_cx + int(60 * math.cos(rad)), bulb_cy + int(60 * math.sin(rad)), ex, ey],
                  fill=(255, 200, 130, 160), width=2)

    # Definition
    def_font = load_font(FONT_SERIF, 44)
    def_text = "我们总是高估"
    text_centered(draw, def_text, def_font, 800, (60, 45, 30, 255))

    def2_font = load_font(FONT_SERIF, 48)
    def2 = "别人对自己的关注程度。"
    text_centered(draw, def2, def2_font, 870, (60, 45, 30, 255))

    # Sub definition
    sub_font = load_font(FONT_SANS, 30)
    sub = "你以为自己是主角，其实你只是观众。"
    bbox = draw.textbbox((0, 0), sub, font=sub_font)
    sw = bbox[2] - bbox[0]
    draw.text(((W - sw)//2, 960), sub, font=sub_font, fill=(150, 130, 110, 255))

    # Divider
    div_y = 1080
    draw.rectangle([int(W*0.25), div_y, int(W*0.75), div_y + 1], fill=(200, 190, 170, 150))

    # Key insight box
    box_margin = 100
    box_top = 1140
    box_h = 160
    # Box background
    draw.rounded_rectangle([box_margin, box_top, W - box_margin, box_top + box_h],
                           radius=20, fill=(255, 255, 255, 200), outline=(200, 180, 150, 100), width=1)

    insight_font = load_font(FONT_SANS, 32)
    insight_lines = [
        "1999年，康奈尔大学心理学家 Gilovich & Savitsky",
        "发现了一个惊人的事实：",
        "别人注意到你的概率，远低于你的想象。"
    ]
    iy = box_top + 28
    for line in insight_lines:
        draw.text((box_margin + 40, iy), line, font=insight_font, fill=(80, 60, 40, 255))
        iy += 42

    # Source at bottom
    src_font = load_font(FONT_SANS, 22)
    src = "来源：Gilovich, T., & Savitsky, K. (1999) · Journal of Personality and Social Psychology"
    bbox = draw.textbbox((0, 0), src, font=src_font)
    sw = bbox[2] - bbox[0]
    draw.text(((W - sw)//2, int(H * 0.92)), src, font=src_font, fill=(160, 140, 120, 200))

    # Page decoration
    draw.rectangle([0, H-8, W, H], fill=(180, 140, 80, 255))

    img_rgb = Image.new('RGB', (W, H), bg_color)
    img_rgb.paste(img, (0, 0), img)
    path = os.path.join(OUTPUT_DIR, 'card1-concept.png')
    img_rgb.save(path, 'PNG', quality=100)
    print(f"  [OK] {path}")

# ═══════════════════════════════════════════════════════════
# 3. EXPERIMENT DATA CARD
# ═══════════════════════════════════════════════════════════
def create_card2():
    print("Creating card 2 (experiment data)...")
    bg = (8, 20, 40)
    img = Image.new('RGBA', (W, H), bg + (255,))
    draw = ImageDraw.Draw(img)

    # Subtle grid/crosshair pattern
    for y in range(0, H, 80):
        draw.line([0, y, W, y], fill=(255, 255, 255, 2), width=1)
    for x in range(0, W, 80):
        draw.line([x, 0, x, H], fill=(255, 255, 255, 2), width=1)

    # Vignette effect
    vignette = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    for i in range(20):
        alpha = int(8 * (1 - i/20))
        vdraw.rectangle([i, i, W-i, H-i], outline=(0, 0, 0, alpha), width=1)
    vignette = vignette.filter(ImageFilter.GaussianBlur(30))
    img.paste(vignette, (0, 0), vignette)

    # Top label
    label_font = load_font(FONT_SANS, 28)
    label = "C O R N E L L   U N I V E R S I T Y   E X P E R I M E N T"
    bbox = draw.textbbox((0, 0), label, font=label_font)
    lw = bbox[2] - bbox[0]
    draw.text(((W - lw)//2, 80), label, font=label_font, fill=(180, 200, 220, 200))

    ch_label_font = load_font(FONT_SERIF, 36)
    ch_label = "康奈尔大学实验"
    bbox = draw.textbbox((0, 0), ch_label, font=ch_label_font)
    clw = bbox[2] - bbox[0]
    draw.text(((W - clw)//2, 115), ch_label, font=ch_label_font, fill=(220, 210, 190, 230))

    # Sub-label
    sub_label_font = load_font(FONT_SANS, 22)
    sub = "穿尴尬T恤走进教室 · 多少人会注意到？"
    bbox = draw.textbbox((0, 0), sub, font=sub_label_font)
    sw = bbox[2] - bbox[0]
    draw.text(((W - sw)//2, 165), sub, font=sub_label_font, fill=(140, 150, 170, 180))

    # ── THE BIG REVEAL ──
    # Left: "你估计的" with 50% crossed out
    left_cx = int(W * 0.32)
    reveal_center_y = 670

    # Left side - muted, crossed out
    est_label_font = load_font(FONT_SANS, 30)
    est_label = "你估计的"
    bbox = draw.textbbox((0, 0), est_label, font=est_label_font)
    elw = bbox[2] - bbox[0]
    draw.text((left_cx - elw//2, reveal_center_y - 240), est_label, font=est_label_font, fill=(130, 140, 160, 200))

    # 50% - large but muted
    est_num_font = load_font(FONT_SERIF, 160)
    est_num = "50%"
    bbox = draw.textbbox((0, 0), est_num, font=est_num_font)
    enw = bbox[2] - bbox[0]
    draw.text((left_cx - enw//2, reveal_center_y - 180), est_num, font=est_num_font, fill=(120, 130, 150, 200))

    # Strikethrough line
    lx1 = left_cx - enw//2 - 30
    lx2 = left_cx + enw//2 + 30
    ly = reveal_center_y - 100
    draw.line([lx1, ly, lx2, ly], fill=(200, 80, 60, 180), width=6)

    # Arrow from left to right
    arrow_y = reveal_center_y - 60
    arrow_start = left_cx + enw//2 + 50
    arrow_end = int(W * 0.68) - 120
    # Arrow line
    draw.line([arrow_start, arrow_y, arrow_end, arrow_y], fill=(255, 200, 130, 150), width=3)
    # Arrow head
    draw.polygon([
        arrow_end - 20, arrow_y - 12,
        arrow_end - 20, arrow_y + 12,
        arrow_end, arrow_y
    ], fill=(255, 200, 130, 200))

    # Right side - GOLD, DOMINANT
    right_cx = int(W * 0.68)

    act_label_font = load_font(FONT_SANS, 30)
    act_label = "实际的"
    bbox = draw.textbbox((0, 0), act_label, font=act_label_font)
    alw = bbox[2] - bbox[0]
    draw.text((right_cx - alw//2, reveal_center_y - 240), act_label, font=act_label_font, fill=(255, 220, 170, 240))

    # 23% - GOLDEN REVEAL
    act_num_font = load_font(FONT_SERIF, 220)
    act_num = "23%"
    bbox = draw.textbbox((0, 0), act_num, font=act_num_font)
    anw = bbox[2] - bbox[0]
    anh = bbox[3] - bbox[1]

    # Glow behind 23%
    glow_r = 180
    glow_img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow_img)
    for r in range(glow_r, 20, -15):
        alpha = int(30 * (1 - r/glow_r))
        gdraw.ellipse([right_cx - r, reveal_center_y - 100 - r, right_cx + r, reveal_center_y - 100 + r],
                      fill=(255, 190, 100, alpha))
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(20))
    img.paste(glow_img, (0, 0), glow_img)

    # Draw 23%
    draw.text((right_cx - anw//2, reveal_center_y - 180), act_num, font=act_num_font, fill=(255, 210, 130, 255))

    # Underline 23%
    uline_y = reveal_center_y + 80
    uline_w = anw + 40
    draw.rectangle([right_cx - uline_w//2, uline_y, right_cx + uline_w//2, uline_y + 4],
                   fill=(255, 190, 100, 220))

    # Explanation text
    exp_font = load_font(FONT_SANS, 36)
    exp1 = "穿尴尬T恤走进教室"
    exp2 = "→  不到 1/4 的人注意到"
    text_centered(draw, exp1, exp_font, 1050, (200, 210, 225, 240))
    exp2_font = load_font(FONT_SERIF, 40)
    text_centered(draw, exp2, exp2_font, 1110, (255, 210, 150, 255))

    # Divider
    div_y = 1280
    div_w = 300
    draw.rectangle([(W - div_w)//2, div_y, (W + div_w)//2, div_y + 2], fill=(255, 200, 140, 120))

    # Takeaway
    take_font = load_font(FONT_SERIF, 42)
    take = "你远没有自己想象中"
    text_centered(draw, take, take_font, 1380, (255, 225, 185, 255))
    take2_font = load_font(FONT_SERIF, 52)
    take2 = "那么引人注目。"
    text_centered(draw, take2, take2_font, 1450, (255, 215, 160, 255))

    # Bottom decoration
    draw.rectangle([0, H-4, W, H], fill=(255, 190, 100, 255))

    img_rgb = Image.new('RGB', (W, H), bg)
    img_rgb.paste(img, (0, 0), img)
    path = os.path.join(OUTPUT_DIR, 'card2-experiment.png')
    img_rgb.save(path, 'PNG', quality=100)
    print(f"  [OK] {path}")

# ═══════════════════════════════════════════════════════════
# 4. QUOTE CARD
# ═══════════════════════════════════════════════════════════
def create_card3():
    print("Creating card 3 (quote)...")
    bg = (18, 18, 22)
    img = Image.new('RGBA', (W, H), bg + (255,))
    draw = ImageDraw.Draw(img)

    # Vignette
    vignette = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    for i in range(30):
        alpha = int(15 * (1 - i/30))
        margin = i * 8
        vdraw.rectangle([margin, margin, W-margin, H-margin], outline=(30, 28, 24, alpha), width=2)
    vignette = vignette.filter(ImageFilter.GaussianBlur(20))
    img.paste(vignette, (0, 0), vignette)

    # Subtle warm center gradient
    center_glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(center_glow)
    for r in range(600, 0, -30):
        alpha = int(6 * (1 - r/600))
        cdraw.ellipse([W//2 - r, H//2 - r, W//2 + r, H//2 + r],
                      fill=(80, 60, 40, alpha))
    center_glow = center_glow.filter(ImageFilter.GaussianBlur(40))
    img.paste(center_glow, (0, 0), center_glow)

    # Top golden line decoration
    line_top_y = int(H * 0.22)
    line_w = 120
    lx = (W - line_w) // 2
    draw.rectangle([lx, line_top_y, lx + line_w, line_top_y + 3], fill=(200, 160, 100, 220))

    # Small diamond above line
    d_cx, d_cy = W//2, line_top_y - 30
    d_size = 10
    draw.polygon([
        d_cx, d_cy - d_size,
        d_cx + d_size, d_cy,
        d_cx, d_cy + d_size,
        d_cx - d_size, d_cy
    ], fill=(200, 160, 100, 200))

    # Quote text - three lines with rhythm
    quote_lines = [
        ("你在别人的人生里，", 52, 200),
        ("连配角都算不上，", 64, 230),
        ("顶多是个群演。", 72, 255),
    ]

    start_y = int(H * 0.28)
    current_y = start_y

    for text, size, brightness in quote_lines:
        font = load_font(FONT_SERIF, size)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = (W - tw) // 2
        color = (brightness, brightness - 20, brightness - 55, 255)
        draw.text((x, current_y), text, font=font, fill=color)
        current_y += int(th * 1.35)

    # Bottom golden line
    line_bot_y = int(H * 0.62)
    draw.rectangle([lx, line_bot_y, lx + line_w, line_bot_y + 2], fill=(200, 160, 100, 180))

    # Attribution
    attr_font = load_font(FONT_SANS, 30)
    attr = "—— 聚光灯效应"
    bbox = draw.textbbox((0, 0), attr, font=attr_font)
    aw = bbox[2] - bbox[0]
    draw.text(((W - aw)//2, line_bot_y + 60), attr, font=attr_font, fill=(180, 160, 130, 220))

    # Small decorative elements - scattered light dots
    import random
    random.seed(42)
    for _ in range(30):
        dx = random.randint(int(W*0.05), int(W*0.95))
        dy = random.randint(int(H*0.15), int(H*0.70))
        r = random.randint(1, 3)
        alpha = random.randint(20, 80)
        draw.ellipse([dx-r, dy-r, dx+r, dy+r], fill=(200, 170, 120, alpha))

    # Bottom small text
    bot_font = load_font(FONT_SANS, 22)
    bot = "截图保存  ·  分享给你在意的人"
    bbox = draw.textbbox((0, 0), bot, font=bot_font)
    bw = bbox[2] - bbox[0]
    draw.text(((W - bw)//2, int(H * 0.90)), bot, font=bot_font, fill=(140, 130, 110, 160))

    img_rgb = Image.new('RGB', (W, H), bg)
    img_rgb.paste(img, (0, 0), img)
    path = os.path.join(OUTPUT_DIR, 'card3-quote.png')
    img_rgb.save(path, 'PNG', quality=100)
    print(f"  [OK] {path}")

# ═══════════════════════════════════════════════════════════
# RUN ALL
# ═══════════════════════════════════════════════════════════
if __name__ == '__main__':
    print("=" * 50)
    print("  Generating Day 1: 聚光灯效应")
    print("=" * 50)
    create_cover()
    create_card1()
    create_card2()
    create_card3()
    print("\n[OK] All images generated!")
