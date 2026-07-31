"""
Search and download MIDI for 去北极忘记你 by Gareth.T
"""
from playwright.sync_api import sync_playwright
import os, time, urllib.request

OUTPUT_DIR = r"E:\my project\piano-assistant"
found_midi = None

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)  # visible for debugging
    page = browser.new_page(viewport={"width": 1280, "height": 900})

    # Listen for downloads
    page.on("download", lambda dl: print(f"DOWNLOAD: {dl.suggested_filename}"))

    # ── Site 1: MidiShow ──
    print("=== MidiShow ===")
    try:
        page.goto("https://www.midishow.com", timeout=15000)
        page.wait_for_timeout(2000)

        # Accept cookies if present
        try:
            page.locator("text=同意").click(timeout=2000)
        except: pass

        # Search
        search_box = page.locator('input[type="text"], input[placeholder*="搜索"], input[name="keyword"]').first
        if search_box.count() > 0:
            search_box.fill("去北极忘记你")
            search_box.press("Enter")
            page.wait_for_timeout(3000)
            page.screenshot(path="midishow_search.png")
            print("Searched midishow")
        else:
            print("No search box on midishow")
    except Exception as e:
        print(f"Midishow error: {e}")

    # ── Site 2: BitMidi ──
    print("\n=== BitMidi ===")
    try:
        page.goto("https://bitmidi.com", timeout=15000)
        page.wait_for_timeout(2000)
        search = page.locator('input[type="text"], input[placeholder*="search"]').first
        if search.count() > 0:
            search.fill("Gareth.T 去北极")
            search.press("Enter")
            page.wait_for_timeout(3000)
            page.screenshot(path="bitmidi_search.png")

            # Look for download links
            links = page.locator('a[href$=".mid"], a[href*="download"]').all()
            for link in links[:5]:
                href = link.get_attribute("href")
                text = link.text_content()
                print(f"  Link: {text[:50]} -> {href}")
        else:
            print("No search on bitmidi")
    except Exception as e:
        print(f"BitMidi error: {e}")

    # ── Site 3: FreeMIDI ──
    print("\n=== FreeMIDI ===")
    try:
        page.goto("https://freemidi.org", timeout=15000)
        page.wait_for_timeout(2000)
        # Search by artist
        search = page.locator('input[type="text"]').first
        if search.count() > 0:
            search.fill("Gareth.T")
            search.press("Enter")
            page.wait_for_timeout(3000)
            page.screenshot(path="freemidi_search.png")
    except Exception as e:
        print(f"FreeMIDI error: {e}")

    # ── Site 4: Direct Google search for MIDI download ──
    print("\n=== Google Search ===")
    try:
        page.goto("https://www.google.com/search?q=%22%E5%8E%BB%E5%8C%97%E6%9E%81%E5%BF%98%E8%AE%B0%E4%BD%A0%22+midi+file+download", timeout=15000)
        page.wait_for_timeout(2000)
        page.screenshot(path="google_search.png")
        # Collect all links
        links = page.locator('a[href*=".mid"], a[href*="midi"]').all()
        for link in links[:10]:
            href = link.get_attribute("href")
            print(f"  {href}")
    except Exception as e:
        print(f"Google error: {e}")

    browser.close()
    print("\nDone searching. Check screenshots for results.")
