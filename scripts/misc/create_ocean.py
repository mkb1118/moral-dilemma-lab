"""Create a beautiful light ocean landscape - 1920x1080."""
from PIL import Image, ImageDraw, ImageFilter
import math
import random

W, H = 1920, 1080
random.seed(7)

# ============================================================
# 1. SKY GRADIENT
# ============================================================
print("Painting sky...")
sky = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sky_draw = ImageDraw.Draw(sky)

horizon_y = 530
# Deep blue at top -> light warm blue at horizon
for y in range(0, horizon_y, 2):
    t = y / horizon_y
    r = int(120 + 115 * (t ** 0.7))
    g = int(175 + 60 * (t ** 0.7))
    b = int(215 + 40 * (t ** 0.7))
    sky_draw.rectangle([0, y, W, y + 2], fill=(r, g, b))

# Warm horizon glow band
for y in range(horizon_y - 30, horizon_y + 10, 2):
    t = (y - horizon_y + 30) / 40
    r = 235
    g = int(230 + 25 * t)
    b = int(220 + 35 * t)
    sky_draw.rectangle([0, y, W, y + 2], fill=(r, g, b))

# ============================================================
# 2. SUN & GLOW
# ============================================================
print("Painting sun...")
sun_x, sun_y = 1350, 350

# Outer glow layers (drawn as large ellipses)
glow_colors = [
    (255, 248, 200, 15),   # warm outer
    (255, 245, 180, 25),
    (255, 240, 160, 40),
    (255, 235, 140, 55),
    (255, 230, 100, 70),
    (255, 250, 200, 90),   # inner bright
]
glow_radii = [450, 350, 260, 180, 120, 70]

for (r_val, g_val, b_val, alpha), radius in zip(glow_colors, glow_radii):
    glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    gd.ellipse(
        [sun_x - radius, sun_y - radius, sun_x + radius, sun_y + radius],
        fill=(r_val, g_val, b_val, alpha)
    )
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=radius * 0.25))
    sky = Image.alpha_composite(sky, glow_layer)

# Sun core
core_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
cd = ImageDraw.Draw(core_layer)
cd.ellipse(
    [sun_x - 35, sun_y - 35, sun_x + 35, sun_y + 35],
    fill=(255, 252, 240, 255)
)
core_layer = core_layer.filter(ImageFilter.GaussianBlur(radius=4))
sky = Image.alpha_composite(sky, core_layer)

# ============================================================
# 3. FLUFFY CLOUDS
# ============================================================
print("Painting clouds...")

def draw_cloud(canvas, cx, cy, base_r, alpha):
    """Draw a fluffy cloud made of overlapping circles."""
    cloud = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cloud)
    color = (252, 252, 252, alpha)
    highlight = (255, 255, 255, min(255, alpha + 20))

    # Main cluster
    offsets = [
        (0, 0, base_r),
        (int(base_r * 0.7), int(-base_r * 0.25), int(base_r * 0.75)),
        (int(-base_r * 0.65), int(-base_r * 0.15), int(base_r * 0.7)),
        (int(base_r * 0.35), int(base_r * 0.3), int(base_r * 0.6)),
        (int(-base_r * 0.3), int(base_r * 0.25), int(base_r * 0.55)),
        (int(base_r * 0.8), int(base_r * 0.1), int(base_r * 0.5)),
        (int(-base_r * 0.8), int(base_r * 0.05), int(base_r * 0.45)),
        (int(base_r * 0.15), int(-base_r * 0.4), int(base_r * 0.55)),
    ]
    for ox, oy, r in offsets:
        cd.ellipse(
            [cx + ox - r, cy + oy - r, cx + ox + r, cy + oy + r],
            fill=color
        )

    # Highlight tops
    for ox, oy, r in offsets[:4]:
        cd.ellipse(
            [cx + ox - r * 0.7, cy + oy - r * 0.5 - r * 0.3,
             cx + ox + r * 0.6, cy + oy + r * 0.1],
            fill=highlight
        )

    cloud = cloud.filter(ImageFilter.GaussianBlur(radius=3))
    return Image.alpha_composite(canvas, cloud)

