// PsychLabSync — thin backend-sync helper for test pages
// Include after api-client.js. Call start/answer/complete at key points.
// If user is not logged in, all calls are silent no-ops.
var PsychLabSync = {
  _sessionId: null,
  _testTypeId: null,

  init: function (testTypeId) {
    this._testTypeId = testTypeId;
    this._sessionId = null;
  },

  start: async function (mode) {
    if (!PsychLabAPI.isLoggedIn()) return null;
    this._sessionId = null;
    try {
      var s = await PsychLabAPI.startSession(this._testTypeId, mode || "standard");
      if (s) this._sessionId = s.id;
      return this._sessionId;
    } catch (e) {
      console.warn("Session start failed: " + e.message);
      return null;
    }
  },

  answer: async function (questionId, answer) {
    if (!this._sessionId) return;
    try {
      await PsychLabAPI.answerQuestion(this._sessionId, questionId, answer);
    } catch (e) {
      console.warn("Answer sync failed: " + e.message);
    }
  },

  complete: async function (scores, summary) {
    if (!this._sessionId) return null;
    try {
      var r = await PsychLabAPI.finishSession(this._sessionId, scores, summary);
      this._sessionId = null;
      return r;
    } catch (e) {
      console.warn("Session complete failed: " + e.message);
      return null;
    }
  },

  reset: function () {
    this._sessionId = null;
  }
};