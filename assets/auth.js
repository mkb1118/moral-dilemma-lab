// ============================================
// PsychLab shared auth UI
// Depends on assets/api-client.js (window.PsychLabAPI).
// Exposes window.PsychLabAuth: renderAuthBar / openAuthModal /
// bindAuthModal / init({ onAuthenticated }).
// ============================================
(function () {
  var isLoginMode = true;
  var onAuthenticated = null;
  var barId = 'authBar';
  var bound = false;

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function el(id) { return document.getElementById(id); }

  // 若页面未内联模态框，则动态生成（保证各页面复用同一份 UI）
  function ensureModal() {
    if (el('authModalOverlay')) return;
    var overlay = document.createElement('div');
    overlay.className = 'lab-modal-overlay hidden';
    overlay.id = 'authModalOverlay';
    overlay.innerHTML =
      '<div class="lab-modal">' +
        '<h3 id="authModalTitle"><span id="authModalAction">登录</span> PsychLab</h3>' +
        '<div class="field"><label for="authNickname">昵称</label><input type="text" id="authNickname" placeholder="你的昵称" maxlength="20" autocomplete="nickname"></div>' +
        '<div class="field"><label for="authPassword">密码</label><input type="password" id="authPassword" placeholder="至少 6 位" maxlength="64" autocomplete="current-password"></div>' +
        '<div class="modal-error" id="authError"></div>' +
        '<div class="modal-actions">' +
          '<button class="btn-cancel" id="authCancelBtn">取消</button>' +
          '<button class="btn-submit" id="authSubmitBtn">登录</button>' +
        '</div>' +
        '<div class="modal-switch"><span id="authSwitchText">没有账号？</span> <a id="authSwitchLink" href="#">注册</a></div>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  function renderAuthBar() {
    var bar = el(barId);
    if (!bar) return;
    if (PsychLabAPI.isLoggedIn()) {
      var user = PsychLabAPI.getUser();
      var name = (user && user.nickname) || '用户';
      bar.innerHTML = '<div class="lab-user-menu" id="userMenu">' +
        '<div class="user-trigger" id="userTrigger">' + escHtml(name) + ' <span style="font-size:10px;">▼</span></div>' +
        '<div class="user-dropdown">' +
          '<a href="#" id="menuHistory">📋 测试历史</a>' +
          '<div class="sep"></div>' +
          '<button id="menuLogout">退出登录</button>' +
        '</div></div>';
      setTimeout(function () {
        var menu = el('userMenu');
        var trig = el('userTrigger');
        if (!trig) return;
        trig.addEventListener('click', function (e) { e.preventDefault(); menu.classList.toggle('open'); });
        document.addEventListener('click', function (e) { if (!menu.contains(e.target)) menu.classList.remove('open'); });
        var l = el('menuLogout');
        if (l) l.addEventListener('click', function (e) { e.preventDefault(); PsychLabAPI.logout(); renderAuthBar(); });
        var h = el('menuHistory');
        if (h) h.addEventListener('click', function (e) { e.preventDefault(); menu.classList.remove('open'); window.location.href = 'user-center/index.html'; });
      }, 0);
    } else {
      bar.innerHTML = '<button class="lab-auth-btn" id="showLoginBtn">登录</button>' +
        '<button class="lab-auth-btn primary" id="showRegisterBtn">注册</button>';
      setTimeout(function () {
        var lb = el('showLoginBtn');
        var rb = el('showRegisterBtn');
        if (lb) lb.addEventListener('click', function () { openAuthModal(true); });
        if (rb) rb.addEventListener('click', function () { openAuthModal(false); });
      }, 0);
    }
  }

  function setMode(isLogin) {
    isLoginMode = isLogin;
    el('authModalAction').textContent = isLogin ? '登录' : '注册';
    el('authSubmitBtn').textContent = isLogin ? '登录' : '注册';
    el('authSwitchText').textContent = isLogin ? '没有账号？' : '已有账号？';
    el('authSwitchLink').textContent = isLogin ? '注册' : '登录';
    el('authError').textContent = '';
  }

  function openAuthModal(isLogin) {
    ensureModal();
    setMode(isLogin);
    var overlay = el('authModalOverlay');
    overlay.classList.remove('hidden');
    el('authNickname').value = '';
    el('authPassword').value = '';
    el('authError').textContent = '';
    setTimeout(function () { el('authNickname').focus(); }, 100);
  }

  function closeModal() { el('authModalOverlay').classList.add('hidden'); }

  async function handleSubmit() {
    var nick = el('authNickname').value.trim();
    var pass = el('authPassword').value;
    var err = el('authError');
    var submit = el('authSubmitBtn');
    if (!nick) { err.textContent = '请输入昵称'; return; }
    if (pass.length < 6) { err.textContent = '密码至少 6 位'; return; }
    err.textContent = '';
    submit.disabled = true;
    submit.textContent = '…';
    try {
      if (isLoginMode) { await PsychLabAPI.login(nick, pass); }
      else { await PsychLabAPI.register(nick, pass); }
      closeModal();
      renderAuthBar();
      if (onAuthenticated) onAuthenticated();
    } catch (e) {
      err.textContent = e.message || '操作失败，请重试';
    } finally {
      submit.disabled = false;
      submit.textContent = isLoginMode ? '登录' : '注册';
    }
  }

  function bindAuthModal() {
    if (bound) return;
    bound = true;
    ensureModal();
    el('authCancelBtn').addEventListener('click', closeModal);
    el('authSubmitBtn').addEventListener('click', handleSubmit);
    el('authSwitchLink').addEventListener('click', function (e) { e.preventDefault(); setMode(!isLoginMode); });
    el('authModalOverlay').addEventListener('click', function (e) { if (e.target === el('authModalOverlay')) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !el('authModalOverlay').classList.contains('hidden')) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !el('authModalOverlay').classList.contains('hidden') && document.activeElement === el('authPassword')) handleSubmit();
    });
  }

  function init(options) {
    options = options || {};
    if (options.barId) barId = options.barId;
    if (typeof options.onAuthenticated === 'function') onAuthenticated = options.onAuthenticated;
    ensureModal();
    bindAuthModal();
    renderAuthBar();
    window.addEventListener('psychlab:logout', function () { renderAuthBar(); });
  }

  window.PsychLabAuth = {
    init: init,
    renderAuthBar: renderAuthBar,
    openAuthModal: openAuthModal,
    bindAuthModal: bindAuthModal,
    setOnAuthenticated: function (cb) { onAuthenticated = cb; },
    isLoggedIn: function () { return PsychLabAPI.isLoggedIn(); }
  };
})();