# Place clouds across the sky
cloud_configs = [
    (200, 180, 60, 30),      # far left, small
    (350, 140, 70, 28),
    (550, 200, 80, 32),
    (750, 120, 65, 25),
    (900, 170, 55, 22),
    (1050, 140, 80, 30),
    (1700, 160, 70, 28),     # right side
    (1820, 130, 45, 20),
    (500, 280, 50, 18),      # lower clouds
    (1100, 260, 55, 20),
    (1600, 240, 60, 22),
    (100, 250, 40, 15),
]

for cx, cy, r, alpha in cloud_configs:
    sky = draw_cloud(sky, cx, cy, r, alpha)

# ============================================================
# 4. DISTANT MOUNTAINS / HILLS ON HORIZON
# ============================================================
print("Painting distant land...")
land = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ld = ImageDraw.Draw(land)

# Left landmass
ld.polygon([
    (0, horizon_y + 80),
    (0, horizon_y - 20),
    (80, horizon_y - 30),
    (160, horizon_y - 15),
    (240, horizon_y - 45),
    (320, horizon_y - 25),
    (400, horizon_y - 10),
    (480, horizon_y + 30),
    (480, horizon_y + 80),
], fill=(180, 200, 175, 180))

# Right landmass (smaller)
ld.polygon([
    (1500, horizon_y + 80),
    (1500, horizon_y + 10),
    (1580, horizon_y - 15),
    (1660, horizon_y - 30),
    (1740, horizon_y - 10),
    (1820, horizon_y - 25),
    (1900, horizon_y),
    (1920, horizon_y + 20),
    (1920, horizon_y + 80),
], fill=(175, 195, 170, 170))

land = land.filter(ImageFilter.GaussianBlur(radius=2))
sky = Image.alpha_composite(sky, land)

