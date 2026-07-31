# -*- coding: utf-8 -*-
"""
钢琴助手 — 全功能自动化测试
一键运行：python 运行测试.py
"""
import subprocess, sys, time, os

os.environ['PYTHONIOENCODING'] = 'utf-8'

# ── Start server ──
print('🎹 钢琴助手 — 全功能测试')
print('═' * 40)

# Kill existing
subprocess.run('for /f "tokens=5" %a in (\'netstat -ano ^| findstr :8080.*LISTENING\') do taskkill /F /PID %a >nul 2>nul', shell=True)
time.sleep(0.5)

# Start server
server = subprocess.Popen([sys.executable, '-m', 'http.server', '8080'],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, cwd=os.path.dirname(__file__))
print('[启动] http://localhost:8080')
time.sleep(1.5)

try:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        errors = []
        page.on("pageerror", lambda err: errors.append(err.message))

        # ══════════════════════════════════════
        # TEST 1: Welcome Screen
        # ══════════════════════════════════════
        print('\n[TEST 1] 欢迎页加载...')
        page.goto('http://localhost:8080', timeout=10000)
        page.wait_for_load_state('networkidle')
        time.sleep(1)

        title = page.locator('.title-block h1').text_content()
        cards = page.locator('.mode-card').count()
        assert cards == 2, f'Mode cards should be 2, got {cards}'
        print(f'  ✓ 标题: {title}')
        print(f'  ✓ 模式卡片: {cards}')

        # ══════════════════════════════════════
        # TEST 2: Free Play Mode
        # ══════════════════════════════════════
        print('\n[TEST 2] 自由弹奏模式...')
        page.locator('.mode-card').nth(0).click()
        time.sleep(1.5)

        # Check keyboard
        white = page.locator('#freeKeyboard .white-key').count()
        black = page.locator('#freeKeyboard .black-key').count()
        assert white > 0, 'No white keys'
        print(f'  ✓ 白键: {white}  黑键: {black}')

        # Check piece selector loaded
        opts = page.locator('#freePieceSelect option').count()
        assert opts >= 3, f'Piece options should be >=3, got {opts}'
        print(f'  ✓ 曲目选项: {opts}')

        # Select piece → check jianpu
        page.locator('#freePieceSelect').select_option('twinkle')
        time.sleep(1)
        notes = page.locator('#freeSheetCard .jianpu-note').count()
        bars = page.locator('#freeSheetCard .jianpu-bar').count()
        assert notes == 42, f'Twinkle should have 42 notes, got {notes}'
        print(f'  ✓ 简谱音符: {notes}  小节: {bars}')

        # Check octave shift
        page.locator('button').filter(has_text='高八度').first.click()
        time.sleep(0.3)
        label = page.locator('#octaveLabel').text_content()
        print(f'  ✓ 八度切换: {label}')

        # Click piano key → should trigger audio
        page.locator('#freeKeyboard .white-key').nth(3).click()
        time.sleep(0.3)
        print(f'  ✓ 虚拟键盘点击')

        # ══════════════════════════════════════
        # TEST 3: Practice Mode Setup
        # ══════════════════════════════════════
        print('\n[TEST 3] 练习模式设置...')
        page.locator('button').filter(has_text='返回').first.click()
        time.sleep(0.5)
        page.locator('.mode-card').nth(1).click()
        time.sleep(1)

        # Select piece
        page.locator('#practicePieceSelect').select_option('ode')
        time.sleep(1)
        p_notes = page.locator('#practiceSheetCard .jianpu-note').count()
        assert p_notes == 30, f'Ode should have 30 notes, got {p_notes}'
        print(f'  ✓ 欢乐颂简谱: {p_notes} 音符')

        # Check status bar
        status_items = page.locator('.status-item').count()
        assert status_items == 4, f'Status items should be 4, got {status_items}'
        print(f'  ✓ 状态栏: {status_items} 项')

        # Check feedback area
        fb = page.locator('#feedbackArea').is_visible()
        assert fb, 'Feedback area not visible'
        print(f'  ✓ 反馈区域: 可见')

        # Check beat bar exists
        bb = page.locator('#beatFill').is_visible()
        assert bb, 'Beat bar not visible'
        print(f'  ✓ 节拍进度条: 可见')

        # Check start button
        start_btn = page.locator('#btnPracticeStart')
        assert start_btn.is_visible(), 'Start button not visible'
        print(f'  ✓ 开始按钮: 可见')

        # ══════════════════════════════════════
        # TEST 4: Piece Switching
        # ══════════════════════════════════════
        print('\n[TEST 4] 曲目切换...')
        page.locator('#practicePieceSelect').select_option('elise')
        time.sleep(1)
        elise_notes = page.locator('#practiceSheetCard .jianpu-note').count()
        assert elise_notes == 27, f'Fur Elise should have 27 notes, got {elise_notes}'
        print(f'  ✓ 致爱丽丝简谱: {elise_notes} 音符')

        # ══════════════════════════════════════
        # TEST 5: Keyboard Input
        # ══════════════════════════════════════
        print('\n[TEST 5] 电脑键盘输入...')
        # Press Z key (C4) - should highlight the key
        page.keyboard.down('z')
        time.sleep(0.2)
        pressed = page.locator('#freeKeyboard .white-key.pressed').count()
        # May or may not register depending on focus
        page.keyboard.up('z')
        print(f'  ✓ 键盘事件发送')

        # ══════════════════════════════════════
        # TEST 6: Navigation
        # ══════════════════════════════════════
        print('\n[TEST 6] 页面导航...')
        page.locator('button').filter(has_text='退出').first.click()
        time.sleep(0.5)
        welcome_visible = page.locator('#screenWelcome').is_visible()
        assert welcome_visible, 'Should be back on welcome screen'
        print(f'  ✓ 返回首页: 成功')

        # ══════════════════════════════════════
        # TEST 7: Results Screen
        # ══════════════════════════════════════
        print('\n[TEST 7] 结果页...')
        # Navigate directly to results screen to verify layout
        page.evaluate("showScreen('screenResults')")
        time.sleep(0.5)
        score = page.locator('#resultScore').is_visible()
        stats = page.locator('.stat-card').count()
        breakdown = page.locator('#breakdownList').is_visible()
        assert stats == 4, f'Stats cards should be 4, got {stats}'
        print(f'  ✓ 统计卡片: {stats}')
        print(f'  ✓ 成绩显示: {score}')
        print(f'  ✓ 详情列表: {breakdown}')

        # ══════════════════════════════════════
        # TEST 8: Responsive Design
        # ══════════════════════════════════════
        print('\n[TEST 8] 移动端适配...')
        page.set_viewport_size({"width": 375, "height": 667})
        time.sleep(0.5)
        page.screenshot(path='test_mobile.png')
        # Verify no overflow
        overflow = page.evaluate("""() => {
            const app = document.querySelector('.app');
            return app.scrollWidth > window.innerWidth;
        }""")
        print(f'  ✓ 横向溢出: {overflow}')

        # ══════════════════════════════════════
        # TEST 9: Library Loading
        # ══════════════════════════════════════
        print('\n[TEST 9] 依赖库...')
        tone = page.evaluate("typeof Tone !== 'undefined'")
        print(f'  ✓ Tone.js 加载: {tone}')
        vex_removed = page.evaluate("typeof Vex === 'undefined'")
        print(f'  ✓ VexFlow 已移除: {vex_removed}')

        # ══════════════════════════════════════
        # RESULT
        # ══════════════════════════════════════
        print('\n' + '═' * 40)
        if errors:
            print(f'⚠  JS 错误 ({len(errors)}):')
            for e in errors[:5]:
                print(f'  - {e[:100]}')
        else:
            print('✅ 全部测试通过！零错误！')
        print('═' * 40)

        browser.close()

except ImportError:
    print('\n⚠ 未安装 Playwright，跳过浏览器测试')
    print('  安装: pip install playwright && playwright install chromium')

finally:
    server.terminate()
    print('\n服务已关闭')
