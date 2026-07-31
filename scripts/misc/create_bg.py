"""Generate a dark terminal background image: 'Subpixel Silence'."""
from PIL import Image, ImageDraw
import math
import random

W, H = 1920, 1080

# --- Base image ---
img = Image.new('RGB', (W, H), (10, 10, 15))
draw = ImageDraw.Draw(img, 'RGBA')

# --- 1. Deep gradient background ---
print("Creating gradient...")
for y in range(0, H, 2):
    t = y / H
    mid_factor = 1 - abs(y / H - 0.5) * 2  # peak at center
    r = int(10 + 8 * t + 5 * mid_factor)
    g = int(10 + 5 * t + 4 * mid_factor)
    b = int(15 + 18 * t + 10 * mid_factor)
    draw.rectangle([0, y, W, y + 1], fill=(r, g, b))

# --- 2. Subtle hexagonal grid ---
print("Drawing hex grid...")
hex_size = 48
hex_w = hex_size * 1.5
hex_h = hex_size * math.sqrt(3)

for row in range(-2, int(H / (hex_h / 2)) + 3):
    for col in range(-2, int(W / hex_w) + 3):
        cx = col * hex_w + (row % 2) * hex_w / 2 + hex_w
        cy = row * hex_h / 2 + hex_h / 2
        if 0 <= cx <= W and 0 <= cy <= H:
            verts = []
            for i in range(6):
                angle = math.pi / 6 + i * math.pi / 3
                verts.append((
                    cx + hex_size * 0.38 * math.cos(angle),
                    cy + hex_size * 0.38 * math.sin(angle)
                ))
            draw.polygon(verts, outline=(30, 42, 58, 18), width=1)

# --- 3. Horizontal scan lines ---
print("Adding scan lines...")
for y in range(0, H, 6):
    if y % 18 != 0:
        draw.line([(0, y), (W, y)], fill=(20, 30, 45, 4), width=1)

# --- 4. Subtle angled data paths ---
print("Adding data paths...")
paths = [
    (120, 220, 820, 870),
    (920, 170, 470, 920),
    (1520, 120, 1220, 970),
    (300, 800, 1100, 600),
]
for x1, y1, x2, y2 in paths:
    draw.line([(x1, y1), (x2, y2)], fill=(30, 42, 58, 8), width=1)

# --- 5. Faint grid dots ---
print("Adding grid dots...")
for y in range(0, H, 72):
    for x in range(0, W, 72):
        draw.ellipse([x - 1, y - 1, x + 1, y + 1], fill=(40, 55, 70, 15))

# --- 6. Glow layer (bottom-right cyan-teal glow) ---
print("Creating glow layer...")
glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow_layer)

glow_cx, glow_cy = 1620, 920
glow_radius = 350

# Main soft glow
for i in range(80, 0, -1):
    r = glow_radius * (i / 80) ** 0.55
    alpha = int(24 * (1 - i / 80) ** 1.6)
    glow_draw.ellipse(
        [glow_cx - r, glow_cy - r, glow_cx + r, glow_cy + r],
        fill=(13, 115, 119, alpha)
    )

# Brighter inner core
for i in range(40, 0, -1):
    r = 100 * (i / 40) ** 0.45
    alpha = int(35 * (1 - i / 40) ** 1.3)
    glow_draw.ellipse(
        [glow_cx - r, glow_cy - r, glow_cx + r, glow_cy + r],
        fill=(13, 115, 119, alpha)
    )

# Tiny bright nodes
random.seed(42)
for _ in range(15):
    nx = glow_cx + random.randint(-220, 220)
    ny = glow_cy + random.randint(-220, 220)
    node_r = random.randint(1, 3)
    glow_draw.ellipse(
        [nx - node_r, ny - node_r, nx + node_r, ny + node_r],
        fill=(13, 115, 119, random.randint(25, 75))
    )

# --- 7. Top-left subtle accent (balance) ---
for i in range(50, 0, -1):
    r = 200 * (i / 50) ** 0.5
    alpha = int(8 * (1 - i / 50) ** 2.5)
    glow_draw.ellipse(
        [140 - r, 120 - r, 140 + r, 120 + r],
        fill=(20, 50, 75, alpha)
    )

# Composite glow onto base
img = Image.alpha_composite(img.convert('RGBA'), glow_layer)

# --- 8. Vignette effect ---
print("Applying vignette...")
vignette = Image.new('RGBA', (W, H), (0, 0, 0, 0))
v_draw = ImageDraw.Draw(vignette)

for i in range(100, 0, -1):
    t = i / 100
    alpha = int(12 * (1 - t) ** 3)
    margin = int(15 * (1 - t))
    v_draw.rectangle(
        [margin, margin, W - margin, H - margin],
        outline=(0, 0, 0, alpha),
        width=int(35 * t + 1)
    )

img = Image.alpha_composite(img, vignette)

# --- 9. Final composite and save ---
print("Saving...")
final = Image.new('RGB', (W, H), (10, 10, 15))
final.paste(img, (0, 0), img)

output_path = r'E:\my project\terminal-bg.png'
final.save(output_path, 'PNG', optimize=True)
print(f'Done! Saved to: {output_path}')
print(f'Resolution: {W}x{H}')
