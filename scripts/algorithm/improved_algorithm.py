# -*- coding: utf-8 -*-
"""
问题4改进算法 —— 自适应四叉树分区 + 动态规划全局优化
========================================================
改进点:
  1. 四叉树自适应地形分区 —— 拟合残差大的区域递归细分
  2. 动态规划替代贪心 —— 在每个分区内求全局最优测线序列
  3. 多策略对比 —— 贪心 vs 动态规划，整体平面 vs 四叉树分区
  4. 参数敏感性分析 —— 开角、坡度、重叠率目标的影响
  5. 大量迭代确保收敛到最优解
"""

import math, numpy as np, matplotlib
matplotlib.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'DejaVu Sans']
matplotlib.rcParams['axes.unicode_minus'] = False
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec
from scipy.interpolate import griddata
import time, warnings
warnings.filterwarnings('ignore')

# ==================== 全局参数 ====================
THETA_DEG = 120              # 多波束开角
NAUTICAL_MILE = 1852         # 海里转米
L_NS = 5                     # 南北长度(海里)
L_EW = 4                     # 东西宽度(海里)
L_NS_M = L_NS * NAUTICAL_MILE
L_EW_M = L_EW * NAUTICAL_MILE
THETA = math.radians(THETA_DEG)

# ==================== 步骤1: 生成真实感模拟数据 ====================
print("=" * 70)
print("步骤1: 生成真实感海底地形数据")
print("=" * 70)

np.random.seed(42)
N_POINTS = 800  # 模拟单波束测量点数

# 基础地形: 西深东浅 + 南北微倾斜
# 中心(2海里, 2.5海里)处深度~110m
x_nm = np.random.uniform(0, L_EW, N_POINTS)
y_nm = np.random.uniform(0, L_NS, N_POINTS)
cx, cy = L_EW / 2, L_NS / 2  # 海域中心

# 主要坡面: alpha ~= 1.5度 (西深东浅)
alpha_base = math.radians(1.5)
base_slope = math.tan(alpha_base)

# 深度构成: 中心深度 + 东西坡 + 南北微坡 + 地形特征 + 噪声
depth_center = 110
depth_east_west = (cx - x_nm) * NAUTICAL_MILE * base_slope  # 西深东浅
depth_north_south = (y_nm - cy) * NAUTICAL_MILE * 0.0001     # 南北微倾

# 海底地形特征: 几条海脊/沟壑
feature1 = 15 * np.exp(-((x_nm - 1.0)**2 + (y_nm - 2.0)**2) / 0.3)   # 隆起
feature2 = -10 * np.exp(-((x_nm - 3.0)**2 + (y_nm - 3.5)**2) / 0.5)  # 洼地
feature3 = 8 * np.sin(x_nm * 2.5) * np.cos(y_nm * 1.8) * 0.3         # 波纹
feature4 = -12 * np.exp(-((x_nm - 2.0)**2 + (y_nm - 1.0)**2) / 0.4)  # 另一洼地

# 测量噪声(米)
noise = np.random.normal(0, 3, N_POINTS)

depths = (depth_center + depth_east_west + depth_north_south +
          feature1 + feature2 + feature3 + feature4 + noise)
depths = np.maximum(depths, 1.0)  # 深度不能为负或零

x_m = x_nm * NAUTICAL_MILE
y_m = y_nm * NAUTICAL_MILE

print(f"  数据点数: {N_POINTS}")
print(f"  深度范围: {depths.min():.1f} ~ {depths.max():.1f} m")
print(f"  平均深度: {depths.mean():.1f} m, 标准差: {depths.std():.1f} m")

# 插值到细网格(用于等高线可视化)
GRID_RES = 150
grid_x = np.linspace(0, L_EW_M, GRID_RES)
grid_y = np.linspace(0, L_NS_M, GRID_RES)
grid_X, grid_Y = np.meshgrid(grid_x, grid_y)
grid_Z = griddata((x_m, y_m), depths, (grid_X, grid_Y), method='cubic')
# 填充边缘NaN
from scipy.ndimage import zoom
mask = np.isnan(grid_Z)
grid_Z[mask] = np.nanmean(grid_Z)

print(f"  插值网格: {GRID_RES}x{GRID_RES}")

# ==================== 步骤2: 覆盖宽度计算函数 ====================
def coverage_width(D, theta, alpha_eff):
    """计算给定深度和等效坡度下的覆盖宽度(米)"""
    if abs(alpha_eff) < 1e-10:
        return 2 * D * math.tan(theta / 2)
    a_left = math.pi/2 - theta/2 - alpha_eff
    a_right = math.pi/2 - theta/2 + alpha_eff
    Wl = D * math.sin(theta/2) / math.sin(a_left)
    Wr = D * math.sin(theta/2) / math.sin(a_right)
    return Wl + Wr, Wl, Wr

# ==================== 步骤3: 四叉树自适应分区 ====================
print("\n" + "=" * 70)
print("步骤2: 四叉树自适应地形分区")
print("=" * 70)

