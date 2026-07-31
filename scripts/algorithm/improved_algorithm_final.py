# -*- coding: utf-8 -*-
"""
问题4终极改进算法 —— 连续N-S测线 + E-W方向DP优化
=====================================================
核心思路:
  1. 测线沿N-S方向贯穿整个海域 (每条线长5海里)
  2. 在E-W方向上用DP选择最优测线x位置
  3. 每条测线的有效覆盖宽度 = 沿该经线的最小覆盖宽度(保守估计)
  4. 多种策略对比: 均匀间距/贪心/DP/GA
  5. 局部调整: DP初始解 + 爬山法精调
"""
import math, numpy as np, matplotlib, os, json, time, warnings
warnings.filterwarnings('ignore')
matplotlib.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'DejaVu Sans']
matplotlib.rcParams['axes.unicode_minus'] = False
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec
from scipy.interpolate import griddata, interp1d
from scipy.ndimage import gaussian_filter

FIG_DIR = r"E:\我的桌面\B题作业"
os.makedirs(FIG_DIR, exist_ok=True)

# ==================== 全局参数 ====================
THETA_DEG, NAUTICAL_MILE = 120, 1852
L_NS, L_EW = 5, 4
L_NS_M, L_EW_M = L_NS * NAUTICAL_MILE, L_EW * NAUTICAL_MILE
THETA = math.radians(THETA_DEG)

# ==================== 步骤1: 生成&加载地形 ====================
print("=" * 70)
print("步骤1: 构建海底地形模型")
print("=" * 70)

np.random.seed(42)
N_PTS = 800
x_nm = np.random.uniform(0, L_EW, N_PTS)
y_nm = np.random.uniform(0, L_NS, N_PTS)
cx, cy = L_EW/2, L_NS/2
alpha_base = math.radians(1.5)

depths_raw = (110 + (cx - x_nm)*NAUTICAL_MILE*math.tan(alpha_base) +
              (y_nm - cy)*NAUTICAL_MILE*0.0001 +
              15*np.exp(-((x_nm-1)**2+(y_nm-2)**2)/0.3) +
              -10*np.exp(-((x_nm-3)**2+(y_nm-3.5)**2)/0.5) +
              8*np.sin(x_nm*2.5)*np.cos(y_nm*1.8)*0.3 +
              -12*np.exp(-((x_nm-2)**2+(y_nm-1)**2)/0.4) +
              np.random.normal(0, 3, N_PTS))
depths_raw = np.maximum(depths_raw, 1.0)

# 高分辨率网格
GRID = 200
gx = np.linspace(0, L_EW_M, GRID)
gy = np.linspace(0, L_NS_M, GRID)
gX, gY = np.meshgrid(gx, gy)
gZ = griddata((x_nm*NAUTICAL_MILE, y_nm*NAUTICAL_MILE), depths_raw, (gX, gY), method='cubic')
gZ[np.isnan(gZ)] = np.nanmean(gZ)
gZ = gaussian_filter(gZ, sigma=1.0)  # 轻微平滑

# 沿N-S方向的深度剖面 (200条经线, 每条200个采样点)
N_PROFILES = 200
profile_x = np.linspace(50, L_EW_M - 50, N_PROFILES)
profile_depth_min = np.zeros(N_PROFILES)    # 沿经线的最小深度
profile_depth_mean = np.zeros(N_PROFILES)   # 沿经线的平均深度
profile_depth_p10 = np.zeros(N_PROFILES)    # 沿经线的10分位深度

for i, px in enumerate(profile_x):
    ix = np.argmin(np.abs(gx - px))
    profile = gZ[:, ix]
    profile_depth_min[i] = np.min(profile)
    profile_depth_mean[i] = np.mean(profile)
    profile_depth_p10[i] = np.percentile(profile, 10)

print(f"  网格: {GRID}x{GRID}, 等深线剖面: {N_PROFILES}条")
print(f"  跨海域深度范围: {profile_depth_min.min():.1f} ~ {profile_depth_mean.max():.1f} m")

# ==================== 覆盖宽度 ====================
def cov_width(D, theta, alpha_eff):
    if abs(alpha_eff) < 1e-8:
        w = 2*D*math.tan(theta/2); return w, w/2, w/2
    aL = math.pi/2 - theta/2 - alpha_eff
    aR = math.pi/2 - theta/2 + alpha_eff
    Wl = D*math.sin(theta/2)/math.sin(aL)
    Wr = D*math.sin(theta/2)/math.sin(aR)
    return Wl+Wr, Wl, Wr

# 拟合整体坡度方向
from scipy.optimize import minimize

def fit_slope_EW():
    """沿E-W方向拟合坡度"""
    xs_flat = gX.ravel()
    ys_flat = gY.ravel()
    zs_flat = gZ.ravel()
    A = np.column_stack([xs_flat, ys_flat, np.ones_like(xs_flat)])
    coeffs, _, _, _ = np.linalg.lstsq(A, zs_flat, rcond=None)
    a, b, c = coeffs
    alpha_eff = math.atan(math.sqrt(a**2 + b**2))
    aspect = math.atan2(b, a)
    return alpha_eff, aspect, a, b, c

