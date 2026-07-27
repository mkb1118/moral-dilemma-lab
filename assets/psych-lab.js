/* Psychology Lab shared helpers · no dependencies */
(function () {
  function currentUrl() {
    if (location.protocol === 'file:') return location.href;
    return location.href.split('#')[0];
  }

  function showToast(message) {
    const old = document.querySelector('.lab-toast');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.className = 'lab-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  function copyText(text, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast(successMessage || '已复制到剪贴板'),
        () => fallbackCopy(text, successMessage)
      );
    } else {
      fallbackCopy(text, successMessage);
    }
  }

  function fallbackCopy(text, successMessage) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
      showToast(successMessage || '已复制到剪贴板');
    } catch (err) {
      showToast('复制失败，请手动复制');
    }
    area.remove();
  }

  function updateProgress(el, percent) {
    if (!el) return;
    const value = Math.max(0, Math.min(100, Math.round(percent)));
    el.style.width = value + '%';
    const host = el.closest('[role="progressbar"]') || el.parentElement;
    if (host) {
      host.setAttribute('role', 'progressbar');
      host.setAttribute('aria-valuemin', '0');
      host.setAttribute('aria-valuemax', '100');
      host.setAttribute('aria-valuenow', String(value));
    }
  }

  function activateKeyboardButtons(root) {
    root.querySelectorAll('[role="button"][tabindex], .mode-card[tabindex], .value-chip[tabindex], .rank-card[tabindex]').forEach(el => {
      if (el.dataset.labKeyReady) return;
      el.dataset.labKeyReady = '1';
      el.addEventListener('keydown', evt => {
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          el.click();
        }
      });
    });
  }

  function syncProgressTrack(track) {
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    const fill = track.querySelector('.progress-fill');
    const width = fill ? parseInt(fill.style.width || '0', 10) || 0 : 0;
    track.setAttribute('aria-valuenow', String(Math.max(0, Math.min(100, width))));
  }

  function decoratePage() {
    document.body.classList.add('lab-ready');
    document.querySelectorAll('.progress-track').forEach(track => syncProgressTrack(track));
    document.querySelectorAll('.q-text, #qText, #qScene').forEach(el => {
      el.setAttribute('aria-live', 'polite');
    });
    document.querySelectorAll('a[href="../index.html"]').forEach(a => {
      a.classList.add('lab-home-link');
    });
    document.querySelectorAll('.mode-card:not(button), .value-chip, .rank-card').forEach(el => {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
    });
    activateKeyboardButtons(document);
  }

  let decorating = false;
  const observer = new MutationObserver(() => {
    if (decorating) return;
    decorating = true;
    requestAnimationFrame(() => {
      decoratePage();
      document.querySelectorAll('.progress-track').forEach(track => syncProgressTrack(track));
      decorating = false;
    });
  });

  function observePage() {
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  }

  window.PsychLab = {
    currentUrl,
    showToast,
    copyText,
    updateProgress,
    decoratePage
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      decoratePage();
      observePage();
    });
  } else {
    decoratePage();
    observePage();
  }
})();