# ============================================================
# 5. OCEAN
# ============================================================
print("Painting ocean...")
ocean = Image.new('RGBA', (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(ocean)

# Ocean gradient: darker teal at horizon -> lighter turquoise near shore
ocean_top = horizon_y + 15
ocean_bot = 920

for y in range(ocean_top, ocean_bot, 2):
    t = (y - ocean_top) / (ocean_bot - ocean_top)
    # Deep blue-green at horizon, lighter toward bottom
    r = int(60 + 80 * (t ** 1.3))
    g = int(145 + 60 * (t ** 1.3))
    b = int(185 + 20 * (t ** 1.3))
    od.rectangle([0, y, W, y + 2], fill=(r, g, b))

# Wave lines - horizontal shimmer
for y in range(ocean_top + 20, ocean_bot - 40, 8):
    t = (y - ocean_top) / (ocean_bot - ocean_top)
    alpha = int(15 + 10 * t)
    # Vary line width and gaps
    start_x = random.randint(0, 20)
    for x in range(start_x, W, random.randint(6, 14)):
        length = random.randint(20, 80)
        od.rectangle(
            [x, y, min(x + length, W), y + 1],
            fill=(180, 215, 225, alpha)
        )

# Sun reflection path on water - vertical shimmer
reflections = []
for i in range(200):
    rx = sun_x + int(random.gauss(0, 120))
    ry = ocean_top + 30 + int(random.random() * 350)
    rlen = int(random.random() * 40 + 5)
    alpha = int(random.random() * 35 + 5)
    reflections.append((rx, ry, rlen, alpha))

for rx, ry, rlen, alpha in reflections:
    od.rectangle(
        [rx, ry, rx + rlen, ry + 1],
        fill=(255, 245, 210, alpha)
    )

sky = Image.alpha_composite(sky, ocean)

# ============================================================
# 6. SHORE / BEACH IN FOREGROUND
# ============================================================
print("Painting shore...")
shore = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(shore)

# Gentle sandy beach curve
beach_y = 850
points = []
for x in range(0, W + 1, 10):
    wave = 15 * math.sin(x / 300 + 1.5) + 8 * math.sin(x / 120 + 0.8) + 3 * math.sin(x / 50)
    y = beach_y + wave
    points.append((x, y))

# Fill beach area
points_top = points.copy()
points_bot = [(W, H), (0, H)]
all_points = points_top + points_bot
sd.polygon(all_points, fill=(245, 235, 215, 255))

# Beach texture - subtle dune shading
for i in range(30):
    bx = random.randint(0, W)
    by = beach_y + random.randint(30, 200)
    bw = random.randint(60, 250)
    bh = random.randint(3, 8)
    shade = random.randint(-12, 12)
    col = (245 + shade, 235 + shade, 215 + shade, 40)
    sd.ellipse([bx - bw, by - bh, bx + bw, by + bh], fill=col)

sky = Image.alpha_composite(sky, shore)

# ============================================================
# 7. FOAM / WAVES AT SHORELINE
# ============================================================
print("Painting shoreline foam...")
foam = Image.new('RGBA', (W, H), (0, 0, 0, 0))
fd = ImageDraw.Draw(foam)

for x in range(0, W, 3):
    wave_offset = 15 * math.sin(x / 300 + 1.5) + 8 * math.sin(x / 120 + 0.8)
    y = beach_y + wave_offset
    # Foam band near shoreline
    for fy in range(int(y - 6), int(y + 6), 2):
        alpha = int(120 - abs(fy - y) * 18)
        if alpha > 0 and 0 <= fy < H:
            fd.point((x, fy), fill=(255, 255, 252, alpha))

foam = foam.filter(ImageFilter.GaussianBlur(radius=1.5))
sky = Image.alpha_composite(sky, foam)

# ============================================================
# 8. SEAGULLS
# ============================================================
print("Painting seagulls...")
gulls_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
gull_draw = ImageDraw.Draw(gulls_layer)

def draw_gull(cx, cy, size, angle=0):
    """Draw a simple seagull silhouette."""
    # Wing strokes
    wing_spread = size
    points = [
        (cx - wing_spread, cy + size * 0.2),      # left wingtip
        (cx - wing_spread * 0.35, cy - size * 0.1),  # left inner
        (cx, cy - size * 0.05),                       # head
        (cx + wing_spread * 0.35, cy - size * 0.1),   # right inner
        (cx + wing_spread, cy + size * 0.2),          # right wingtip
        (cx + wing_spread * 0.2, cy + size * 0.05),   # right bottom
        (cx, cy + size * 0.15),                       # body bottom
        (cx - wing_spread * 0.2, cy + size * 0.05),   # left bottom
    ]
    gull_draw.polygon(points, fill=(60, 65, 70, 200))

# Place seagulls
gull_configs = [
    (600, 300, 14),
    (630, 320, 10),
    (580, 290, 8),
    (800, 260, 12),
    (820, 275, 9),
    (950, 310, 11),
    (400, 350, 7),
]
for cx, cy, sz in gull_configs:
    draw_gull(cx, cy, sz)

sky = Image.alpha_composite(sky, gulls_layer)

# ============================================================
# 9. DISTANT SAILBOAT
# ============================================================
print("Painting sailboat...")
boat_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
bd = ImageDraw.Draw(boat_layer)

bx, by = 700, horizon_y + 30  # boat position on horizon

# Hull
bd.polygon([
    (bx - 8, by + 8),
    (bx + 8, by + 8),
    (bx + 4, by + 1),
    (bx - 4, by + 1),
], fill=(180, 170, 155, 200))

# Main sail
bd.polygon([
    (bx, by - 28),
    (bx + 6, by + 1),
    (bx, by + 1),
], fill=(250, 248, 240, 220))

# Jib sail
bd.polygon([
    (bx - 2, by - 22),
    (bx - 6, by + 1),
    (bx - 1, by + 1),
], fill=(248, 246, 238, 200))

# Mast
bd.rectangle([bx - 1, by - 30, bx, by + 8], fill=(140, 130, 115, 220))

sky = Image.alpha_composite(sky, boat_layer)

# ============================================================
# 10. GENTLE VIGNETTE
# ============================================================
print("Applying finish...")
vignette = Image.new('RGBA', (W, H), (0, 0, 0, 0))
vd = ImageDraw.Draw(vignette)

for i in range(40, 0, -1):
    t = i / 40
    alpha = int(8 * (1 - t) ** 3)
    margin = int(20 * (1 - t))
    vd.rectangle(
        [margin, margin, W - margin, H - margin],
        outline=(255, 255, 255, alpha),
        width=int(30 * t + 1)
    )

sky = Image.alpha_composite(sky, vignette)

# ============================================================
# 11. FINAL AND SAVE
# ============================================================
final = Image.new('RGB', (W, H), (240, 245, 250))
final.paste(sky, (0, 0), sky)

output = r'E:\my project\terminal-bg.png'
final.save(output, 'PNG', optimize=True)
print(f'Saved: {output}')
print(f'Size: {W}x{H}')
