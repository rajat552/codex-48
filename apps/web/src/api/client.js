function sanitizeApiBase(raw) {
  if (!raw) return '/api/v1';
  let val = raw.trim();
  // If multiple http(s) exist due to accidental duplicate paste, take the last one
  const parts = val.split(/(?=https?:\/\/)/);
  if (parts.length > 0) {
    val = parts[parts.length - 1];
  }
  val = val.replace(/\/+$/, '');
  if (val.startsWith('http')) {
    try {
      const url = new URL(val);
      if (!url.pathname.includes('/api/v1')) {
        url.pathname = (url.pathname.replace(/\/+$/, '') + '/api/v1').replace('//', '/');
      }
      return url.origin + url.pathname.replace(/\/+$/, '');
    } catch (e) {}
  }
  return val || '/api/v1';
}

const API_BASE = sanitizeApiBase(import.meta.env.VITE_API_URL);

export class ApiClient {
  static cache = new Map();

  static clearCache() {
    this.cache.clear();
  }

  static getToken() {
    return localStorage.getItem('cohesora_token') || '';
  }

  static getRefreshToken() {
    return localStorage.getItem('cohesora_refresh_token') || '';
  }

  static setToken(token, refreshToken = undefined) {
    this.clearCache();
    if (token) {
      localStorage.setItem('cohesora_token', token);
    } else {
      localStorage.removeItem('cohesora_token');
    }

    if (refreshToken !== undefined) {
      if (refreshToken) {
        localStorage.setItem('cohesora_refresh_token', refreshToken);
      } else {
        localStorage.removeItem('cohesora_refresh_token');
      }
    } else if (!token) {
      localStorage.removeItem('cohesora_refresh_token');
    }
  }

  static prefetch(path) {
    if (!path) return;
    const token = this.getToken();
    const cacheKey = `${token}:${path}`;
    if (!this.cache.has(cacheKey)) {
      this.revalidateQuietly(path, {}, cacheKey);
    }
  }

  static async request(path, options = {}) {
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    const token = this.getToken();
    const cacheKey = isGet ? `${token}:${path}` : null;

    // On mutations (POST, PUT, DELETE, PATCH), invalidate cache
    if (!isGet) {
      this.clearCache();
    } else if (!options.skipCache && cacheKey && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey);
      // Instant return in 0ms, revalidate quietly in background if older than 4s
      if (Date.now() - entry.timestamp > 4000) {
        this.revalidateQuietly(path, options, cacheKey);
      }
      return entry.data;
    }

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

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    let response;
    try {
      response = await fetch(`${API_BASE}${cleanPath}`, {
        ...options,
        headers
      });
    } catch (networkErr) {
      throw new Error('Unable to connect to the backend server. Please verify the API server is running.');
    }

    if (response.status === 204) {
      return null;
    }

