# -*- coding: utf-8 -*-
"""
问题4改进算法 V3 —— 增强版
修复DP回退、改进分区、增强贪心
"""
import math, numpy as np, matplotlib, os, time, json, warnings
warnings.filterwarnings('ignore')
matplotlib.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'DejaVu Sans']
matplotlib.rcParams['axes.unicode_minus'] = False
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec
from scipy.interpolate import griddata

# ==================== 全局参数 ====================
THETA_DEG, NAUTICAL_MILE = 120, 1852
L_NS, L_EW = 5, 4
L_NS_M, L_EW_M = L_NS * NAUTICAL_MILE, L_EW * NAUTICAL_MILE
THETA = math.radians(THETA_DEG)
FIG_DIR = r"E:\我的桌面\B题作业"
os.makedirs(FIG_DIR, exist_ok=True)

# ==================== 生成真实感地形数据 ====================
print("=" * 70)
print("步骤1: 生成真实感海底地形")
print("=" * 70)
np.random.seed(42)
N_POINTS = 800
x_nm = np.random.uniform(0, L_EW, N_POINTS)
y_nm = np.random.uniform(0, L_NS, N_POINTS)
cx, cy = L_EW / 2, L_NS / 2
alpha_base = math.radians(1.5)
base_slope = math.tan(alpha_base)
depth_center = 110

depths = (depth_center +
          (cx - x_nm) * NAUTICAL_MILE * base_slope +
          (y_nm - cy) * NAUTICAL_MILE * 0.0001 +
          15 * np.exp(-((x_nm-1.0)**2+(y_nm-2.0)**2)/0.3) +
          -10 * np.exp(-((x_nm-3.0)**2+(y_nm-3.5)**2)/0.5) +
          8 * np.sin(x_nm*2.5)*np.cos(y_nm*1.8)*0.3 +
          -12 * np.exp(-((x_nm-2.0)**2+(y_nm-1.0)**2)/0.4) +
          np.random.normal(0, 3, N_POINTS))
depths = np.maximum(depths, 1.0)
x_m, y_m = x_nm * NAUTICAL_MILE, y_nm * NAUTICAL_MILE
all_pts = [(x_m[i], y_m[i], depths[i]) for i in range(N_POINTS)]

# 插值到细网格
GRID_RES = 150
grid_x = np.linspace(0, L_EW_M, GRID_RES)
grid_y = np.linspace(0, L_NS_M, GRID_RES)
grid_X, grid_Y = np.meshgrid(grid_x, grid_y)
grid_Z = griddata((x_m, y_m), depths, (grid_X, grid_Y), method='cubic')
grid_Z[np.isnan(grid_Z)] = np.nanmean(grid_Z)

print(f"  数据点: {N_POINTS}, 深度: {depths.min():.1f}~{depths.max():.1f}m, 均值: {depths.mean():.1f}m")

# ==================== 覆盖宽度计算 ====================
def coverage_width(D, theta, alpha_eff):
    if abs(alpha_eff) < 1e-8:
        w = 2 * D * math.tan(theta/2)
        return w, w/2, w/2
    aL = math.pi/2 - theta/2 - alpha_eff
    aR = math.pi/2 - theta/2 + alpha_eff
    Wl = D * math.sin(theta/2) / math.sin(aL)
    Wr = D * math.sin(theta/2) / math.sin(aR)
    return Wl + Wr, Wl, Wr