alpha_overall, aspect_overall, a_fit, b_fit, c_fit = fit_slope_EW()
print(f"  整体坡度: {math.degrees(alpha_overall):.2f}°, 坡向: {math.degrees(aspect_overall):.1f}°")

# 测线方向: 垂直于坡向 → 约等于N-S方向
# 覆盖宽度方向: 沿坡向 → 约等于E-W方向
alpha_for_lines = alpha_overall

print(f"  测线方向: N-S, 覆盖宽度方向: E-W")

# ==================== 步骤2: 多种策略 ====================
print("\n" + "=" * 70)
print("步骤2: 运行多策略优化")
print("=" * 70)

def line_width_at_x(px, use='mean'):
    """计算在x位置处一条N-S测线的有效覆盖宽度"""
    idx = np.argmin(np.abs(profile_x - px))
    if use == 'min':
        D = profile_depth_min[idx]
    elif use == 'mean':
        D = profile_depth_mean[idx]
    else:  # p10
        D = profile_depth_p10[idx]
    D = max(D, 1.0)
    w, wl, wr = cov_width(D, THETA, alpha_for_lines)
    return w, wl, wr, D

# ---- 策略A: 等间距布设 (baseline) ----
def uniform_lines(n_lines=None):
    """等间距布设"""
    if n_lines is None:
        # 根据平均深度估算
        D_avg = np.mean(profile_depth_p10)
        W_avg, _, _ = cov_width(D_avg, THETA, alpha_for_lines)
        n_lines = max(3, int(L_EW_M / (W_avg * 0.85)) + 2)
    xs = np.linspace(0, L_EW_M, n_lines + 2)[1:-1]  # 去掉端点
    lines = []
    for x in xs:
        w, wl, wr, d = line_width_at_x(x, 'p10')
        lines.append({'x': x, 'width': w, 'Wl': wl, 'Wr': wr, 'depth': d, 'overlap': None})
    for i in range(1, len(lines)):
        prev, cur = lines[i-1], lines[i]
        overlap = (prev['x'] + prev['Wr']) - (cur['x'] - cur['Wl'])
        cur['overlap'] = overlap / ((prev['width'] + cur['width']) / 2)
    return lines

# ---- 策略B: 贪心算法 (改进版) ----
def greedy_lines(target_eta=0.12, eta_min=0.06, eta_max=0.25):
    """从东(浅)向西(深)贪心放置"""
    lines = []
    # 第一条线: 从浅水端开始
    x = 50  # 起始位置(米)
    # 搜索第一条线: 右覆盖恰好覆盖x=0
    for _ in range(5000):
        w, wl, wr, d = line_width_at_x(x, 'p10')
        if x - wr <= 0:
            break
        x += 2
    w, wl, wr, d = line_width_at_x(x, 'p10')
    lines.append({'x': x, 'width': w, 'Wl': wl, 'Wr': wr, 'depth': d, 'overlap': None})

    for _ in range(200):
        prev = lines[-1]
        left_bound = prev['x'] + prev['Wr']
        if left_bound >= L_EW_M - 10:
            break

        # 估算搜索区间
        est_spacing = prev['width'] * (1 - target_eta)
        lo = max(prev['x'] + 5, prev['x'] + est_spacing * 0.4)
        hi = min(L_EW_M, prev['x'] + est_spacing * 1.8)

        best_x, best_diff = None, 1e9
        xi = lo
        while xi <= hi:
            wc, wlc, wrc, dc = line_width_at_x(xi, 'p10')
            overlap = left_bound - (xi - wlc)
            if (prev['width'] + wc) > 0:
                eta = overlap / ((prev['width'] + wc) / 2)
            else:
                eta = 0
            if eta_min <= eta <= eta_max:
                diff = abs(eta - target_eta)
                if diff < best_diff:
                    best_diff, best_x = diff, xi
            xi += 2

        if best_x is None:
            xi = lo
            while xi <= hi:
                wc, wlc, wrc, dc = line_width_at_x(xi, 'p10')
                overlap = left_bound - (xi - wlc)
                if (prev['width'] + wc) > 0:
                    eta = overlap / ((prev['width'] + wc) / 2)
                else:
                    eta = 0
                diff = abs(eta - target_eta)
                if diff < best_diff:
                    best_diff, best_x = diff, xi
                xi += 2
        if best_x is None: break

        wc, wlc, wrc, dc = line_width_at_x(best_x, 'p10')
        lines.append({'x': best_x, 'width': wc, 'Wl': wlc, 'Wr': wrc, 'depth': dc})

    # 检查最西端覆盖
    last = lines[-1]
    if last['x'] + last['Wl'] < L_EW_M - 5:
        x_last = L_EW_M - 10
        wc, wlc, wrc, dc = line_width_at_x(x_last, 'p10')
        lines.append({'x': x_last, 'width': wc, 'Wl': wlc, 'Wr': wrc, 'depth': dc})

    # 重新计算重叠率
    for i in range(1, len(lines)):
        prev, cur = lines[i-1], lines[i]
        overlap = prev['x'] + prev['Wr'] - (cur['x'] - cur['Wl'])
        cur['overlap'] = overlap / ((prev['width'] + cur['width']) / 2)
    return lines

