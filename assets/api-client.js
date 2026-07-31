// ============================================
// PsychLab API Client
// Dual-mode: backend when logged in, localStorage when offline
// ============================================
(function () {
  var API_BASE = 'http://127.0.0.1:3000/api';

  function apiHeaders() {
    var headers = { 'Content-Type': 'application/json' };
    var token = localStorage.getItem('psychlab_token');
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
  }

  async function apiFetch(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign(apiHeaders(), opts.headers || {});
    var res = await fetch(API_BASE + path, opts);
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
    return data;
  }

  var PsychLabAPI = {
    // ---- Auth ----
    getToken: function () { return localStorage.getItem('psychlab_token'); },
    setToken: function (t) { localStorage.setItem('psychlab_token', t); },
    clearToken: function () { localStorage.removeItem('psychlab_token'); localStorage.removeItem('psychlab_user'); },
    isLoggedIn: function () { return !!localStorage.getItem('psychlab_token'); },
    getUser: function () {
      try { return JSON.parse(localStorage.getItem('psychlab_user')); } catch (e) { return null; }
    },
    setUser: function (u) { localStorage.setItem('psychlab_user', JSON.stringify(u)); },

    register: async function (nickname, password) {
      var data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ nickname: nickname, password: password }) });
      this.setToken(data.token);
      this.setUser(data.user);
      return data;
    },

    login: async function (nickname, password) {
      var data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ nickname: nickname, password: password }) });
      this.setToken(data.token);
      this.setUser(data.user);
      return data;
    },

    logout: function () {
      this.clearToken();
      window.dispatchEvent(new CustomEvent('psychlab:logout'));
    },

    // ---- Tests ----
    getTests: async function () {
      return await apiFetch('/tests');
    },

    getTestQuestions: async function (testType) {
      return await apiFetch('/tests/' + testType);
    },

    // ---- Sessions ----
    createSession: async function (testTypeId, mode) {
      return await apiFetch('/sessions', { method: 'POST', body: JSON.stringify({ testTypeId: testTypeId, mode: mode }) });
    },

    submitAnswer: async function (sessionId, questionId, answer) {
      return await apiFetch('/sessions/' + sessionId + '/answer', {
        method: 'POST',
        body: JSON.stringify({ questionId: String(questionId), answer: answer })
      });
    },

    completeSession: async function (sessionId, scores, summary) {
      return await apiFetch('/sessions/' + sessionId + '/complete', {
        method: 'POST',
        body: JSON.stringify({ scores: scores, summary: summary })
      });
    },

    getSession: async function (sessionId) {
      return await apiFetch('/sessions/' + sessionId);
    },

    // ---- User ----
    getProfile: async function () {
      return await apiFetch('/users/me');
    },

    getHistory: async function () {
      return await apiFetch('/users/me/history');
    },

    addFavorite: async function (sessionId) {
      return await apiFetch('/users/favorites/' + sessionId, { method: 'POST' });
    },

    removeFavorite: async function (sessionId) {
      return await apiFetch('/users/favorites/' + sessionId, { method: 'DELETE' });
    },

    // ---- Health ----
    health: async function () {
      return await apiFetch('/health');
    },
    // ---- Session Helpers (convenience wrappers for test pages) ----
    startSession: async function (testTypeId, mode) {
      if (!this.isLoggedIn()) return null;
      try {
        return await this.createSession(testTypeId, mode);
      } catch (e) {
        console.warn('Session creation failed, falling back to offline: ' + e.message);
        return null;
      }
    },

    answerQuestion: async function (sessionId, questionId, answer) {
      if (!sessionId) return;
      try {
        await this.submitAnswer(sessionId, questionId, answer);
      } catch (e) {
        console.warn('Answer submission failed: ' + e.message);
      }
    },

    finishSession: async function (sessionId, scores, summary) {
      if (!sessionId) return null;
      try {
        return await this.completeSession(sessionId, scores, summary);
      } catch (e) {
        console.warn('Session completion failed: ' + e.message);
        return null;
      }
    }
  };

  window.PsychLabAPI = PsychLabAPI;
})();