# ==================== 自适应四叉树分区 ====================
class QuadNode:
    def __init__(self, x_min, x_max, y_min, y_max, pts, deps):
        self.x_min, self.x_max = x_min, x_max
        self.y_min, self.y_max = y_min, y_max
        self.pts = pts
        self.deps = deps
        self.children = []
        self.is_leaf = True
        self.a = self.b = self.c = 0
        self.slope = 0
        self.aspect = 0
        self.rmse = 0
        self._fit()

    def _fit(self):
        if len(self.deps) < 5:
            self.rmse = 1e9; return
        xs = np.array([p[0] for p in self.pts])
        ys = np.array([p[1] for p in self.pts])
        A = np.column_stack([xs, ys, np.ones_like(xs)])
        try:
            coeffs, _, _, _ = np.linalg.lstsq(A, self.deps, rcond=None)
            self.a, self.b, self.c = coeffs
            pred = A @ coeffs
            self.rmse = np.sqrt(np.mean((self.deps - pred)**2))
            self.slope = math.degrees(math.atan(math.sqrt(self.a**2+self.b**2)))
            self.aspect = math.degrees(math.atan2(self.b, self.a)) % 360
        except:
            self.rmse = 1e9

    def subdivide(self, rmse_thr=4.0, min_pts=12):
        if self.rmse < rmse_thr or len(self.deps) < min_pts * 4:
            return False
        xm = (self.x_min+self.x_max)/2; ym = (self.y_min+self.y_max)/2
        bounds = [(self.x_min,xm,self.y_min,ym),(xm,self.x_max,self.y_min,ym),
                  (self.x_min,xm,ym,self.y_max),(xm,self.x_max,ym,self.y_max)]
        ok = False
        for x0,x1,y0,y1 in bounds:
            cpts = [(p[0],p[1],p[2]) for p in self.pts if x0<=p[0]<x1 and y0<=p[1]<y1]
            cdeps = np.array([p[2] for p in cpts])
            if len(cdeps) >= min_pts:
                ch = QuadNode(x0,x1,y0,y1,cpts,cdeps)
                if ch.rmse < self.rmse * 0.85:
                    self.children.append(ch); ok = True
        if ok:
            self.is_leaf = False
            for ch in self.children:
                ch.subdivide(rmse_thr, min_pts)
        return ok

    def leaves(self):
        if self.is_leaf: return [self]
        out = []
        for ch in self.children: out.extend(ch.leaves())
        return out

# 构建四叉树 (降低阈值以获得更多分区)
print("\n" + "=" * 70)
print("步骤2: 四叉树自适应分区")
print("=" * 70)
root = QuadNode(0, L_EW_M, 0, L_NS_M, all_pts, depths)
root.subdivide(rmse_thr=2.5, min_pts=12)
leaves = root.leaves()
print(f"  分区数: {len(leaves)}")
for i, lf in enumerate(leaves):
    print(f"  区{i+1}: x=[{lf.x_min:.0f},{lf.x_max:.0f}] y=[{lf.y_min:.0f},{lf.y_max:.0f}] "
          f"坡度={lf.slope:.2f}° RMSE={lf.rmse:.2f}m 点数={len(lf.deps)}")