# ---- 策略C: 动态规划 ----
def dp_lines(target_eta=0.12, eta_min=0.04, eta_max=0.30, n_states=500):
    """DP在E-W方向选择最优x位置序列"""
    x_states = np.linspace(10, L_EW_M - 10, n_states)
    dx = x_states[1] - x_states[0]

    # 预计算
    W_arr = np.zeros(n_states); Wl_arr = np.zeros(n_states); Wr_arr = np.zeros(n_states)
    for i in range(n_states):
        w, wl, wr, d = line_width_at_x(x_states[i], 'mean')
        W_arr[i], Wl_arr[i], Wr_arr[i] = w, wl, wr

    INF = 1e18
    dp_cost = np.full(n_states, INF)
    dp_prev = np.full(n_states, -1, dtype=int)
    dp_nlines = np.full(n_states, 0, dtype=int)

    # 初始化
    for i in range(n_states):
        if x_states[i] - Wr_arr[i] <= dx:
            dp_cost[i] = L_NS_M  # 每条线长5nm
            dp_nlines[i] = 1

    # DP
    max_jump = min(n_states // 3, 150)
    for i in range(n_states):
        if dp_cost[i] >= INF: continue
        for j in range(i+1, min(n_states, i+max_jump)):
            overlap = (x_states[i] + Wr_arr[i]) - (x_states[j] - Wl_arr[j])
            avg_w = (W_arr[i] + W_arr[j]) / 2
            if avg_w <= 0: continue
            eta = overlap / avg_w
            if eta < eta_min or eta > eta_max: continue

            # 惩罚偏离目标重叠率
            penalty = 1.0 + abs(eta - target_eta) * 1.0
            trans_cost = L_NS_M * penalty
            new_cost = dp_cost[i] + trans_cost
            if new_cost < dp_cost[j]:
                dp_cost[j] = new_cost
                dp_prev[j] = i
                dp_nlines[j] = dp_nlines[i] + 1

    # 找最优终点 (覆盖西边界)
    best_end = -1
    best_score = INF
    for i in range(n_states-1, -1, -1):
        if dp_cost[i] >= INF: continue
        if x_states[i] + Wl_arr[i] >= L_EW_M - dx:
            score = dp_cost[i] / max(dp_nlines[i], 1)
            if score < best_score:
                best_score, best_end = score, i

    if best_end < 0:
        print("    DP未找到解，回退贪心")
        return greedy_lines(target_eta, eta_min, eta_max)

    # 回溯
    path = []
    cur = best_end
    while cur >= 0:
        w, wl, wr, d = line_width_at_x(x_states[cur], 'mean')
        path.append({'x': x_states[cur], 'width': w, 'Wl': wl, 'Wr': wr, 'depth': d})
        cur = dp_prev[cur]
    path.reverse()
    for i in range(1, len(path)):
        prev, cur = path[i-1], path[i]
        overlap = prev['x'] + prev['Wr'] - (cur['x'] - cur['Wl'])
        cur['overlap'] = overlap / ((prev['width'] + cur['width']) / 2)
    return path

# ---- 策略D: 局部搜索精调 (爬山法) ----
def hill_climb(initial_lines, target_eta=0.12, eta_min=0.06, eta_max=0.25, n_iter=500):
    """在DP/贪心解的基础上做局部爬山优化"""
    lines = [dict(l) for l in initial_lines]
    n = len(lines)
    best_count = n

    def eval_solution(ls):
        if len(ls) < 2: return 1e9
        nl = len(ls)
        # 检查覆盖
        for i in range(1, nl):
            prev, cur = ls[i-1], ls[i]
            overlap = prev['x'] + prev['Wr'] - (cur['x'] - cur['Wl'])
            if overlap < 0: return 1e9  # 漏测不可接受
        # 成本: 线数 × 平均重叠率惩罚
        avg_overlap = np.mean([abs(ls[i].get('overlap', 0.12) - target_eta) for i in range(1, nl)])
        return nl * (1 + avg_overlap)

    def rebuild(lines_list):
        """重新计算覆盖宽度和重叠率"""
        for i, ln in enumerate(lines_list):
            w, wl, wr, d = line_width_at_x(ln['x'], 'p10')
            ln['width'], ln['Wl'], ln['Wr'], ln['depth'] = w, wl, wr, d
        for i in range(1, len(lines_list)):
            prev, cur = lines_list[i-1], lines_list[i]
            overlap = prev['x'] + prev['Wr'] - (cur['x'] - cur['Wl'])
            cur['overlap'] = overlap / ((prev['width'] + cur['width']) / 2)
        return lines_list

    current = rebuild(lines)
    current_score = eval_solution(current)

    improved = True
    it = 0
    while improved and it < n_iter:
        improved = False
        it += 1
        for i in range(1, n - 1):  # 不移动首尾
            orig_x = current[i]['x']
            # 尝试微小移动
            for dx in [15, -15, 30, -30, 50, -50, 80, -80]:
                new_x = max(10, min(L_EW_M - 10, orig_x + dx))
                if abs(new_x - orig_x) < 5: continue
                candidate = [dict(l) for l in current]
                candidate[i]['x'] = new_x
                candidate = rebuild(candidate)
                score = eval_solution(candidate)
                if score < current_score:
                    # 也尝试删除这条线
                    deleted = [dict(l) for l in current[:i] + current[i+1:]]
                    deleted = rebuild(deleted)
                    dscore = eval_solution(deleted)
                    if dscore < score:
                        current = deleted
                        current_score = dscore
                        n = len(current)
                        improved = True
                        break
                    else:
                        current = candidate
                        current_score = score
                        improved = True
                        break
            if improved: break
    return current

# ---- 策略E: 遗传算法全局搜索 ----
def ga_lines(pop_size=50, generations=100, target_eta=0.12):
    """遗传算法搜索最优测线位置"""
    # 先估算大致线数
    D_avg = np.mean(profile_depth_p10)
    W_avg, _, _ = cov_width(D_avg, THETA, alpha_for_lines)
    est_n = max(3, int(L_EW_M / (W_avg * 0.88)) + 1)
    n_lines = est_n

    def decode(chromosome):
        """染色体是n_lines个x坐标(已排序)"""
        xs = sorted(chromosome)
        xs = [max(10, min(L_EW_M-10, x)) for x in xs]
        return xs

    def fitness(chromosome):
        xs = decode(chromosome)
        lines = []
        for x in xs:
            w, wl, wr, d = line_width_at_x(x, 'p10')
            lines.append({'x': x, 'width': w, 'Wl': wl, 'Wr': wr, 'depth': d})
        # 检查覆盖
        penalty = 0
        for i in range(1, len(lines)):
            prev, cur = lines[i-1], lines[i]
            overlap = prev['x'] + prev['Wr'] - (cur['x'] - cur['Wl'])
            if overlap < 0:
                penalty += abs(overlap) * 10  # 漏测重罚
            else:
                eta = overlap / ((prev['width'] + cur['width']) / 2)
                if eta < 0.06 or eta > 0.25:
                    penalty += abs(eta - target_eta) * 5
                else:
                    penalty += abs(eta - target_eta) * 0.5
        # 也检查是否覆盖两侧
        if lines[0]['x'] - lines[0]['Wr'] > 50:
            penalty += (lines[0]['x'] - lines[0]['Wr']) * 2
        if lines[-1]['x'] + lines[-1]['Wl'] < L_EW_M - 50:
            penalty += (L_EW_M - lines[-1]['x'] - lines[-1]['Wl']) * 2
        return -penalty  # 越大越好

    # 初始化种群
    pop = []
    # 包含贪心解
    greedy_sol = greedy_lines(target_eta)
    gx_positions = [l['x'] for l in greedy_sol]
    if len(gx_positions) < n_lines:
        gx_positions += [gx_positions[-1] + 100*(i+1) for i in range(n_lines - len(gx_positions))]
    elif len(gx_positions) > n_lines:
        gx_positions = gx_positions[:n_lines]
    pop.append(sorted(gx_positions))

    # 随机解
    for _ in range(pop_size - 1):
        xs = np.sort(np.random.uniform(10, L_EW_M-10, n_lines))
        pop.append(xs.tolist())

    best_fit = -1e9; best_chrom = None
    for gen in range(generations):
        fits = [fitness(c) for c in pop]
        sorted_idx = np.argsort(fits)[::-1]
        if fits[sorted_idx[0]] > best_fit:
            best_fit = fits[sorted_idx[0]]
            best_chrom = pop[sorted_idx[0]][:]

        # 选择top 50%
        elite = [pop[i] for i in sorted_idx[:pop_size//2]]
        # 交叉+变异
        new_pop = elite[:]
        while len(new_pop) < pop_size:
            p1 = elite[np.random.randint(len(elite))]
            p2 = elite[np.random.randint(len(elite))]
            # 交叉
            child = []
            for j in range(n_lines):
                if np.random.random() < 0.5:
                    child.append(p1[j])
                else:
                    child.append(p2[j])
            # 变异
            for j in range(n_lines):
                if np.random.random() < 0.1:
                    child[j] += np.random.normal(0, 30)
            new_pop.append(sorted(child))
        pop = new_pop[:pop_size]

    # 解码最优
    xs = decode(best_chrom)
    lines = []
    for x in xs:
        w, wl, wr, d = line_width_at_x(x, 'p10')
        lines.append({'x': x, 'width': w, 'Wl': wl, 'Wr': wr, 'depth': d, 'overlap': None})
    for i in range(1, len(lines)):
        prev, cur = lines[i-1], lines[i]
        overlap = prev['x'] + prev['Wr'] - (cur['x'] - cur['Wl'])
        cur['overlap'] = overlap / ((prev['width'] + cur['width']) / 2)
    return lines

# ---- 策略F: 自适应密度 ----
def adaptive_density_lines(target_eta=0.12):
    """根据局部坡度/深度自适应调整线间距"""
    # 将海域沿E-W分为若干段, 每段用不同的目标重叠率
    # 深水区(西侧): 覆盖宽度大 → 可用更低重叠率
    # 浅水区(东侧): 覆盖宽度小 → 需更高重叠率保证不漏测

    segments = []
    seg_width = L_EW_M / 8  # 8个E-W段
    for s in range(8):
        x0 = s * seg_width
        x1 = (s + 1) * seg_width
        mask = (profile_x >= x0) & (profile_x < x1)
        if mask.sum() == 0: continue
        avg_d = np.mean(profile_depth_p10[mask])
        segments.append({'x0': x0, 'x1': x1, 'avg_depth': avg_d})

    # 逐段贪心
    lines = []
    x_start = 10
    for seg in segments:
        if x_start >= seg['x1']: continue
        D_avg_seg = seg['avg_depth']
        # 深水区用更低重叠率(可以更稀疏)
        if D_avg_seg > 150:
            local_target = 0.08
        elif D_avg_seg > 100:
            local_target = 0.12
        else:
            local_target = 0.16

        x = max(x_start, seg['x0'])
        while x < seg['x1'] and x < L_EW_M - 10:
            w, wl, wr, d = line_width_at_x(x, 'p10')
            lines.append({'x': x, 'width': w, 'Wl': wl, 'Wr': wr, 'depth': d, 'overlap': None})
            spacing = w * (1 - local_target)
            x += max(spacing, 30)
        x_start = x

    # 去重+排序
    lines.sort(key=lambda l: l['x'])
    # 合并过于接近的线
    merged = [lines[0]]
    for l in lines[1:]:
        if l['x'] - merged[-1]['x'] < 30:
            # 取平均
            merged[-1]['x'] = (merged[-1]['x'] + l['x']) / 2
            w, wl, wr, d = line_width_at_x(merged[-1]['x'], 'p10')
            merged[-1]['width'], merged[-1]['Wl'], merged[-1]['Wr'], merged[-1]['depth'] = w, wl, wr, d
        else:
            merged.append(l)
    lines = merged

    # 计算重叠率
    for i in range(1, len(lines)):
        prev, cur = lines[i-1], lines[i]
        overlap = prev['x'] + prev['Wr'] - (cur['x'] - cur['Wl'])
        cur['overlap'] = overlap / ((prev['width'] + cur['width']) / 2)
    return lines

# ==================== 运行所有策略 ====================
def eval_strategy(name, lines_func, *args, **kwargs):
    t0 = time.time()
    lines = lines_func(*args, **kwargs)
    total_len = len(lines) * L_NS_M
    viol, excess, gaps = 0, 0, 0
    overlaps = []
    for ln in lines:
        eta = ln.get('overlap')
        if eta is not None:
            overlaps.append(eta)
            if eta > 0.20: viol += 1; excess += eta - 0.20
            if eta < 0: gaps += abs(eta)
    elapsed = time.time() - t0
    return {
        'name': name, 'n_lines': len(lines),
        'total_length_nm': total_len / NAUTICAL_MILE,
        'total_length_m': total_len,
        'violations': viol, 'excess': excess, 'gaps': gaps,
        'elapsed': elapsed, 'lines': lines,
        'overlaps': overlaps,
    }

all_strategies = []

# A: 等间距
s = eval_strategy("A-等间距布设", uniform_lines)
all_strategies.append(s)
print(f"  {s['name']}: {s['n_lines']}条, {s['total_length_nm']:.1f}nm, 违规{s['violations']}次, {s['elapsed']:.1f}s")

# B: 贪心
s = eval_strategy("B-贪心算法", greedy_lines, 0.12)
all_strategies.append(s)
print(f"  {s['name']}: {s['n_lines']}条, {s['total_length_nm']:.1f}nm, 违规{s['violations']}次, {s['elapsed']:.1f}s")

# C: DP
s = eval_strategy("C-动态规划", dp_lines, 0.12)
all_strategies.append(s)
print(f"  {s['name']}: {s['n_lines']}条, {s['total_length_nm']:.1f}nm, 违规{s['violations']}次, {s['elapsed']:.1f}s")

# D: 爬山精调 (基于DP)
dp_init = dp_lines(0.12)
s = eval_strategy("D-DP+爬山法", hill_climb, dp_init, 0.12)
all_strategies.append(s)
print(f"  {s['name']}: {s['n_lines']}条, {s['total_length_nm']:.1f}nm, 违规{s['violations']}次, {s['elapsed']:.1f}s")

# E: 遗传算法
s = eval_strategy("E-遗传算法", ga_lines, 60, 150, 0.12)
all_strategies.append(s)
print(f"  {s['name']}: {s['n_lines']}条, {s['total_length_nm']:.1f}nm, 违规{s['violations']}次, {s['elapsed']:.1f}s")

# F: 自适应密度
s = eval_strategy("F-自适应密度", adaptive_density_lines, 0.12)
all_strategies.append(s)
print(f"  {s['name']}: {s['n_lines']}条, {s['total_length_nm']:.1f}nm, 违规{s['violations']}次, {s['elapsed']:.1f}s")

# ==================== 参数敏感性分析 ====================
print("\n" + "=" * 70)
print("步骤3: 参数敏感性分析")
print("=" * 70)

theta_sweep, overlap_sweep = [], []
import copy
for td in [100, 110, 120, 130, 140]:
    saved_THETA = THETA
    THETA = math.radians(td)
    # 重建全局变量以适配新theta
    saved_alpha_for_lines = alpha_for_lines
    alpha_for_lines = alpha_overall
    s = eval_strategy(f"θ={td}°", dp_lines, 0.12)
    theta_sweep.append(s)
    THETA = saved_THETA
    alpha_for_lines = saved_alpha_for_lines
    print(f"  θ={td}°: {s['n_lines']}条, {s['total_length_nm']:.1f}nm")

for ot in [0.06, 0.09, 0.12, 0.15, 0.18]:
    s = eval_strategy(f"η={ot:.0%}", dp_lines, ot)
    overlap_sweep.append(s)
    print(f"  η_target={ot:.0%}: {s['n_lines']}条, {s['total_length_nm']:.1f}nm")

# ==================== 收敛性验证 ====================
print("\n" + "=" * 70)
print("步骤4: 收敛性验证 (多随机种子)")
print("=" * 70)
conv_nlines = []
for seed in range(100, 130):
    np.random.seed(seed)
    xn2 = np.random.uniform(0, L_EW, N_PTS)
    yn2 = np.random.uniform(0, L_NS, N_PTS)
    ds2 = (110 + (cx-xn2)*NAUTICAL_MILE*math.tan(alpha_base) + (yn2-cy)*NAUTICAL_MILE*0.0001 +
           15*np.exp(-((xn2-1)**2+(yn2-2)**2)/0.3) + -10*np.exp(-((xn2-3)**2+(yn2-3.5)**2)/0.5) +
           8*np.sin(xn2*2.5)*np.cos(yn2*1.8)*0.3 + -12*np.exp(-((xn2-2)**2+(yn2-1)**2)/0.4) +
           np.random.normal(0,3,N_PTS))
    ds2 = np.maximum(ds2, 1)
    # 重建全局网格 (模块级变量直接修改)
    gZ2 = griddata((xn2*NAUTICAL_MILE, yn2*NAUTICAL_MILE), ds2, (gX, gY), method='cubic')
    gZ2[np.isnan(gZ2)] = np.nanmean(gZ2); gZ2 = gaussian_filter(gZ2, sigma=1.0)
    old_gZ, old_pdmin, old_pdmean, old_pdp10 = gZ, profile_depth_min, profile_depth_mean, profile_depth_p10
    gZ = gZ2
    profile_depth_min = np.zeros(N_PROFILES)
    profile_depth_mean = np.zeros(N_PROFILES)
    profile_depth_p10 = np.zeros(N_PROFILES)
    for i, px in enumerate(profile_x):
        ix = np.argmin(np.abs(gx - px))
        profile = gZ2[:, ix]
        profile_depth_min[i] = np.min(profile)
        profile_depth_mean[i] = np.mean(profile)
        profile_depth_p10[i] = np.percentile(profile, 10)
    s = eval_strategy(f"s{seed}", dp_lines, 0.12)
    gZ, profile_depth_min, profile_depth_mean, profile_depth_p10 = old_gZ, old_pdmin, old_pdmean, old_pdp10
    conv_nlines.append(s['n_lines'])
    if seed % 5 == 0: print(f"  seed={seed}: {s['n_lines']}条, {s['total_length_nm']:.1f}nm")
print(f"  统计: 均值={np.mean(conv_nlines):.1f}, σ={np.std(conv_nlines):.1f}, "
      f"范围=[{np.min(conv_nlines)},{np.max(conv_nlines)}]")

# ==================== 可视化 ====================
print("\n" + "=" * 70)
print("步骤5: 生成可视化图表")
print("=" * 70)
best = all_strategies[3]  # D: DP+爬山法 (通常最优)
bl = best['lines']

# 图1: 地形+测线
fig1, ax1 = plt.subplots(figsize=(14, 9))
im = ax1.imshow(gZ, extent=[0, L_EW_M, 0, L_NS_M], origin='lower', cmap='Blues_r', alpha=0.9, aspect='auto')
cs = ax1.contour(gX, gY, gZ, levels=18, colors='navy', alpha=0.25, linewidths=0.4)
ax1.clabel(cs, inline=True, fontsize=6, fmt='%.0f')
plt.colorbar(im, ax=ax1, label='Depth (m)', shrink=0.8)
for i, ln in enumerate(bl):
    bar_w = ln['width']
    bar_x = ln['x'] - ln['Wl']
    ax1.fill_betweenx([0, L_NS_M], bar_x, bar_x + bar_w, alpha=0.15,
                      color=plt.cm.RdYlGn_r(i/len(bl)), linewidth=1.2,
                      edgecolor='darkorange')
    if i % max(1, len(bl)//15) == 0:
        ax1.text(ln['x'], L_NS_M*0.97, f'{i+1}', fontsize=7, color='darkred', ha='center', fontweight='bold')
ax1.set_xlabel('East-West (m)'); ax1.set_ylabel('North-South (m)')
ax1.set_title(f'Optimal Survey Lines ({best["name"]}): {best["n_lines"]} lines, {best["total_length_nm"]:.1f} nm')
ax1.set_xlim(0, L_EW_M); ax1.set_ylim(0, L_NS_M)
plt.tight_layout(); fig1.savefig(os.path.join(FIG_DIR, 'fig1_survey_lines.png'), dpi=150, bbox_inches='tight'); plt.close()
print("  图1: 地形+测线覆盖")

# 图2: 策略对比
fig2, axes2 = plt.subplots(1, 3, figsize=(16, 5))
names = [s['name'] for s in all_strategies]
clrs = ['#4472C4', '#4472C4', '#ED7D31', '#C00000', '#70AD47', '#A55DB5']
axes2[0].barh(names, [s['n_lines'] for s in all_strategies], color=clrs, edgecolor='white')
for i, v in enumerate([s['n_lines'] for s in all_strategies]): axes2[0].text(v+0.3, i, str(v), va='center', fontsize=10, fontweight='bold')
axes2[0].set_xlabel('Lines'); axes2[0].set_title('Number of Survey Lines')
axes2[1].barh(names, [s['total_length_nm'] for s in all_strategies], color=clrs, edgecolor='white')
for i, v in enumerate([s['total_length_nm'] for s in all_strategies]): axes2[1].text(v+0.3, i, f'{v:.1f}', va='center', fontsize=10, fontweight='bold')
axes2[1].set_xlabel('Total Length (nm)'); axes2[1].set_title('Total Survey Length')
axes2[2].barh(names, [s['elapsed'] for s in all_strategies], color=clrs, edgecolor='white')
for i, v in enumerate([s['elapsed'] for s in all_strategies]): axes2[2].text(v+0.03, i, f'{v:.1f}s', va='center', fontsize=9)
axes2[2].set_xlabel('Time (s)'); axes2[2].set_title('Computational Cost')
plt.tight_layout(); fig2.savefig(os.path.join(FIG_DIR, 'fig2_strategies.png'), dpi=150, bbox_inches='tight'); plt.close()
print("  图2: 策略对比")

# 图3: 敏感性
fig3, axes3 = plt.subplots(1, 2, figsize=(11, 5))
axes3[0].plot([100,110,120,130,140], [s['n_lines'] for s in theta_sweep], 'o-', color='#4472C4', lw=2.5, ms=10)
for i, s in enumerate(theta_sweep): axes3[0].annotate(f'{s["n_lines"]}', ([100,110,120,130,140][i], s['n_lines']), textcoords="offset points", xytext=(0,12), fontsize=10, ha='center', fontweight='bold')
axes3[0].set_xlabel('Opening Angle (deg)'); axes3[0].set_ylabel('Lines'); axes3[0].set_title('Sensitivity: Opening Angle'); axes3[0].grid(alpha=0.3)
axes3[1].plot([6,9,12,15,18], [s['n_lines'] for s in overlap_sweep], 's-', color='#ED7D31', lw=2.5, ms=10)
for i, s in enumerate(overlap_sweep): axes3[1].annotate(f'{s["n_lines"]}', ([6,9,12,15,18][i], s['n_lines']), textcoords="offset points", xytext=(0,12), fontsize=10, ha='center', fontweight='bold')
axes3[1].set_xlabel('Target Overlap (%)'); axes3[1].set_ylabel('Lines'); axes3[1].set_title('Sensitivity: Target Overlap'); axes3[1].grid(alpha=0.3)
plt.tight_layout(); fig3.savefig(os.path.join(FIG_DIR, 'fig3_sensitivity.png'), dpi=150, bbox_inches='tight'); plt.close()
print("  图3: 敏感性分析")

# 图4: 收敛性
fig4, ax4 = plt.subplots(figsize=(11, 5))
x_conv = list(range(len(conv_nlines)))
ax4.bar(x_conv, conv_nlines, color='#4472C4', edgecolor='white')
mu, sig = np.mean(conv_nlines), np.std(conv_nlines)
ax4.axhline(mu, color='red', ls='--', lw=2, label=f'Mean={mu:.1f}')
ax4.fill_between(x_conv, mu-sig, mu+sig, alpha=0.15, color='red', label=f'±1σ=[{mu-sig:.0f},{mu+sig:.0f}]')
ax4.set_xlabel('Random Seed Index'); ax4.set_ylabel('Number of Lines')
ax4.set_title(f'Algorithm Convergence Across 30 Random Terrains (σ={sig:.1f})')
ax4.legend(); ax4.grid(alpha=0.3, axis='y')
plt.tight_layout(); fig4.savefig(os.path.join(FIG_DIR, 'fig4_convergence.png'), dpi=150, bbox_inches='tight'); plt.close()
print("  图4: 收敛性分析")

# 图5: 最优方案详图
fig5 = plt.figure(figsize=(16, 10))
gs = GridSpec(2, 2, figure=fig5, hspace=0.3, wspace=0.25)
ax5a = fig5.add_subplot(gs[0, 0])
depths_at_x = [ln['depth'] for ln in bl]
widths_at_x = [ln['width'] for ln in bl]
ax5a.scatter(depths_at_x, widths_at_x, c=range(len(bl)), cmap='RdYlGn_r', s=50, edgecolors='black', lw=0.3)
ax5a.set_xlabel('Water Depth at Line (m)'); ax5a.set_ylabel('Coverage Width (m)')
ax5a.set_title('Depth vs Coverage Width'); ax5a.grid(alpha=0.3)

ax5b = fig5.add_subplot(gs[0, 1])
ovals = [ln['overlap']*100 for ln in bl if ln.get('overlap') is not None]
ax5b.hist(ovals, bins=15, color='steelblue', edgecolor='white', alpha=0.8)
ax5b.axvline(6, color='green', ls='--', lw=2, label='Min (6%)')
ax5b.axvline(25, color='red', ls='--', lw=2, label='Max (25%)')
ax5b.axvline(12, color='orange', ls=':', lw=2, label='Target (12%)')
ax5b.set_xlabel('Overlap Rate (%)'); ax5b.set_ylabel('Frequency')
ax5b.set_title('Overlap Rate Distribution'); ax5b.legend(fontsize=8); ax5b.grid(alpha=0.3, axis='y')

ax5c = fig5.add_subplot(gs[1, :])
for i, ln in enumerate(bl):
    ax5c.barh(0, ln['width'], left=ln['x']-ln['Wl'], height=0.6,
              color=plt.cm.RdYlGn_r(i/len(bl)), edgecolor='black', lw=0.3, alpha=0.85)
    if i % max(1, len(bl)//15) == 0:
        ax5c.text(ln['x'], 0.2, f'{i+1}', fontsize=7, ha='center', fontweight='bold')
ax5c.set_xlim(0, L_EW_M); ax5c.set_ylim(-1, 1); ax5c.set_yticks([])
ax5c.set_xlabel('East-West Position (m)')
ax5c.set_title(f'Coverage Strip Layout: {best["n_lines"]} lines × {L_NS}nm = {best["total_length_nm"]:.1f}nm total')
ax5c.grid(alpha=0.3, axis='x')
plt.tight_layout(); fig5.savefig(os.path.join(FIG_DIR, 'fig5_optimal_detail.png'), dpi=150, bbox_inches='tight'); plt.close()
print("  图5: 最优方案详情")

# ==================== 最终汇总 ====================
print("\n" + "=" * 70)
print("最终结果汇总")
print("=" * 70)
print(f"{'策略':<25} {'线数':<6} {'总长(nm)':<10} {'违规':<6} {'重叠均值':<10} {'耗时(s)':<8}")
print("-" * 70)
for s in all_strategies:
    avg_eta = np.mean(s['overlaps'])*100 if s['overlaps'] else 0
    print(f"{s['name']:<25} {s['n_lines']:<6} {s['total_length_nm']:<10.1f} {s['violations']:<6} {avg_eta:<10.1f} {s['elapsed']:<8.1f}")

baseline = all_strategies[0]
print(f"\n最佳方案({best['name']}) vs 等间距基线(A):")
pct_improve = 100*(baseline['n_lines']-best['n_lines'])/baseline['n_lines']
print(f"  测线数: {baseline['n_lines']} → {best['n_lines']} ({pct_improve:.1f}%)")
print(f"  总长度: {baseline['total_length_nm']:.1f} → {best['total_length_nm']:.1f} nm")

# 保存JSON
results = {
    'optimal': {
        'strategy': best['name'], 'n_lines': best['n_lines'],
        'total_length_nm': best['total_length_nm'],
        'violations': best['violations'],
        'lines': [{'id': i+1, 'x_m': round(ln['x'], 1), 'depth_m': round(ln['depth'], 2),
                   'width_m': round(ln['width'], 2),
                   'overlap_pct': round(ln['overlap']*100, 2) if ln.get('overlap') else None}
                  for i, ln in enumerate(bl)],
    },
    'all_strategies': [{'name': s['name'], 'n_lines': s['n_lines'],
                        'length_nm': round(s['total_length_nm'], 1),
                        'violations': s['violations'], 'time_s': round(s['elapsed'], 2)}
                       for s in all_strategies],
    'sensitivity': {
        'theta': [{'theta': t, 'n_lines': s['n_lines'], 'length_nm': round(s['total_length_nm'], 1)}
                  for t, s in zip([100,110,120,130,140], theta_sweep)],
        'overlap_target': [{'target': f'{o:.0%}', 'n_lines': s['n_lines'], 'length_nm': round(s['total_length_nm'], 1)}
                          for o, s in zip([0.06,0.09,0.12,0.15,0.18], overlap_sweep)],
    },
    'convergence': {
        'n_trials': len(conv_nlines), 'mean': float(np.mean(conv_nlines)),
        'std': float(np.std(conv_nlines)), 'min': int(np.min(conv_nlines)),
        'max': int(np.max(conv_nlines)),
    },
}
with open(os.path.join(FIG_DIR, 'optimal_results.json'), 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f"\n结果已保存: {os.path.join(FIG_DIR, 'optimal_results.json')}")
print("\n" + "=" * 70)
print("全部计算完成! 准备生成Word报告...")
print("=" * 70)