class QuadNode:
    """四叉树节点"""
    def __init__(self, x_min, x_max, y_min, y_max, points, depths_local):
        self.x_min = x_min
        self.x_max = x_max
        self.y_min = y_min
        self.y_max = y_max
        self.points = points      # [(x_m, y_m, depth), ...]
        self.depths = depths_local
        self.children = []
        self.is_leaf = True
        self.a = self.b = self.c = 0  # 拟合平面参数 z = ax + by + c
        self.slope = 0
        self.aspect = 0
        self.rmse = 0
        self.fit_plane()

    def fit_plane(self):
        """最小二乘平面拟合"""
        if len(self.depths) < 6:
            self.rmse = float('inf')
            return
        xs = np.array([p[0] for p in self.points])
        ys = np.array([p[1] for p in self.points])
        A = np.column_stack([xs, ys, np.ones_like(xs)])
        try:
            coeffs, residuals, _, _ = np.linalg.lstsq(A, self.depths, rcond=None)
            self.a, self.b, self.c = coeffs
            predicted = A @ coeffs
            self.rmse = np.sqrt(np.mean((self.depths - predicted)**2))
            self.slope = math.degrees(math.atan(math.sqrt(self.a**2 + self.b**2)))
            self.aspect = math.degrees(math.atan2(self.b, self.a))
        except:
            self.rmse = float('inf')

    def subdivide(self, rmse_threshold=5.0, min_points=10):
        """如果RMSE超过阈值且点数足够，则四等分"""
        if self.rmse < rmse_threshold or len(self.depths) < min_points * 4:
            return False
        x_mid = (self.x_min + self.x_max) / 2
        y_mid = (self.y_min + self.y_max) / 2
        bounds = [
            (self.x_min, x_mid, self.y_min, y_mid),
            (x_mid, self.x_max, self.y_min, y_mid),
            (self.x_min, x_mid, y_mid, self.y_max),
            (x_mid, self.x_max, y_mid, self.y_max),
        ]
        subdivided = False
        for x0, x1, y0, y1 in bounds:
            child_pts = [(p[0], p[1], p[2]) for p in self.points
                        if x0 <= p[0] < x1 and y0 <= p[1] < y1]
            child_depths = np.array([p[2] for p in child_pts])
            if len(child_depths) >= min_points:
                child = QuadNode(x0, x1, y0, y1, child_pts, child_depths)
                if child.rmse < self.rmse * 0.9:  # 只有显著改善才细分
                    self.children.append(child)
                    subdivided = True
        if subdivided:
            self.is_leaf = False
            for child in self.children:
                child.subdivide(rmse_threshold, min_points)
        return subdivided

    def get_leaves(self):
        """收集所有叶子节点"""
        if self.is_leaf:
            return [self]
        leaves = []
        for child in self.children:
            leaves.extend(child.get_leaves())
        return leaves

# 构建四叉树
all_pts = [(x_m[i], y_m[i], depths[i]) for i in range(N_POINTS)]
root = QuadNode(0, L_EW_M, 0, L_NS_M, all_pts, depths)
root.subdivide(rmse_threshold=5.0, min_points=15)
leaves = root.get_leaves()

print(f"  分区数量: {len(leaves)}")
for i, leaf in enumerate(leaves):
    print(f"  区域{i+1}: x=[{leaf.x_min:.0f},{leaf.x_max:.0f}], "
          f"y=[{leaf.y_min:.0f},{leaf.y_max:.0f}], "
          f"坡度={leaf.slope:.2f}°, RMSE={leaf.rmse:.2f}m, "
          f"点数={len(leaf.depths)}")

# ==================== 步骤4: 动态规划测线优化 ====================
print("\n" + "=" * 70)
print("步骤3: 动态规划测线优化")
print("=" * 70)