    let data = null;
    const responseText = await response.text();
    if (responseText && responseText.trim().length > 0) {
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        data = null;
      }
    }

    if (!response.ok) {
      // If 401 Unauthorized and not already a retry or auth route, attempt transparent refresh
      if (response.status === 401 && !options._isRetry && !path.includes('/auth/')) {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
          try {
            const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });

            if (refreshRes.ok) {
              const refreshBody = await refreshRes.json();
              const newAccessToken = refreshBody.data?.accessToken;
              if (newAccessToken) {
                this.setToken(newAccessToken);
                // Retry the original request with the renewed access token
                const retryHeaders = {
                  ...options.headers,
                  Authorization: `Bearer ${newAccessToken}`
                };
                return this.request(path, {
                  ...options,
                  headers: retryHeaders,
                  _isRetry: true
                });
              }
            } else {
              // Refresh token also invalid or expired
              this.setToken(null);
            }
          } catch (refreshErr) {
            // Network error during refresh - proceed to normal error throw
          }
        }
      }

      const defaultMessage =
        data?.error?.message ||
        (response.status === 502 || response.status === 504 || response.status === 503
          ? 'Backend service is starting up. Please try again in a few seconds.'
          : `Server request failed with status ${response.status}`);
      const err = new Error(defaultMessage);
      err.code = data?.error?.code || `HTTP_${response.status}`;
      err.details = data?.error?.details;
      err.status = response.status;
      throw err;
    }

    if (!data) {
      throw new Error('Received empty response from server. Please try again.');
    }

    if (isGet && cacheKey && data.data !== undefined) {
      this.cache.set(cacheKey, { data: data.data, timestamp: Date.now() });
    }

    return data.data;
  }

  static async revalidateQuietly(path, options, cacheKey) {
    try {
      const token = this.getToken();
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      };
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const response = await fetch(`${API_BASE}${cleanPath}`, { ...options, headers });
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          const parsed = JSON.parse(text);
          if (parsed && parsed.data !== undefined) {
            this.cache.set(cacheKey, { data: parsed.data, timestamp: Date.now() });
          }
        }
      }
    } catch (e) {}
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
  static getSubmissions(workspaceId, params = {}, options = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/workspaces/${workspaceId}/submissions${q ? `?${q}` : ''}`, options);
  }

  static getSubmission(workspaceId, submissionId, options = {}) {
    return this.request(`/workspaces/${workspaceId}/submissions/${submissionId}`, options);
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

  static async getDiff(workspaceId, submissionId, fromRevision, toRevision) {
    try {
      return await this.request(`/workspaces/${workspaceId}/submissions/${submissionId}/revisions/diff?fromRevision=${fromRevision}&toRevision=${toRevision}`);
    } catch (err) {
      if (err.status === 404 || err.message?.includes('not found')) {
        return await this.request(`/workspaces/${workspaceId}/submissions/${submissionId}/diff?fromRevision=${fromRevision}&toRevision=${toRevision}`);
      }
      throw err;
    }
  }

  static submitDecision(workspaceId, submissionId, status, comments) {
    const raw = String(status || '').toLowerCase();
    let action = raw;
    if (raw === 'approved') action = 'approve';
    else if (raw === 'rejected') action = 'reject';
    else if (raw === 'changes_requested') action = 'request_changes';

    return this.request(`/workspaces/${workspaceId}/submissions/${submissionId}/decisions`, {
      method: 'POST',
      body: {
        action,
        status: action,
        reason: comments,
        comment: comments,
        comments
      }
    });
  }

  static async overrideFinding(workspaceId, submissionId, findingId, reason) {
    try {
      return await this.request(`/workspaces/${workspaceId}/submissions/${submissionId}/findings/${findingId}/override`, {
        method: 'POST',
        body: { reason }
      });
    } catch (err) {
      return await this.request(`/workspaces/${workspaceId}/submissions/${submissionId}/decisions`, {
        method: 'POST',
        body: {
          action: 'override_finding',
          findingId,
          reason
        }
      });
    }
  }

  static async getAuditEvents(workspaceId, params = {}) {
    const q = new URLSearchParams(params).toString();
    try {
      return await this.request(`/workspaces/${workspaceId}/audit-events${q ? `?${q}` : ''}`);
    } catch (err) {
      if (params.submissionId) {
        return await this.request(`/workspaces/${workspaceId}/submissions/${params.submissionId}/audit-events`);
      }
      throw err;
    }
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
  static getInsights(workspaceId, params = {}, options = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/workspaces/${workspaceId}/insights${q ? `?${q}` : ''}`, {
      skipCache: true,
      ...options
    });
  }
}

// Convenient modular object export
export const api = {
  setToken: (token, refreshToken) => ApiClient.setToken(token, refreshToken),
  getToken: () => ApiClient.getToken(),
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
    list: (wsId, params, options) => ApiClient.getSubmissions(wsId, params, options),
    getById: (wsId, subId, options) => ApiClient.getSubmission(wsId, subId, options),
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
    get: (wsId, params, options) => ApiClient.getInsights(wsId, params, options)
  },
  prefetch: (path) => ApiClient.prefetch(path),
  clearCache: () => ApiClient.clearCache()
};
