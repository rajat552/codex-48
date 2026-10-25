const API_BASE = '/api/v1';

export class ApiClient {
  static getToken() {
    return localStorage.getItem('cohesora_token') || '';
  }

  static setToken(token) {
    if (token) localStorage.setItem('cohesora_token', token);
    else localStorage.removeItem('cohesora_token');
  }

  static async request(path, options = {}) {
    const token = this.getToken();
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
      }
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    if (response.status === 204) {
      return null;
    }

    const data = await response.json();
    if (!response.ok) {
      const err = new Error(data.error?.message || 'API request failed');
      err.code = data.error?.code;
      err.details = data.error?.details;
      err.status = response.status;
      throw err;
    }

    return data.data;
  }

  // Auth endpoints
  static register(payload) {
    return this.request('/auth/register', { method: 'POST', body: payload });
  }

  static login(payload) {
    return this.request('/auth/login', { method: 'POST', body: payload });
  }

  static me() {
    return this.request('/auth/me');
  }

  // Workspaces
  static getWorkspaces() {
    return this.request('/workspaces');
  }

  static createWorkspace(payload) {
    return this.request('/workspaces', { method: 'POST', body: payload });
  }

  // Rules
  static getRules(workspaceId, params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/workspaces/${workspaceId}/rules${q ? `?${q}` : ''}`);
  }

  static createRule(workspaceId, payload) {
    return this.request(`/workspaces/${workspaceId}/rules`, { method: 'POST', body: payload });
  }

  static checkRuleConflicts(workspaceId, payload) {
    return this.request(`/workspaces/${workspaceId}/rules/conflict-check`, { method: 'POST', body: payload });
  }

  static approveRule(workspaceId, ruleId, payload) {
    return this.request(`/workspaces/${workspaceId}/rules/${ruleId}/approve`, { method: 'POST', body: payload });
  }

  static activateRule(workspaceId, ruleId, payload) {
    return this.request(`/workspaces/${workspaceId}/rules/${ruleId}/activate`, { method: 'POST', body: payload });
  }

  // Submissions
  static getSubmissions(workspaceId, params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/workspaces/${workspaceId}/submissions${q ? `?${q}` : ''}`);
  }

  static getSubmission(workspaceId, submissionId) {
    return this.request(`/workspaces/${workspaceId}/submissions/${submissionId}`);
  }

  static createSubmission(workspaceId, formData) {
    return this.request(`/workspaces/${workspaceId}/submissions`, { method: 'POST', body: formData });
  }

  static createRevision(workspaceId, submissionId, formData) {
    return this.request(`/workspaces/${workspaceId}/submissions/${submissionId}/revisions`, { method: 'POST', body: formData });
  }

  static triggerReviewRun(workspaceId, submissionId) {
    return this.request(`/workspaces/${workspaceId}/submissions/${submissionId}/review-runs`, { method: 'POST' });
  }

  static getDiff(workspaceId, submissionId, fromRevision, toRevision) {
    return this.request(`/workspaces/${workspaceId}/submissions/${submissionId}/revisions/diff?fromRevision=${fromRevision}&toRevision=${toRevision}`);
  }

  static submitDecision(workspaceId, submissionId, status, comments) {
    return this.request(`/workspaces/${workspaceId}/submissions/${submissionId}/decisions`, {
      method: 'POST',
      body: { status, comments }
    });
  }

  static overrideFinding(workspaceId, submissionId, findingId, reason) {
    return this.request(`/workspaces/${workspaceId}/submissions/${submissionId}/findings/${findingId}/override`, {
      method: 'POST',
      body: { reason }
    });
  }

  static getAuditEvents(workspaceId, params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/workspaces/${workspaceId}/audit-events${q ? `?${q}` : ''}`);
  }

  // Brief Imports (Named Improvement 1)
  static uploadBrief(workspaceId, formData) {
    return this.request(`/workspaces/${workspaceId}/brief-imports`, { method: 'POST', body: formData });
  }

  static getBriefImport(workspaceId, importId) {
    return this.request(`/workspaces/${workspaceId}/brief-imports/${importId}`);
  }

  static convertBriefToRules(workspaceId, importId, payload) {
    return this.request(`/workspaces/${workspaceId}/brief-imports/${importId}/convert-to-rules`, { method: 'POST', body: payload });
  }

  // Insights
  static getInsights(workspaceId, params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/workspaces/${workspaceId}/insights${q ? `?${q}` : ''}`);
  }
}

// Convenient modular object export
export const api = {
  auth: {
    register: payload => ApiClient.register(payload),
    login: payload => ApiClient.login(payload),
    me: () => ApiClient.me()
  },
  workspaces: {
    list: () => ApiClient.getWorkspaces(),
    create: payload => ApiClient.createWorkspace(payload)
  },
  rules: {
    list: (wsId, params) => ApiClient.getRules(wsId, params),
    create: (wsId, payload) => ApiClient.createRule(wsId, payload),
    checkConflict: (wsId, payload) => ApiClient.checkRuleConflicts(wsId, payload),
    approve: (wsId, ruleId, payload) => ApiClient.approveRule(wsId, ruleId, payload),
    activate: (wsId, ruleId, payload) => ApiClient.activateRule(wsId, ruleId, payload)
  },
  submissions: {
    list: (wsId, params) => ApiClient.getSubmissions(wsId, params),
    getById: (wsId, subId) => ApiClient.getSubmission(wsId, subId),
    create: (wsId, formData) => ApiClient.createSubmission(wsId, formData),
    createRevision: (wsId, subId, formData) => ApiClient.createRevision(wsId, subId, formData),
    triggerReview: (wsId, subId) => ApiClient.triggerReviewRun(wsId, subId),
    diffRevisions: (wsId, subId, from, to) => ApiClient.getDiff(wsId, subId, from, to),
    submitDecision: (wsId, subId, status, comments) => ApiClient.submitDecision(wsId, subId, status, comments),
    overrideFinding: (wsId, subId, findingId, reason) => ApiClient.overrideFinding(wsId, subId, findingId, reason)
  },
  audit: {
    list: (wsId, params) => ApiClient.getAuditEvents(wsId, params)
  },
  briefImports: {
    upload: (wsId, formData) => ApiClient.uploadBrief(wsId, formData),
    getById: (wsId, importId) => ApiClient.getBriefImport(wsId, importId),
    convertToRules: (wsId, importId, payload) => ApiClient.convertBriefToRules(wsId, importId, payload)
  },
  insights: {
    get: (wsId, params) => ApiClient.getInsights(wsId, params)
  }
};