# ==================== 改进贪心算法 ====================
def greedy_lines(region, theta, target_eta=0.12, eta_min=0.08, eta_max=0.22):
    """改进贪心: 更精细的搜索 + 边界处理"""
    alpha_eff = math.atan(math.sqrt(region.a**2 + region.b**2))
    if abs(alpha_eff) < 1e-6: alpha_eff = 1e-6
    aspect = math.atan2(region.b, region.a)
    cos_a = max(abs(math.cos(aspect)), 0.01)
    cy_r = (region.y_min + region.y_max) / 2

    # 沿坡向投影范围
    corners = np.array([[region.x_min,region.y_min],[region.x_max,region.y_min],
                        [region.x_max,region.y_max],[region.x_min,region.y_max]])
    av = np.array([math.cos(aspect), math.sin(aspect)])
    proj = corners @ av
    p_min, p_max = proj.min(), proj.max()

    def depth_at_p(p):
        x = np.clip(p / cos_a, region.x_min, region.x_max)
        return max(region.a * x + region.b * cy_r + region.c, 1.0)

    lines = []
    # 第一条线: 右覆盖恰好到p_min
    p = p_min
    for _ in range(10000):
        Dp = depth_at_p(p)
        _, _, Wr = coverage_width(Dp, theta, alpha_eff)
        if p - Wr <= p_min + 1.0:
            break
        p += 0.5
    W_all, Wl, Wr = coverage_width(depth_at_p(p), theta, alpha_eff)
    lines.append({'proj_pos': p, 'depth': depth_at_p(p), 'width': W_all, 'Wl': Wl, 'Wr': Wr})

    for _ in range(300):
        prev = lines[-1]
        left_bound = prev['proj_pos'] + prev['Wr']
        if left_bound >= p_max - 5:
            break

        # 基于目标重叠率估算搜索区间
        est_spacing = prev['width'] * (1 - target_eta)
        p_lo = max(prev['proj_pos'] + 0.5, prev['proj_pos'] + est_spacing * 0.5)
        p_hi = min(p_max + 100, prev['proj_pos'] + est_spacing * 1.8)

        best_p, best_diff = None, 1e9
        pp = p_lo
        while pp <= p_hi:
            Dc = depth_at_p(pp)
            Wc, Wlc, Wrc = coverage_width(Dc, theta, alpha_eff)
            overlap = left_bound - (pp - Wlc)
            if (prev['width'] + Wc) > 0:
                eta = overlap / ((prev['width'] + Wc) / 2)
            else:
                eta = 0
            if eta_min <= eta <= eta_max:
                diff = abs(eta - target_eta)
                if diff < best_diff:
                    best_diff, best_p = diff, pp
            pp += 1.0

        if best_p is None:
            # 放宽约束
            pp = p_lo
            while pp <= p_hi:
                Dc = depth_at_p(pp)
                Wc, Wlc, Wrc = coverage_width(Dc, theta, alpha_eff)
                overlap = left_bound - (pp - Wlc)
                if (prev['width'] + Wc) > 0:
                    eta = overlap / ((prev['width'] + Wc) / 2)
                else:
                    eta = 0
                diff = abs(eta - target_eta)
                if diff < best_diff:
                    best_diff, best_p = diff, pp
                pp += 1.0
        if best_p is None: break

        Dc = depth_at_p(best_p)
        Wc, Wlc, Wrc = coverage_width(Dc, theta, alpha_eff)
        lines.append({'proj_pos': best_p, 'depth': Dc, 'width': Wc, 'Wl': Wlc, 'Wr': Wrc})

    # 检查是否覆盖p_max
    if lines and lines[-1]['proj_pos'] + lines[-1]['Wl'] < p_max - 10:
        # 加一条末端线
        p_last = p_max - 5
        Dc = depth_at_p(p_last)
        Wc, Wlc, Wrc = coverage_width(Dc, theta, alpha_eff)
        lines.append({'proj_pos': p_last, 'depth': Dc, 'width': Wc, 'Wl': Wlc, 'Wr': Wrc})

    # 计算重叠率 & x坐标
    for i, ln in enumerate(lines):
        ln['x'] = np.clip(ln['proj_pos'] / cos_a, region.x_min, region.x_max)
        ln['y'] = cy_r
        if i > 0:
            prev = lines[i-1]
            overlap = prev['proj_pos'] + prev['Wr'] - (ln['proj_pos'] - ln['Wl'])
            ln['overlap'] = overlap / ((prev['width'] + ln['width']) / 2)
        else:
            ln['overlap'] = None
    return lines

