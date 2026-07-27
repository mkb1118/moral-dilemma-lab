from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

ROOT = Path(__file__).resolve().parents[2]
HOME = ROOT / "index.html"

PAGES = [
    {"name": "道德困境实验室", "path": "moral-dilemma-lab/index.html", "start": "text=开始实验", "mode": ".mode-card", "answer": ".choice-btn", "result": "#results.active"},
    {"name": "大五人格评测", "path": "big-five/index.html", "start": "text=开始测评", "mode": ".mode-card", "answer": ".scale-btn:not([disabled])", "result": "#results.active"},
    {"name": "认知偏差检测", "path": "cognitive-bias/index.html", "start": "text=开始检测", "answer": ".choice-btn", "result": "#results.active"},
    {"name": "情绪智力评估", "path": "eq-assessment/index.html", "start": "text=开始评估", "mode": ".mode-card", "answer": ".opt-btn, .choice-btn", "result": "#results.active"},
    {"name": "决策风格分析", "path": "decision-style/index.html", "start": "text=开始分析", "answer": ".choice-btn", "result": "#results.active"},
]


def page_url(path):
    return (ROOT / path).as_uri()


def click_if_visible(page, selector, timeout=2500):
    try:
        page.locator(selector).first.click(timeout=timeout)
        return True
    except Exception:
        return False


def run_answer_flow(page, cfg, limit=90):
    click_if_visible(page, cfg["start"])
    if cfg.get("mode"):
        click_if_visible(page, cfg["mode"])
    page.wait_for_timeout(150)
    clicks = 0
    for _ in range(limit):
        if page.locator(cfg["result"]).count() > 0:
            break
        try:
            page.locator(cfg["answer"]).first.click(timeout=5000, force=True)
            clicks += 1
        except PlaywrightTimeoutError:
            if page.locator(cfg["result"]).count() > 0:
                break
            raise
        page.wait_for_timeout(520 if "道德" in cfg["name"] else 280)
    return clicks


def run_values_flow(page):
    click_if_visible(page, "text=开始")
    page.wait_for_timeout(100)
    ids = page.evaluate("VALUES.map(v => v.id)")
    for vid in ids[:4]:
        page.evaluate("id => { cycleTier(id); cycleTier(id); }", vid)
    for vid in ids[4:8]:
        page.evaluate("id => cycleTier(id)", vid)
    page.locator("#btnNext").click(timeout=2500)
    page.locator("text=查看结果").click(timeout=2500)
    page.wait_for_timeout(300)


def main():
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        home = browser.new_page(viewport={"width": 1366, "height": 900})
        home_errors = []
        home.on("pageerror", lambda exc: home_errors.append(str(exc)))
        home.goto(HOME.as_uri())
        home.wait_for_load_state("networkidle")
        card_count = home.locator(".lab-test-card").count()
        desc_count = home.locator("meta[name='description']").count()
        if card_count != 6:
            failures.append(f"home expected 6 cards, got {card_count}")
        if desc_count < 1:
            failures.append("home missing meta description")
        if home_errors:
            failures.append(f"home page errors: {home_errors}")
        home.close()

        all_pages = PAGES + [{"name": "核心价值观排序", "path": "values-sort/index.html", "values": True, "result": "#results.active"}]
        for cfg in all_pages:
            page = browser.new_page(viewport={"width": 390, "height": 844})
            logs, errors = [], []
            page.on("console", lambda msg, arr=logs: arr.append(f"{msg.type}: {msg.text}"))
            page.on("pageerror", lambda exc, arr=errors: arr.append(str(exc)))
            page.goto(page_url(cfg["path"]))
            page.wait_for_load_state("networkidle")

            if page.locator("meta[name='description']").count() < 1:
                failures.append(f"{cfg['name']} missing meta description")
            if page.locator("a[href='../index.html']").count() < 1:
                failures.append(f"{cfg['name']} missing home link")

            try:
                if cfg.get("values"):
                    run_values_flow(page)
                else:
                    run_answer_flow(page, cfg)
            except Exception as exc:
                failures.append(f"{cfg['name']} flow failed: {type(exc).__name__}: {exc}")

            result_active = page.locator(cfg["result"]).count()
            if result_active < 1:
                failures.append(f"{cfg['name']} did not reach results")
            if errors:
                failures.append(f"{cfg['name']} page errors: {errors}")
            error_logs = [l for l in logs if l.startswith("error:")]
            if error_logs:
                failures.append(f"{cfg['name']} console errors: {error_logs}")

            if cfg["path"] == "decision-style/index.html" and result_active:
                scores = [int(x) for x in page.locator(".style-score").all_inner_texts()]
                if scores and max(scores) > 100:
                    failures.append(f"decision scores exceed 100: {scores}")
            page.close()
        browser.close()

    if failures:
        print("FAIL")
        for item in failures:
            print("-", item)
        raise SystemExit(1)
    print("PASS: home + 6 psychology tests smoke checks completed")


if __name__ == "__main__":
    main()
