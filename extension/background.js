importScripts("config.js");

const DEFAULT_API_BASE = globalThis.ASHIAN_EXTENSION_CONFIG?.apiBase || "http://localhost:3000";
const STORAGE_KEYS = { apiBase: "ashianApiBase", token: "ashianToken", user: "ashianUser" };

async function config() {
  const saved = await chrome.storage.local.get([STORAGE_KEYS.apiBase, STORAGE_KEYS.token, STORAGE_KEYS.user]);
  return {
    apiBase: (saved[STORAGE_KEYS.apiBase] || DEFAULT_API_BASE).replace(/\/$/, ""),
    token: saved[STORAGE_KEYS.token] || "",
    user: saved[STORAGE_KEYS.user] || null,
  };
}

async function request(path, options = {}) {
  const current = await config();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (current.token) headers.Authorization = `Bearer ${current.token}`;
  const response = await fetch(`${current.apiBase}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message.type === "SET_API_BASE") {
      const apiBase = String(message.apiBase || (await config()).apiBase || DEFAULT_API_BASE).trim().replace(/\/$/, "");
      await chrome.storage.local.set({ [STORAGE_KEYS.apiBase]: apiBase });
      return { ok: true, apiBase };
    }
    if (message.type === "LOGIN") {
      const apiBase = String(message.apiBase || (await config()).apiBase || DEFAULT_API_BASE).trim().replace(/\/$/, "");
      const response = await fetch(`${apiBase}/api/extension/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: message.username, password: message.password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(body.error || "ورود انجام نشد");
        error.status = response.status;
        throw error;
      }
      await chrome.storage.local.set({
        [STORAGE_KEYS.apiBase]: apiBase,
        [STORAGE_KEYS.token]: body.token,
        [STORAGE_KEYS.user]: body.user,
      });
      return { ok: true, user: body.user };
    }
    if (message.type === "LOGOUT") {
      try { await request("/api/extension/logout", { method: "POST" }); } catch { /* local logout still succeeds */ }
      await chrome.storage.local.remove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
      return { ok: true };
    }
    if (message.type === "SESSION") {
      const current = await config();
      if (!current.token) return { ok: true, user: null, apiBase: current.apiBase };
      try {
        const body = await request("/api/extension/me");
        await chrome.storage.local.set({ [STORAGE_KEYS.user]: body.user });
        return { ok: true, user: body.user, apiBase: current.apiBase };
      } catch (error) {
        if (error.status === 401) await chrome.storage.local.remove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
        return { ok: true, user: null, apiBase: current.apiBase };
      }
    }
    if (message.type === "IMPORT_PROPERTY") {
      try {
        const body = await request("/api/extension/import", {
          method: "POST",
          body: JSON.stringify(message.property),
        });
        return { ok: true, body };
      } catch (error) {
        return { ok: false, status: error.status || 0, body: error.body || { error: error.message } };
      }
    }
    return { ok: false, error: "Unknown extension message" };
  })()
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: error.message || "خطای نامشخص" }));
  return true;
});