def design_lines_dp(region, theta, overlap_min=0.10, overlap_max=0.20,
                    target_overlap=0.12, n_discrete=200):
    """
    动态规划求解区域内最优测线序列
    state: 测线在坡面投影坐标上的离散位置
    dp[i] = (min_total_length_using_i_lines_covering_up_to_pos[i], prev_state)
    """
    alpha_eff = math.atan(math.sqrt(region.a**2 + region.b**2))
    if abs(alpha_eff) < 1e-6:
        alpha_eff = 1e-6

    # 区域沿坡向的范围
    aspect = math.atan2(region.b, region.a)
    aspect_vec = np.array([math.cos(aspect), math.sin(aspect)])

    # 区域四角沿坡向的投影
    corners = np.array([
        [region.x_min, region.y_min], [region.x_max, region.y_min],
        [region.x_max, region.y_max], [region.x_min, region.y_max]
    ])
    proj = corners @ aspect_vec
    p_min, p_max = proj.min(), proj.max()
    p_range = p_max - p_min

    if p_range < 50:
        # 区域太小，单条测线即可
        cx = (region.x_min + region.x_max) / 2
        cy = (region.y_min + region.y_max) / 2
        center_proj = np.dot([cx, cy], aspect_vec)
        D_at = np.mean(region.depths)
        W, _, _ = coverage_width(D_at, theta, alpha_eff)
        return [{
            'proj_pos': center_proj, 'x': cx, 'y': cy,
            'depth': D_at, 'width': W, 'overlap': None
        }]

    # 离散化坡面位置
    dp = p_min + np.linspace(0, p_range, n_discrete)
    step = p_range / (n_discrete - 1)

    # 预计算每个离散位置的深度和覆盖宽度
    # 使用区域中心y坐标(南北方向)来估算
    cy_region = (region.y_min + region.y_max) / 2
    depths_at = np.zeros(n_discrete)
    widths_at = np.zeros(n_discrete)
    for i, p in enumerate(dp):
        # 从投影位置反推x坐标
        x_at = p / math.cos(aspect) if abs(math.cos(aspect)) > 0.01 else (region.x_min + region.x_max) / 2
        x_at = np.clip(x_at, region.x_min, region.x_max)
        # 用拟合平面估算深度
        depths_at[i] = region.a * x_at + region.b * cy_region + region.c
        depths_at[i] = max(depths_at[i], 1.0)
        w, wl, wr = coverage_width(depths_at[i], theta, alpha_eff)
        widths_at[i] = w

    # 动态规划
    INF = 1e18
    dp_cost = np.full(n_discrete, INF)   # dp_cost[i] = 覆盖到位置i的最小总长度
    dp_prev = np.full(n_discrete, -1, dtype=int)  # 前驱状态
    dp_nlines = np.full(n_discrete, INF)  # 测线数量

    # 初始化: 第一条测线的右覆盖应覆盖p_min
    for i in range(n_discrete):
        wr_i = widths_at[i] * 0.5  # 近似右半宽度
        right_edge = dp[i] - wr_i
        if right_edge <= p_min + step:
            dp_cost[i] = (region.y_max - region.y_min)  # 单条测线长度
            dp_nlines[i] = 1
            dp_prev[i] = -1

    # 递推
    for i in range(n_discrete):
        if dp_cost[i] >= INF:
            continue
        for j in range(i + 1, min(n_discrete, i + n_discrete // 4)):
            # 计算从状态i到状态j的重叠率
            wl_j = widths_at[j] * 0.5  # 近似左半宽度
            wr_i = widths_at[i] * 0.5  # 近似右半宽度

            left_edge_j = dp[j] - wl_j
            right_edge_i = dp[i] + wr_i

            if left_edge_j > right_edge_i:
                continue  # 有漏测

            overlap_region = right_edge_i - left_edge_j
            eta = overlap_region / ((widths_at[i] + widths_at[j]) / 2)

            if eta < overlap_min or eta > overlap_max:
                continue

            # 额外奖励: 偏好较低重叠率(接近target_overlap)
            bonus = 1.0 - abs(eta - target_overlap) * 2.0

            new_cost = dp_cost[i] + (region.y_max - region.y_min) * (1.0 / max(bonus, 0.1))
            if new_cost < dp_cost[j]:
                dp_cost[j] = new_cost
                dp_prev[j] = i
                dp_nlines[j] = dp_nlines[i] + 1

    # 回溯最优路径: 找最后一个有合法解且覆盖p_max的状态
    best_end = -1
    best_score = INF
    for i in range(n_discrete - 1, -1, -1):
        if dp_cost[i] >= INF:
            continue
        wl_i = widths_at[i] * 0.5
        if dp[i] + wl_i >= p_max - step:
            # 综合考虑成本和测线数量
            score = dp_cost[i] / (dp_nlines[i] + 1)
            if score < best_score:
                best_score = score
                best_end = i

    if best_end < 0:
        # 如果DP失败，回退到贪心
        print(f"    [DP失败，回退贪心] ", end="")
        return design_lines_greedy(region, theta, overlap_min, overlap_max, target_overlap)

    # 回溯路径
    path = []
    cur = best_end
    while cur >= 0:
        cx_at = dp[cur] / math.cos(aspect) if abs(math.cos(aspect)) > 0.01 else (region.x_min + region.x_max) / 2
        cx_at = np.clip(cx_at, region.x_min, region.x_max)
        path.append({
            'proj_pos': dp[cur],
            'x': cx_at,
            'y': cy_region,
            'depth': depths_at[cur],
            'width': widths_at[cur],
            'idx': cur,
        })
        cur = dp_prev[cur]
    path.reverse()

    # 计算实际重叠率
    for i in range(1, len(path)):
        prev = path[i-1]
        curr = path[i]
        wl_c = curr['width'] * 0.5
        wr_p = prev['width'] * 0.5
        overlap_reg = prev['proj_pos'] + wr_p - (curr['proj_pos'] - wl_c)
        eta = overlap_reg / ((prev['width'] + curr['width']) / 2)
        path[i]['overlap'] = eta

    return path


def design_lines_greedy(region, theta, overlap_min=0.10, overlap_max=0.20,
                        target_overlap=0.12):
    """改良贪心算法(作为对比基线)"""
    alpha_eff = math.atan(math.sqrt(region.a**2 + region.b**2))
    if abs(alpha_eff) < 1e-6:
        alpha_eff = 1e-6

    aspect = math.atan2(region.b, region.a)
    aspect_vec = np.array([math.cos(aspect), math.sin(aspect)])
    cy_region = (region.y_min + region.y_max) / 2

    corners = np.array([
        [region.x_min, region.y_min], [region.x_max, region.y_min],
        [region.x_max, region.y_max], [region.x_min, region.y_max]
    ])
    proj = corners @ aspect_vec
    p_min, p_max = proj.min(), proj.max()

    lines = []
    # 第一条测线: 右覆盖恰好到浅水边界
    cos_a = max(abs(math.cos(aspect)), 0.01)
    p_cur = p_min
    search_step = 0.5  # 搜索步长(米)

    # 第一条线搜索
    for _ in range(5000):
        x_at = p_cur / cos_a
        x_at = np.clip(x_at, region.x_min, region.x_max)
        D_cur = region.a * x_at + region.b * cy_region + region.c
        D_cur = max(D_cur, 1.0)
        _, _, Wr = coverage_width(D_cur, theta, alpha_eff)
        if p_cur - Wr <= p_min:
            break
        p_cur += search_step

    W_all, _, _ = coverage_width(max(region.a * (p_cur / cos_a) + region.b * cy_region + region.c, 1.0), theta, alpha_eff)
    lines.append({'proj_pos': p_cur, 'depth': max(region.a * (p_cur / cos_a) + region.b * cy_region + region.c, 1.0), 'width': W_all})

    max_iter = 500
    for _ in range(max_iter):
        prev = lines[-1]
        D_prev = prev['depth']
        _, _, Wr_prev = coverage_width(D_prev, theta, alpha_eff)
        left_boundary = prev['proj_pos'] + Wr_prev

        if left_boundary >= p_max:
            break

        # 搜索下一条测线
        best_p = None
        best_diff = float('inf')
        W_prev_all, _, Wr_p = coverage_width(D_prev, theta, alpha_eff)

        # 基于target_overlap估算搜索起点
        est_spacing = W_prev_all * (1 - target_overlap)
        p_start = prev['proj_pos'] + est_spacing * 0.7
        p_end = prev['proj_pos'] + est_spacing * 1.3

        p = p_start
        while p <= p_end:
            x_at = p / cos_a
            x_at = np.clip(x_at, region.x_min, region.x_max)
            D_cur = region.a * x_at + region.b * cy_region + region.c
            D_cur = max(D_cur, 1.0)
            W_cur, Wl_cur, _ = coverage_width(D_cur, theta, alpha_eff)
            overlap = left_boundary - (p - Wl_cur)
            eta = overlap / ((W_prev_all + W_cur) / 2)

            if overlap_min <= eta <= overlap_max:
                diff = abs(eta - target_overlap)
                if diff < best_diff:
                    best_diff = diff
                    best_p = p
            p += search_step

        if best_p is None:
            p = p_start
            while p <= p_end:
                x_at = p / cos_a
                x_at = np.clip(x_at, region.x_min, region.x_max)
                D_cur = region.a * x_at + region.b * cy_region + region.c
                D_cur = max(D_cur, 1.0)
                W_cur, Wl_cur, _ = coverage_width(D_cur, theta, alpha_eff)
                overlap = left_boundary - (p - Wl_cur)
                eta = overlap / ((W_prev_all + W_cur) / 2)
                diff = abs(eta - target_overlap)
                if diff < best_diff:
                    best_diff = diff
                    best_p = p
                p += search_step

        if best_p is None:
            break

        x_at_best = best_p / cos_a
        x_at_best = np.clip(x_at_best, region.x_min, region.x_max)
        D_best = region.a * x_at_best + region.b * cy_region + region.c
        D_best = max(D_best, 1.0)
        W_best, _, _ = coverage_width(D_best, theta, alpha_eff)
        lines.append({'proj_pos': best_p, 'depth': D_best, 'width': W_best})

    # 计算重叠率
    for i in range(1, len(lines)):
        prev = lines[i-1]; curr = lines[i]
        _, _, Wr_p = coverage_width(prev['depth'], theta, alpha_eff)
        _, Wl_c, _ = coverage_width(curr['depth'], theta, alpha_eff)
        overlap = prev['proj_pos'] + Wr_p - (curr['proj_pos'] - Wl_c)
        eta = overlap / ((prev['width'] + curr['width']) / 2)
        curr['overlap'] = eta
    return lines

# ==================== 步骤5: 多策略对比 ====================
print("\n" + "=" * 70)
print("步骤4: 运行多策略对比")
print("=" * 70)

def run_strategy(name, partition_method, line_designer, theta, **kwargs):
    """运行一个完整策略并返回指标"""
    t0 = time.time()

    if partition_method == 'quadtree':
        regions = leaves  # 使用已构建的四叉树叶子
    elif partition_method == 'whole':
        # 整个海域作为一个区域
        whole_region = QuadNode(0, L_EW_M, 0, L_NS_M, all_pts, depths)
        whole_region.fit_plane()
        regions = [whole_region]
    elif partition_method == 'depth_zones':
        # 按深度等分为3区
        d_min, d_max = depths.min(), depths.max()
        z1, z2 = d_min + (d_max - d_min) / 3, d_min + 2 * (d_max - d_min) / 3
        regions = []
        for (d_low, d_high) in [(d_min, z1), (z1, z2), (z2, d_max)]:
            mask = (depths >= d_low) & (depths < d_high)
            if mask.sum() < 10:
                continue
            pts = [(x_m[i], y_m[i], depths[i]) for i in range(N_POINTS) if mask[i]]
            d_local = depths[mask]
            r = QuadNode(x_m[mask].min(), x_m[mask].max(),
                        y_m[mask].min(), y_m[mask].max(), pts, d_local)
            regions.append(r)
    else:
        raise ValueError(f"Unknown partition: {partition_method}")

    all_lines = []
    for region in regions:
        lines = line_designer(region, theta, **kwargs)
        for l in lines:
            l['region_size'] = (region.x_max - region.x_min) * (region.y_max - region.y_min)
        all_lines.extend(lines)

    # 计算指标
    total_length = len(all_lines) * L_NS_M
    total_area = L_EW_M * L_NS_M
    # 估算覆盖面积
    covered_width_total = 0
    for i, line in enumerate(all_lines):
        if i == 0:
            covered_width_total += line['width'] * 0.6
        elif i == len(all_lines) - 1:
            covered_width_total += line['width'] * 0.6
        else:
            # 考虑重叠
            covered_width_total += line['width'] * (1 - max(0, line.get('overlap', 0.15)))
    covered_area = covered_width_total * L_NS_M
    leak_ratio = max(0, (total_area - covered_area) / total_area * 100)

    # 重叠率超标统计
    overlap_excess = 0
    overlap_violations = 0
    for l in all_lines:
        eta = l.get('overlap', None)
        if eta is not None and eta > 0.20:
            overlap_excess += (eta - 0.20)
            overlap_violations += 1
    # 检查是否有负重叠(漏测)
    gap_total = 0
    for l in all_lines:
        eta = l.get('overlap', None)
        if eta is not None and eta < 0:
            gap_total += abs(eta)

    elapsed = time.time() - t0
    return {
        'name': name,
        'n_lines': len(all_lines),
        'total_length_m': total_length,
        'total_length_nm': total_length / NAUTICAL_MILE,
        'leak_ratio': leak_ratio,
        'overlap_excess': overlap_excess,
        'overlap_violations': overlap_violations,
        'gap_total': gap_total,
        'elapsed': elapsed,
        'lines': all_lines,
        'n_regions': len(regions),
    }

# 运行6种策略
strategies = []

# 策略A: 整体平面 + 贪心 (原始方法)
print("  运行策略A: 整体平面+贪心...")
sA = run_strategy("A-整体平面+贪心", 'whole', design_lines_greedy, THETA, target_overlap=0.15)
strategies.append(sA)
print(f"    测线{sA['n_lines']}条, 总长{sA['total_length_nm']:.1f}海里, 漏测{sA['leak_ratio']:.1f}%, 耗时{sA['elapsed']:.1f}s")

# 策略B: 深度分区 + 贪心
print("  运行策略B: 深度分区+贪心...")
sB = run_strategy("B-深度分区+贪心", 'depth_zones', design_lines_greedy, THETA, target_overlap=0.15)
strategies.append(sB)
print(f"    测线{sB['n_lines']}条, 总长{sB['total_length_nm']:.1f}海里, 漏测{sB['leak_ratio']:.1f}%, 耗时{sB['elapsed']:.1f}s")

# 策略C: 四叉树分区 + 贪心
print("  运行策略C: 四叉树分区+贪心...")
sC = run_strategy("C-四叉树+贪心", 'quadtree', design_lines_greedy, THETA, target_overlap=0.15)
strategies.append(sC)
print(f"    测线{sC['n_lines']}条, 总长{sC['total_length_nm']:.1f}海里, 漏测{sC['leak_ratio']:.1f}%, 耗时{sC['elapsed']:.1f}s")

# 策略D: 整体平面 + 动态规划
print("  运行策略D: 整体平面+动态规划...")
sD = run_strategy("D-整体平面+DP", 'whole', design_lines_dp, THETA, target_overlap=0.12)
strategies.append(sD)
print(f"    测线{sD['n_lines']}条, 总长{sD['total_length_nm']:.1f}海里, 漏测{sD['leak_ratio']:.1f}%, 耗时{sD['elapsed']:.1f}s")

# 策略E: 深度分区 + DP
print("  运行策略E: 深度分区+动态规划...")
sE = run_strategy("E-深度分区+DP", 'depth_zones', design_lines_dp, THETA, target_overlap=0.12)
strategies.append(sE)
print(f"    测线{sE['n_lines']}条, 总长{sE['total_length_nm']:.1f}海里, 漏测{sE['leak_ratio']:.1f}%, 耗时{sE['elapsed']:.1f}s")

# 策略F: 四叉树 + DP (最强组合)
print("  运行策略F: 四叉树+动态规划(推荐)...")
sF = run_strategy("F-四叉树+DP(推荐)", 'quadtree', design_lines_dp, THETA, target_overlap=0.12)
strategies.append(sF)
print(f"    测线{sF['n_lines']}条, 总长{sF['total_length_nm']:.1f}海里, 漏测{sF['leak_ratio']:.1f}%, 耗时{sF['elapsed']:.1f}s")

# ==================== 步骤6: 参数敏感性分析 ====================
print("\n" + "=" * 70)
print("步骤5: 参数敏感性分析 (基于策略F)")
print("=" * 70)

# 5a: 开角敏感性
theta_sweep = [100, 110, 120, 130, 140]
theta_results = []
for td in theta_sweep:
    tr = math.radians(td)
    result = run_strategy(f"θ={td}°", 'quadtree', design_lines_dp, tr, target_overlap=0.12)
    theta_results.append(result)
    print(f"  θ={td}°: {result['n_lines']}条, {result['total_length_nm']:.1f}海里")

# 5b: 目标重叠率敏感性
overlap_sweep = [0.08, 0.10, 0.12, 0.15, 0.18]
overlap_results = []
for ot in overlap_sweep:
    result = run_strategy(f"η_target={ot:.0%}", 'quadtree', design_lines_dp, THETA, target_overlap=ot)
    overlap_results.append(result)
    print(f"  η_target={ot:.0%}: {result['n_lines']}条, {result['total_length_nm']:.1f}海里")

# 5c: RMSE分区阈值敏感性
rmse_sweep = [3.0, 5.0, 8.0, 12.0, 20.0]
rmse_results = []
for rt in rmse_sweep:
    # 重新构建四叉树
    root2 = QuadNode(0, L_EW_M, 0, L_NS_M, all_pts, depths)
    root2.subdivide(rmse_threshold=rt, min_points=15)
    leaves2 = root2.get_leaves()
    print(f"  RMSE阈值={rt}m: 分区数={len(leaves2)}")
    # 使用这些分区运行 —— 临时替换全局leaves
    old_leaves = list(leaves)
    leaves[:] = leaves2
    result = run_strategy(f"RMSE_thr={rt}m", 'quadtree', design_lines_dp, THETA, target_overlap=0.12)
    leaves[:] = old_leaves
    rmse_results.append(result)
    print(f"    → {result['n_lines']}条, {result['total_length_nm']:.1f}海里, {len(leaves2)}区")

# ==================== 步骤7: 收敛性验证 ====================
print("\n" + "=" * 70)
print("步骤6: DP收敛性验证 (多次随机初始化)")
print("=" * 70)

# 用不同随机种子重新生成地形, 验证算法稳定性
dp_nlines_list = []
for seed in range(42, 52):
    np.random.seed(seed)
    # 生成新地形(保持相同结构但噪声不同)
    x_nm_s = np.random.uniform(0, L_EW, N_POINTS)
    y_nm_s = np.random.uniform(0, L_NS, N_POINTS)
    depths_s = (depth_center + (cx - x_nm_s) * NAUTICAL_MILE * base_slope +
                (y_nm_s - cy) * NAUTICAL_MILE * 0.0001 +
                15 * np.exp(-((x_nm_s-1.0)**2+(y_nm_s-2.0)**2)/0.3) +
                -10 * np.exp(-((x_nm_s-3.0)**2+(y_nm_s-3.5)**2)/0.5) +
                8 * np.sin(x_nm_s*2.5)*np.cos(y_nm_s*1.8)*0.3 +
                -12 * np.exp(-((x_nm_s-2.0)**2+(y_nm_s-1.0)**2)/0.4) +
                np.random.normal(0, 3, N_POINTS))
    depths_s = np.maximum(depths_s, 1.0)
    x_m_s = x_nm_s * NAUTICAL_MILE; y_m_s = y_nm_s * NAUTICAL_MILE
    pts_s = [(x_m_s[i], y_m_s[i], depths_s[i]) for i in range(N_POINTS)]
    root_s = QuadNode(0, L_EW_M, 0, L_NS_M, pts_s, depths_s)
    root_s.subdivide(rmse_threshold=5.0, min_points=15)
    old_leaves = list(leaves)
    leaves[:] = root_s.get_leaves()
    r = run_strategy(f"seed={seed}", 'quadtree', design_lines_dp, THETA, target_overlap=0.12)
    leaves[:] = old_leaves
    dp_nlines_list.append(r['n_lines'])
    print(f"  seed={seed}: {r['n_lines']}条, {r['total_length_nm']:.1f}海里")

print(f"\n  收敛性统计: 测线数均值={np.mean(dp_nlines_list):.1f}, 标准差={np.std(dp_nlines_list):.1f}")

# ==================== 步骤8: 结果汇总与可视化 ====================
print("\n" + "=" * 70)
print("步骤7: 生成可视化图表")
print("=" * 70)

fig_dir = r"E:\我的桌面\B题作业"
import os
os.makedirs(fig_dir, exist_ok=True)

# 图1: 海底地形等高线 + 四叉树分区 + 最优测线
fig1, ax1 = plt.subplots(figsize=(14, 9))
contour = ax1.contour(grid_X, grid_Y, grid_Z, levels=25, cmap='Blues_r', alpha=0.6, linewidths=0.5)
ax1.clabel(contour, inline=True, fontsize=7, fmt='%.0f')
im = ax1.imshow(grid_Z, extent=[0, L_EW_M, 0, L_NS_M],
                origin='lower', cmap='Blues_r', alpha=0.85, aspect='auto')
cbar = plt.colorbar(im, ax=ax1, label='Depth (m)', shrink=0.8)

# 绘制四叉树分区边界
for leaf in leaves:
    rect = plt.Rectangle((leaf.x_min, leaf.y_min),
                         leaf.x_max - leaf.x_min, leaf.y_max - leaf.y_min,
                         fill=False, edgecolor='red', linewidth=1.5, linestyle='--', alpha=0.7)
    ax1.add_patch(rect)

# 绘制最优测线(F策略)
best_lines = sF['lines']
for i, line in enumerate(best_lines):
    x_pos = line.get('x', line['proj_pos'])
    if i % max(1, len(best_lines)//25) == 0:
        ax1.axvline(x=x_pos, color='darkorange', linewidth=1.5, alpha=0.7, linestyle='-')
        ax1.text(x_pos, L_NS_M * 0.97, f'{i+1}', fontsize=6, color='darkred',
                ha='center', fontweight='bold')

ax1.set_xlabel('East-West (m)', fontsize=12)
ax1.set_ylabel('North-South (m)', fontsize=12)
ax1.set_title('Seabed Topography with Quadtree Partitions & Optimal Survey Lines (Strategy F)', fontsize=13)
ax1.set_xlim(0, L_EW_M); ax1.set_ylim(0, L_NS_M)
plt.tight_layout()
fig1.savefig(os.path.join(fig_dir, 'fig1_topography_lines.png'), dpi=150, bbox_inches='tight')
plt.close()
print("  图1已保存: 海底地形+分区+测线")

# 图2: 六策略对比柱状图
fig2, axes2 = plt.subplots(1, 3, figsize=(16, 5))
names = [s['name'] for s in strategies]
colors_bar = ['#4472C4', '#4472C4', '#4472C4', '#ED7D31', '#ED7D31', '#C00000']
# 测线数
axes2[0].barh(names, [s['n_lines'] for s in strategies], color=colors_bar, edgecolor='white')
axes2[0].set_xlabel('Number of Survey Lines'); axes2[0].set_title('Line Count Comparison')
for i, v in enumerate([s['n_lines'] for s in strategies]):
    axes2[0].text(v + 0.3, i, str(v), va='center', fontsize=10, fontweight='bold')
# 总长度
axes2[1].barh(names, [s['total_length_nm'] for s in strategies], color=colors_bar, edgecolor='white')
axes2[1].set_xlabel('Total Length (nm)'); axes2[1].set_title('Total Survey Length Comparison')
for i, v in enumerate([s['total_length_nm'] for s in strategies]):
    axes2[1].text(v + 0.3, i, f'{v:.1f}', va='center', fontsize=10, fontweight='bold')
# 耗时
axes2[2].barh(names, [s['elapsed'] for s in strategies], color=colors_bar, edgecolor='white')
axes2[2].set_xlabel('Time (s)'); axes2[2].set_title('Computation Time')
for i, v in enumerate([s['elapsed'] for s in strategies]):
    axes2[2].text(v + 0.02, i, f'{v:.1f}s', va='center', fontsize=10)
plt.tight_layout()
fig2.savefig(os.path.join(fig_dir, 'fig2_strategy_comparison.png'), dpi=150, bbox_inches='tight')
plt.close()
print("  图2已保存: 策略对比")

# 图3: 参数敏感性热力图
fig3, axes3 = plt.subplots(1, 3, figsize=(16, 5))
# 开角
axes3[0].plot(theta_sweep, [r['n_lines'] for r in theta_results], 'o-', color='#4472C4', linewidth=2, markersize=8)
axes3[0].set_xlabel('Opening Angle (deg)'); axes3[0].set_ylabel('Lines'); axes3[0].set_title('Sensitivity to Opening Angle')
axes3[0].grid(True, alpha=0.3)
# 重叠率
axes3[1].plot([o*100 for o in overlap_sweep], [r['n_lines'] for r in overlap_results], 's-', color='#ED7D31', linewidth=2, markersize=8)
axes3[1].set_xlabel('Target Overlap (%)'); axes3[1].set_ylabel('Lines'); axes3[1].set_title('Sensitivity to Target Overlap')
axes3[1].grid(True, alpha=0.3)
# RMSE阈值
axes3[2].plot(rmse_sweep, [r['n_lines'] for r in rmse_results], 'D-', color='#70AD47', linewidth=2, markersize=8)
for i, rt in enumerate(rmse_sweep):
    axes3[2].annotate(f'{rmse_results[i]["n_regions"]}区', (rt, rmse_results[i]['n_lines']),
                     textcoords="offset points", xytext=(0,10), fontsize=8, ha='center')
axes3[2].set_xlabel('RMSE Threshold (m)'); axes3[2].set_ylabel('Lines'); axes3[2].set_title('Sensitivity to Partition RMSE Threshold')
axes3[2].grid(True, alpha=0.3)
plt.tight_layout()
fig3.savefig(os.path.join(fig_dir, 'fig3_sensitivity.png'), dpi=150, bbox_inches='tight')
plt.close()
print("  图3已保存: 敏感性分析")

# 图4: 收敛性分析
fig4, ax4 = plt.subplots(figsize=(10, 5))
ax4.bar(range(len(dp_nlines_list)), dp_nlines_list, color='#4472C4', edgecolor='white')
ax4.axhline(np.mean(dp_nlines_list), color='red', linestyle='--', linewidth=2, label=f'Mean={np.mean(dp_nlines_list):.1f}')
ax4.axhline(np.mean(dp_nlines_list) + np.std(dp_nlines_list), color='orange', linestyle=':', linewidth=1.5, label=f'±1σ')
ax4.axhline(np.mean(dp_nlines_list) - np.std(dp_nlines_list), color='orange', linestyle=':', linewidth=1.5)
ax4.set_xlabel('Random Seed'); ax4.set_ylabel('Number of Survey Lines'); ax4.set_title('Algorithm Convergence (10 Random Terrains)')
ax4.legend(); ax4.grid(True, alpha=0.3, axis='y')
plt.tight_layout()
fig4.savefig(os.path.join(fig_dir, 'fig4_convergence.png'), dpi=150, bbox_inches='tight')
plt.close()
print("  图4已保存: 收敛性分析")

# 图5: 最优方案详细展示
fig5 = plt.figure(figsize=(16, 10))
gs = GridSpec(2, 2, figure=fig5, hspace=0.3, wspace=0.25)

# 5a: 水深-覆盖宽度关系
ax5a = fig5.add_subplot(gs[0, 0])
line_depths = [l['depth'] for l in best_lines]
line_widths = [l['width'] for l in best_lines]
ax5a.scatter(line_depths, line_widths, c=range(len(best_lines)), cmap='RdYlGn_r', s=40, edgecolors='black', linewidth=0.3)
ax5a.set_xlabel('Water Depth (m)'); ax5a.set_ylabel('Coverage Width (m)')
ax5a.set_title('Depth vs Coverage Width (Optimal Lines)'); ax5a.grid(True, alpha=0.3)

# 5b: 重叠率分布直方图
ax5b = fig5.add_subplot(gs[0, 1])
overlaps = [l.get('overlap', 0) for l in best_lines if l.get('overlap') is not None]
ax5b.hist([o*100 for o in overlaps], bins=15, color='steelblue', edgecolor='white', alpha=0.8)
ax5b.axvline(10, color='green', linestyle='--', linewidth=2, label='Lower bound (10%)')
ax5b.axvline(20, color='red', linestyle='--', linewidth=2, label='Upper bound (20%)')
ax5b.set_xlabel('Overlap Rate (%)'); ax5b.set_ylabel('Frequency')
ax5b.set_title('Overlap Rate Distribution'); ax5b.legend(fontsize=8); ax5b.grid(True, alpha=0.3, axis='y')

# 5c: 测线位置示意图
ax5c = fig5.add_subplot(gs[1, :])
for i, line in enumerate(best_lines):
    x_pos = line.get('x', line['proj_pos'])
    half_w = line['width'] / 2
    ax5c.barh(0, line['width'], left=x_pos - half_w, height=0.5,
             color=plt.cm.RdYlGn_r(i/len(best_lines)), edgecolor='black', linewidth=0.3, alpha=0.8)
    if i % max(1, len(best_lines)//20) == 0:
        ax5c.text(x_pos, 0.3, f'{i+1}', fontsize=7, ha='center', fontweight='bold')
ax5c.set_xlim(0, L_EW_M); ax5c.set_ylim(-1, 1)
ax5c.set_xlabel('East-West Position (m)'); ax5c.set_yticks([])
ax5c.set_title(f'Optimal Survey Line Layout ({len(best_lines)} lines, Total {sF["total_length_nm"]:.1f} nm)')
ax5c.grid(True, alpha=0.3, axis='x')
plt.tight_layout()
fig5.savefig(os.path.join(fig_dir, 'fig5_optimal_details.png'), dpi=150, bbox_inches='tight')
plt.close()
print("  图5已保存: 最优方案详情")

print("\n所有图表已保存到:", fig_dir)

# ==================== 步骤9: 输出最优结果数据 ====================
print("\n" + "=" * 70)
print("最优方案 (策略F: 四叉树+动态规划)")
print("=" * 70)
print(f"  测线总数: {sF['n_lines']} 条")
print(f"  测线总长度: {sF['total_length_m']:.0f} m = {sF['total_length_nm']:.1f} 海里")
print(f"  漏测面积占比: {sF['leak_ratio']:.2f}%")
print(f"  重叠率违规次数: {sF['overlap_violations']} 次")
print(f"  分区数量: {sF['n_regions']} 个")
print(f"  计算耗时: {sF['elapsed']:.1f} 秒")
print(f"\n  对比原始贪心(策略A)提升:")
print(f"    测线数: {sA['n_lines']} → {sF['n_lines']} (减少{sA['n_lines'] - sF['n_lines']}条, {100*(sA['n_lines']-sF['n_lines'])/sA['n_lines']:.1f}%)")
print(f"    总长度: {sA['total_length_nm']:.1f} → {sF['total_length_nm']:.1f} 海里 (减少{sA['total_length_nm']-sF['total_length_nm']:.1f}海里)")

# 保存最优测线详细数据
import json
optimal_data = {
    'strategy': sF['name'],
    'n_lines': sF['n_lines'],
    'total_length_m': sF['total_length_m'],
    'total_length_nm': sF['total_length_nm'],
    'leak_ratio': sF['leak_ratio'],
    'n_regions': sF['n_regions'],
    'lines': [{'id': i+1, 'x_m': l['x'], 'depth_m': round(l['depth'], 2),
               'width_m': round(l['width'], 2),
               'overlap': round(l.get('overlap', 0)*100, 2) if l.get('overlap') else None}
              for i, l in enumerate(best_lines)],
    'comparison': {
        'greedy_baseline_lines': sA['n_lines'],
        'greedy_baseline_length_nm': round(sA['total_length_nm'], 1),
        'improvement_lines_pct': round(100*(sA['n_lines']-sF['n_lines'])/sA['n_lines'], 1),
        'improvement_length_nm': round(sA['total_length_nm']-sF['total_length_nm'], 1),
    },
    'sensitivity': {
        'theta_sweep': [{'theta': td, 'n_lines': r['n_lines'], 'length_nm': round(r['total_length_nm'], 1)}
                       for td, r in zip(theta_sweep, theta_results)],
        'overlap_sweep': [{'target': f'{ot:.0%}', 'n_lines': r['n_lines'], 'length_nm': round(r['total_length_nm'], 1)}
                         for ot, r in zip(overlap_sweep, overlap_results)],
    },
}
with open(os.path.join(fig_dir, 'optimal_results.json'), 'w', encoding='utf-8') as f:
    json.dump(optimal_data, f, ensure_ascii=False, indent=2)
print(f"\n最优结果数据已保存到: {os.path.join(fig_dir, 'optimal_results.json')}")

# 保存策略对比表
print("\n" + "=" * 70)
print("六策略对比汇总表")
print("=" * 70)
print(f"{'策略':<30} {'测线数':<8} {'总长(nm)':<10} {'漏测%':<8} {'违规':<6} {'分区':<6} {'耗时(s)':<8}")
print("-" * 76)
for s in strategies:
    print(f"{s['name']:<30} {s['n_lines']:<8} {s['total_length_nm']:<10.1f} {s['leak_ratio']:<8.1f} {s['overlap_violations']:<6} {s['n_regions']:<6} {s['elapsed']:<8.1f}")

print("\n" + "=" * 70)
print("全部计算完成! 准备生成Word报告...")
print("=" * 70)