# ==================== 动态规划 (改进版) ====================
def dp_lines(region, theta, target_eta=0.12, eta_min=0.08, eta_max=0.22, n_states=300):
    """改进DP: 更合理的状态转移和成本函数"""
    alpha_eff = math.atan(math.sqrt(region.a**2 + region.b**2))
    if abs(alpha_eff) < 1e-6: alpha_eff = 1e-6
    aspect = math.atan2(region.b, region.a)
    cos_a = max(abs(math.cos(aspect)), 0.01)
    cy_r = (region.y_min + region.y_max) / 2
    av = np.array([math.cos(aspect), math.sin(aspect)])

    corners = np.array([[region.x_min,region.y_min],[region.x_max,region.y_min],
                        [region.x_max,region.y_max],[region.x_min,region.y_max]])
    proj = corners @ av
    p_min, p_max = proj.min(), proj.max()
    p_range = p_max - p_min

    if p_range < 100 or len(region.deps) < 20:
        return greedy_lines(region, theta, target_eta, eta_min, eta_max)

    def depth_at_p(p):
        x = np.clip(p / cos_a, region.x_min, region.x_max)
        return max(region.a * x + region.b * cy_r + region.c, 1.0)

    # 离散状态空间
    n = n_states
    states = p_min + np.linspace(0, p_range, n)
    dp_step = p_range / (n - 1)

    # 预计算
    D_arr = np.array([depth_at_p(s) for s in states])
    W_arr = np.zeros(n); Wl_arr = np.zeros(n); Wr_arr = np.zeros(n)
    for i in range(n):
        w, wl, wr = coverage_width(D_arr[i], theta, alpha_eff)
        W_arr[i], Wl_arr[i], Wr_arr[i] = w, wl, wr

    INF = 1e18
    dp_cost = np.full(n, INF)
    dp_prev = np.full(n, -1, dtype=int)
    dp_nl = np.full(n, 0, dtype=int)

    # 初始化: 第一条线覆盖p_min
    for i in range(n):
        if states[i] - Wr_arr[i] <= p_min + dp_step * 2:
            dp_cost[i] = (region.y_max - region.y_min)
            dp_nl[i] = 1
            dp_prev[i] = -1

    # DP递推
    max_jump = min(n // 3, 80)  # 限制搜索范围
    for i in range(n):
        if dp_cost[i] >= INF: continue
        for j in range(i + 1, min(n, i + max_jump)):
            overlap = (states[i] + Wr_arr[i]) - (states[j] - Wl_arr[j])
            avg_w = (W_arr[i] + W_arr[j]) / 2
            if avg_w <= 0: continue
            eta = overlap / avg_w

            if eta < eta_min or eta > eta_max:
                continue

            # 成本: 线长 × 效率因子 (偏好更低重叠率)
            efficiency = 1.0 + max(0, eta - target_eta) * 1.5
            trans_cost = (region.y_max - region.y_min) * efficiency

            new_cost = dp_cost[i] + trans_cost
            if new_cost < dp_cost[j]:
                dp_cost[j] = new_cost
                dp_prev[j] = i
                dp_nl[j] = dp_nl[i] + 1

    # 找最优终点
    best = -1
    best_score = INF
    for i in range(n-1, -1, -1):
        if dp_cost[i] >= INF: continue
        if states[i] + Wl_arr[i] >= p_max - dp_step * 2:
            score = dp_cost[i] / max(dp_nl[i], 1)
            if score < best_score:
                best_score, best = score, i

    if best < 0:
        # DP失败, 回退贪心
        return greedy_lines(region, theta, target_eta, eta_min, eta_max)

    # 回溯
    path_idx = []
    cur = best
    while cur >= 0:
        path_idx.append(cur)
        cur = dp_prev[cur]
    path_idx.reverse()

    lines = []
    for idx in path_idx:
        lines.append({
            'proj_pos': states[idx],
            'x': np.clip(states[idx] / cos_a, region.x_min, region.x_max),
            'y': cy_r,
            'depth': D_arr[idx],
            'width': W_arr[idx],
            'Wl': Wl_arr[idx],
            'Wr': Wr_arr[idx],
        })

    for i in range(1, len(lines)):
        prev, curr = lines[i-1], lines[i]
        overlap = prev['proj_pos'] + prev['Wr'] - (curr['proj_pos'] - curr['Wl'])
        curr['overlap'] = overlap / ((prev['width'] + curr['width']) / 2)
    return lines

# ==================== 策略执行 ====================
def run_strategy(name, regions, line_func, theta, **kw):
    t0 = time.time()
    all_lines = []
    for r in regions:
        ls = line_func(r, theta, **kw)
        all_lines.extend(ls)

    total_len = len(all_lines) * L_NS_M
    # 统计
    excess, viol, gaps = 0, 0, 0
    for ln in all_lines:
        eta = ln.get('overlap')
        if eta is not None:
            if eta > 0.20: excess += (eta - 0.20); viol += 1
            if eta < 0: gaps += abs(eta)

    elapsed = time.time() - t0
    return {
        'name': name, 'n_lines': len(all_lines),
        'total_length_m': total_len,
        'total_length_nm': total_len / NAUTICAL_MILE,
        'overlap_excess': excess, 'overlap_violations': viol,
        'gap_total': gaps, 'elapsed': elapsed,
        'lines': all_lines, 'n_regions': len(regions),
    }

print("\n" + "=" * 70)
print("步骤3: 运行多策略对比")
print("=" * 70)

# 构建不同分区方案
whole_r = [QuadNode(0, L_EW_M, 0, L_NS_M, all_pts, depths)]

# 深度3分区
d_min, d_max = depths.min(), depths.max()
z1, z2 = d_min + (d_max-d_min)/3, d_min + 2*(d_max-d_min)/3
depth_regions = []
for (dl, dh) in [(d_min,z1),(z1,z2),(z2,d_max)]:
    mask = (depths >= dl) & (depths < dh)
    if mask.sum() < 10: continue
    pts = [(x_m[i],y_m[i],depths[i]) for i in range(N_POINTS) if mask[i]]
    depth_regions.append(QuadNode(x_m[mask].min(),x_m[mask].max(),
                                   y_m[mask].min(),y_m[mask].max(), pts, depths[mask]))

strategies = []

for name, regs, func, kw in [
    ("A-整体平面+贪心", whole_r, greedy_lines, {}),
    ("B-深度3分区+贪心", depth_regions, greedy_lines, {}),
    ("C-四叉树分区+贪心", leaves, greedy_lines, {}),
    ("D-整体平面+DP", whole_r, dp_lines, {}),
    ("E-深度3分区+DP", depth_regions, dp_lines, {}),
    ("F-四叉树+DP(推荐)", leaves, dp_lines, {}),
]:
    s = run_strategy(name, regs, func, THETA, target_eta=0.12, **kw)
    strategies.append(s)
    dp_flag = "DP" if "DP" in name else "贪心"
    fb = " [DP回退贪心]" if "DP" in name and s['n_regions'] <= 3 else ""
    print(f"  {name}: {s['n_lines']}条, {s['total_length_nm']:.1f}nm, "
          f"违规{s['overlap_violations']}次, {s['elapsed']:.1f}s{fb}")

# ==================== 参数敏感性分析 ====================
print("\n" + "=" * 70)
print("步骤4: 参数敏感性分析")
print("=" * 70)

theta_results, overlap_results, rmse_results = [], [], []

for td in [100, 110, 120, 130, 140]:
    tr = math.radians(td)
    s = run_strategy(f"θ={td}°", leaves, dp_lines, tr, target_eta=0.12)
    theta_results.append(s)
    print(f"  θ={td}°: {s['n_lines']}条, {s['total_length_nm']:.1f}nm")

for ot in [0.08, 0.10, 0.12, 0.15, 0.18]:
    s = run_strategy(f"η={ot:.0%}", leaves, dp_lines, THETA, target_eta=ot)
    overlap_results.append(s)
    print(f"  η_target={ot:.0%}: {s['n_lines']}条, {s['total_length_nm']:.1f}nm")

for rt in [2.0, 3.0, 5.0, 8.0, 15.0]:
    r2 = QuadNode(0, L_EW_M, 0, L_NS_M, all_pts, depths)
    r2.subdivide(rmse_thr=rt, min_pts=12)
    lv2 = r2.leaves()
    s = run_strategy(f"RMSE={rt}m", lv2, dp_lines, THETA, target_eta=0.12)
    rmse_results.append(s)
    print(f"  RMSE阈值={rt}m ({len(lv2)}区): {s['n_lines']}条, {s['total_length_nm']:.1f}nm")

# ==================== 收敛性验证 ====================
print("\n" + "=" * 70)
print("步骤5: 收敛性验证 (10次随机地形)")
print("=" * 70)
dp_nl = []
for seed in range(42, 52):
    np.random.seed(seed)
    xn = np.random.uniform(0, L_EW, N_POINTS); yn = np.random.uniform(0, L_NS, N_POINTS)
    ds = (depth_center + (cx-xn)*NAUTICAL_MILE*base_slope + (yn-cy)*NAUTICAL_MILE*0.0001 +
          15*np.exp(-((xn-1)**2+(yn-2)**2)/0.3) + -10*np.exp(-((xn-3)**2+(yn-3.5)**2)/0.5) +
          8*np.sin(xn*2.5)*np.cos(yn*1.8)*0.3 + -12*np.exp(-((xn-2)**2+(yn-1)**2)/0.4) +
          np.random.normal(0,3,N_POINTS))
    ds = np.maximum(ds,1)
    pts_s = [(xn[i]*NAUTICAL_MILE,yn[i]*NAUTICAL_MILE,ds[i]) for i in range(N_POINTS)]
    r_s = QuadNode(0,L_EW_M,0,L_NS_M,pts_s,ds)
    r_s.subdivide(rmse_thr=2.5, min_pts=12)
    s = run_strategy(f"s{seed}", r_s.leaves(), dp_lines, THETA, target_eta=0.12)
    dp_nl.append(s['n_lines'])
    print(f"  seed={seed}: {s['n_lines']}条, {s['total_length_nm']:.1f}nm")
print(f"  统计: 均值={np.mean(dp_nl):.1f}, σ={np.std(dp_nl):.1f}, min={np.min(dp_nl)}, max={np.max(dp_nl)}")

# ==================== 可视化 ====================
print("\n" + "=" * 70)
print("步骤6: 生成可视化图表")
print("=" * 70)
best = strategies[-1]  # F策略
best_lines = best['lines']

# 图1: 地形+分区+测线
fig1, ax1 = plt.subplots(figsize=(14,9))
ax1.imshow(grid_Z, extent=[0,L_EW_M,0,L_NS_M], origin='lower', cmap='Blues_r', alpha=0.85, aspect='auto')
cs = ax1.contour(grid_X, grid_Y, grid_Z, levels=20, colors='navy', alpha=0.3, linewidths=0.4)
ax1.clabel(cs, inline=True, fontsize=6, fmt='%.0f')
for lf in leaves:
    ax1.add_patch(plt.Rectangle((lf.x_min,lf.y_min), lf.x_max-lf.x_min, lf.y_max-lf.y_min,
                                 fill=False, edgecolor='red', linewidth=1.2, linestyle='--', alpha=0.6))
for i, ln in enumerate(best_lines):
    if i % max(1,len(best_lines)//20)==0:
        ax1.axvline(x=ln['x'], color='darkorange', linewidth=1.5, alpha=0.7)
        ax1.text(ln['x'], L_NS_M*0.97, f'{i+1}', fontsize=6, color='darkred', ha='center', fontweight='bold')
ax1.set_xlabel('East-West (m)'); ax1.set_ylabel('North-South (m)')
ax1.set_title(f'Seabed + Quadtree Partitions ({len(leaves)} zones) + Survey Lines ({best["n_lines"]} lines)')
ax1.set_xlim(0,L_EW_M); ax1.set_ylim(0,L_NS_M)
plt.tight_layout(); fig1.savefig(os.path.join(FIG_DIR,'fig1_topography.png'),dpi=150,bbox_inches='tight'); plt.close()

# 图2: 策略对比
fig2, axes2 = plt.subplots(1,3,figsize=(16,5))
names = [s['name'] for s in strategies]
clrs = ['#4472C4']*3 + ['#ED7D31']*3
axes2[0].barh(names, [s['n_lines'] for s in strategies], color=clrs, edgecolor='white')
for i,v in enumerate([s['n_lines'] for s in strategies]): axes2[0].text(v+0.3,i,str(v),va='center',fontsize=10,fontweight='bold')
axes2[0].set_xlabel('Lines'); axes2[0].set_title('Line Count')
axes2[1].barh(names, [s['total_length_nm'] for s in strategies], color=clrs, edgecolor='white')
for i,v in enumerate([s['total_length_nm'] for s in strategies]): axes2[1].text(v+0.3,i,f'{v:.1f}',va='center',fontsize=10,fontweight='bold')
axes2[1].set_xlabel('Total Length (nm)'); axes2[1].set_title('Total Length')
axes2[2].barh(names, [s['elapsed'] for s in strategies], color=clrs, edgecolor='white')
for i,v in enumerate([s['elapsed'] for s in strategies]): axes2[2].text(v+0.01,i,f'{v:.1f}s',va='center',fontsize=9)
axes2[2].set_xlabel('Time (s)'); axes2[2].set_title('Compute Time')
plt.tight_layout(); fig2.savefig(os.path.join(FIG_DIR,'fig2_strategies.png'),dpi=150,bbox_inches='tight'); plt.close()

# 图3: 敏感性
fig3, axes3 = plt.subplots(1,3,figsize=(16,5))
axes3[0].plot([100,110,120,130,140], [r['n_lines'] for r in theta_results],'o-',color='#4472C4',lw=2,ms=8)
axes3[0].set_xlabel('Opening Angle (deg)'); axes3[0].set_ylabel('Lines'); axes3[0].set_title('Sensitivity: Opening Angle'); axes3[0].grid(alpha=0.3)
axes3[1].plot([o*100 for o in [0.08,0.10,0.12,0.15,0.18]], [r['n_lines'] for r in overlap_results],'s-',color='#ED7D31',lw=2,ms=8)
axes3[1].set_xlabel('Target Overlap (%)'); axes3[1].set_ylabel('Lines'); axes3[1].set_title('Sensitivity: Target Overlap'); axes3[1].grid(alpha=0.3)
axes3[2].plot([2.0,3.0,5.0,8.0,15.0], [r['n_lines'] for r in rmse_results],'D-',color='#70AD47',lw=2,ms=8)
for i,rt in enumerate([2.0,3.0,5.0,8.0,15.0]):
    axes3[2].annotate(f'{rmse_results[i]["n_regions"]}zones',(rt,rmse_results[i]['n_lines']),textcoords="offset points",xytext=(0,10),fontsize=8,ha='center')
axes3[2].set_xlabel('RMSE Threshold (m)'); axes3[2].set_ylabel('Lines'); axes3[2].set_title('Sensitivity: RMSE Threshold'); axes3[2].grid(alpha=0.3)
plt.tight_layout(); fig3.savefig(os.path.join(FIG_DIR,'fig3_sensitivity.png'),dpi=150,bbox_inches='tight'); plt.close()

# 图4: 收敛性
fig4, ax4 = plt.subplots(figsize=(10,5))
ax4.bar(range(len(dp_nl)), dp_nl, color='#4472C4', edgecolor='white')
ax4.axhline(np.mean(dp_nl), color='red', linestyle='--', lw=2, label=f'Mean={np.mean(dp_nl):.1f}')
ax4.axhline(np.mean(dp_nl)+np.std(dp_nl), color='orange', linestyle=':', lw=1.5)
ax4.axhline(np.mean(dp_nl)-np.std(dp_nl), color='orange', linestyle=':', lw=1.5, label=f'±1σ')
ax4.set_xlabel('Random Seed'); ax4.set_ylabel('Lines'); ax4.set_title('Convergence (10 Random Terrains)')
ax4.legend(); ax4.grid(alpha=0.3,axis='y')
plt.tight_layout(); fig4.savefig(os.path.join(FIG_DIR,'fig4_convergence.png'),dpi=150,bbox_inches='tight'); plt.close()

# 图5: 最优方案详情
fig5 = plt.figure(figsize=(16,10))
gs = GridSpec(2,2,figure=fig5,hspace=0.3,wspace=0.25)
ax5a=fig5.add_subplot(gs[0,0])
ax5a.scatter([l['depth'] for l in best_lines],[l['width'] for l in best_lines],
             c=range(len(best_lines)),cmap='RdYlGn_r',s=40,edgecolors='black',lw=0.3)
ax5a.set_xlabel('Depth (m)'); ax5a.set_ylabel('Width (m)'); ax5a.set_title('Depth vs Width'); ax5a.grid(alpha=0.3)
ax5b=fig5.add_subplot(gs[0,1])
ovs=[l['overlap']*100 for l in best_lines if l.get('overlap') is not None]
ax5b.hist(ovs, bins=15, color='steelblue', edgecolor='white', alpha=0.8)
ax5b.axvline(10,color='green',ls='--',lw=2,label='Min(8%)'); ax5b.axvline(22,color='red',ls='--',lw=2,label='Max(22%)')
ax5b.set_xlabel('Overlap (%)'); ax5b.set_ylabel('Freq'); ax5b.set_title('Overlap Distribution'); ax5b.legend(fontsize=8); ax5b.grid(alpha=0.3,axis='y')
ax5c=fig5.add_subplot(gs[1,:])
for i,ln in enumerate(best_lines):
    ax5c.barh(0,ln['width'],left=ln['x']-ln['Wl'],height=0.6,
              color=plt.cm.RdYlGn_r(i/len(best_lines)),edgecolor='black',lw=0.3,alpha=0.85)
    if i%max(1,len(best_lines)//20)==0: ax5c.text(ln['x'],0.2,f'{i+1}',fontsize=7,ha='center',fontweight='bold')
ax5c.set_xlim(0,L_EW_M); ax5c.set_ylim(-1,1); ax5c.set_yticks([])
ax5c.set_xlabel('East-West Position (m)'); ax5c.set_title(f'Optimal Lines: {best["n_lines"]} lines, {best["total_length_nm"]:.1f}nm')
ax5c.grid(alpha=0.3,axis='x')
plt.tight_layout(); fig5.savefig(os.path.join(FIG_DIR,'fig5_optimal.png'),dpi=150,bbox_inches='tight'); plt.close()

print("  全部5张图表已保存")

# ==================== 结果汇总 ====================
print("\n" + "=" * 70)
print("最终结果汇总")
print("=" * 70)
print(f"{'策略':<25} {'线数':<6} {'总长(nm)':<10} {'违规':<5} {'耗时':<8}")
print("-"*60)
for s in strategies:
    print(f"{s['name']:<25} {s['n_lines']:<6} {s['total_length_nm']:<10.1f} {s['overlap_violations']:<5} {s['elapsed']:<8.1f}")

baseline = strategies[0]
print(f"\n最佳方案(F) vs 基线(A):")
print(f"  测线数: {baseline['n_lines']} → {best['n_lines']} ({100*(baseline['n_lines']-best['n_lines'])/baseline['n_lines']:.1f}%)")
print(f"  总长度: {baseline['total_length_nm']:.1f} → {best['total_length_nm']:.1f} nm")

# 保存JSON
res = {
    'optimal': {'strategy': best['name'], 'n_lines': best['n_lines'],
                'total_length_m': best['total_length_m'], 'total_length_nm': best['total_length_nm'],
                'n_regions': best['n_regions'],
                'lines': [{'id':i+1,'x_m':round(l['x'],1),'y_m':round(l['y'],1),
                          'depth_m':round(l['depth'],2),'width_m':round(l['width'],2),
                          'overlap_pct':round(l['overlap']*100,2) if l.get('overlap') else None}
                         for i,l in enumerate(best_lines)]},
    'all_strategies': [{'name':s['name'],'n_lines':s['n_lines'],'length_nm':round(s['total_length_nm'],1),
                        'violations':s['overlap_violations'],'time_s':round(s['elapsed'],2)} for s in strategies],
    'sensitivity': {
        'theta': [{'theta':t,'n_lines':r['n_lines'],'length_nm':round(r['total_length_nm'],1)}
                  for t,r in zip([100,110,120,130,140],theta_results)],
        'overlap': [{'target':f'{o:.0%}','n_lines':r['n_lines'],'length_nm':round(r['total_length_nm'],1)}
                    for o,r in zip([0.08,0.10,0.12,0.15,0.18],overlap_results)],
    },
    'convergence': {'mean': float(np.mean(dp_nl)), 'std': float(np.std(dp_nl)),
                    'min': int(np.min(dp_nl)), 'max': int(np.max(dp_nl))},
}
with open(os.path.join(FIG_DIR,'optimal_results.json'),'w',encoding='utf-8') as f:
    json.dump(res, f, ensure_ascii=False, indent=2)
print(f"\nJSON数据已保存")

print("\n" + "=" * 70)
print("计算全部完成!")
print("=" * 70)
