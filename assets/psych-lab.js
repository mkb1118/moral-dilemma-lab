/* Psychology Lab shared helpers + a11y layer · no dependencies */
(function () {
  var announcerEl = null;
  var announcerTimer = 0;

  function ensureAnnouncer() {
    if (announcerEl) return announcerEl;
    announcerEl = document.getElementById('lab-announcer');
    if (!announcerEl) {
      announcerEl = document.createElement('div');
      announcerEl.id = 'lab-announcer';
      announcerEl.setAttribute('aria-live', 'polite');
      announcerEl.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcerEl);
    }
    return announcerEl;
  }

  function ensureSkipLink() {
    if (document.getElementById('lab-skip-link')) return;
    var link = document.createElement('a');
    link.id = 'lab-skip-link';
    link.href = '#lab-main';
    link.textContent = '';
    document.body.insertBefore(link, document.body.firstChild);
    var main = document.querySelector('.app') || document.querySelector('.lab-home') || document.querySelector('main');
    if (main && !main.id) main.id = 'lab-main';
  }

  function announce(message, mode) {
    var el = ensureAnnouncer();
    el.setAttribute('aria-live', mode === 'assertive' ? 'assertive' : 'polite');
    clearTimeout(announcerTimer);
    el.textContent = '';
    requestAnimationFrame(function () {
      el.textContent = message;
      el.classList.add('active');
      announcerTimer = setTimeout(function () { el.classList.remove('active'); }, 3200);
    });
  }

  function currentUrl() {
    if (location.protocol === 'file:') return location.href;
    return location.href.split('#')[0];
  }

  function showToast(message) {
    var old = document.querySelector('.lab-toast');
    if (old) old.remove();
    var toast = document.createElement('div');
    toast.className = 'lab-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2600);
  }

  function copyText(text, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { showToast(successMessage || '已复制到剪贴板'); },
        function () { fallbackCopy(text, successMessage); }
      );
    } else {
      fallbackCopy(text, successMessage);
    }
  }

  function fallbackCopy(text, successMessage) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); showToast(successMessage || '已复制到剪贴板'); }
    catch (err) { showToast('复制失败，请手动复制'); }
    area.remove();
  }

  function saveProgress(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  }

  function loadProgress(key) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  function clearProgress(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  function hasProgress(key) {
    try { return localStorage.getItem(key) !== null; } catch (e) { return false; }
  }

  function injectResumePrompt(welcomeEl, key, saved, onContinue, onRestart) {
    if (!welcomeEl) return;
    // Remove any existing resume card
    var old = welcomeEl.querySelector('.resume-card');
    if (old) old.remove();

    var total = saved.total || 0;
    var current = (saved.currentQ || saved.currentDilemma || 0) + 1;
    var modeLabel = saved.isPro ? '专业版' : (saved.isPro === false ? '轻量版' : '');
    var progressText = '上次进度：第 ' + current + ' / ' + total + ' 题' + (modeLabel ? '（' + modeLabel + '）' : '');

    var card = document.createElement('div');
    card.className = 'resume-card';
    card.innerHTML =
      '<div class="resume-icon">📝</div>' +
      '<div class="resume-text">检测到未完成的测试</div>' +
      '<div class="resume-progress">' + progressText + '</div>' +
      '<div class="resume-row">' +
        '<button class="btn primary resume-continue">继续上次</button>' +
        '<button class="btn resume-fresh">重新开始</button>' +
      '</div>';

    // Find the first primary button in the welcome screen and insert before it
    var primaryBtn = welcomeEl.querySelector('.btn.primary');
    if (primaryBtn) {
      primaryBtn.parentNode.insertBefore(card, primaryBtn);
    } else {
      welcomeEl.insertBefore(card, welcomeEl.firstChild);
    }

    card.querySelector('.resume-continue').addEventListener('click', function () {
      card.remove();
      if (onContinue) onContinue(saved);
    });
    card.querySelector('.resume-fresh').addEventListener('click', function () {
      card.remove();
      clearProgress(key);
      if (onRestart) onRestart();
    });
  }

  function syncProgressBar(fillEl) {
    if (!fillEl) return;
    var value = parseInt(fillEl.style.width || '0', 10) || 0;
    value = Math.max(0, Math.min(100, Math.round(value)));
    var track = fillEl.closest('.progress-track') || fillEl.parentElement;
    if (track) {
      track.setAttribute('role', 'progressbar');
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-valuenow', String(value));
    }
  }

  function updateProgress(fillEl, percent) {
    if (!fillEl) return;
    var value = Math.max(0, Math.min(100, Math.round(percent)));
    fillEl.style.width = value + '%';
    syncProgressBar(fillEl);
  }

  function activateKeyboardButtons(root) {
    root.querySelectorAll('[role="button"][tabindex], .mode-card[tabindex], .value-chip[tabindex], .rank-card[tabindex]').forEach(function (el) {
      if (el.dataset.labKeyReady) return;
      el.dataset.labKeyReady = '1';
      el.addEventListener('keydown', function (evt) {
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          el.click();
        }
      });
    });
  }

  function decoratePage() {
    document.body.classList.add('lab-ready');
    document.querySelectorAll('.progress-track').forEach(function (track) { syncProgressBar(track.querySelector('.progress-fill') || track); });
    document.querySelectorAll('.q-text, #qText, #qScene').forEach(function (el) { el.setAttribute('aria-live', 'polite'); });
    document.querySelectorAll('a[href="../index.html"]').forEach(function (a) { a.classList.add('lab-home-link'); });
    document.querySelectorAll('.mode-card:not(button), .value-chip, .rank-card').forEach(function (el) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
    });
    activateKeyboardButtons(document);
  }

  var lastActiveScreen = '';
  function watchScreenChanges() {
    var observer = new MutationObserver(function () {
      var active = document.querySelector('.screen.active');
      if (!active) return;
      var id = active.id;
      if (id === lastActiveScreen) return;
      lastActiveScreen = id;
      if (id === 'quiz' || id === 'sort' || id === 'rank') {
        announce('已进入答题页面。请逐一作答，可以使用 Tab 键切换选项。');
      } else if (id === 'results') {
        setTimeout(function () { announce('你的测试结果已生成。请查看下方的报告摘要和维度分析。', 'assertive'); }, 400);
      } else if (id === 'modeSelect') {
        announce('请选择测试模式：轻量版或专业版。');
      } else if (id === 'welcome') {
        announce('已返回欢迎页。');
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  function init() {
    ensureSkipLink();
    ensureAnnouncer();
    decoratePage();
    watchScreenChanges();
  }

  window.PsychLab = {
    currentUrl: currentUrl,
    showToast: showToast,
    copyText: copyText,
    updateProgress: updateProgress,
    syncProgressBar: syncProgressBar,
    announce: announce,
    decoratePage: decoratePage,
    saveProgress: saveProgress,
    loadProgress: loadProgress,
    clearProgress: clearProgress,
    hasProgress: hasProgress,
    injectResumePrompt: injectResumePrompt
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
