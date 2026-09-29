const $ = (selector) => document.querySelector(selector);
const send = (message) => chrome.runtime.sendMessage(message);
const form = $("#login-form");
const error = $("#login-error");
const session = $("#session");
const logout = $("#logout");
const siteState = $("#site-state");

function showUser(user) {
  const loggedIn = Boolean(user);
  form.hidden = loggedIn;
  logout.hidden = !loggedIn;
  session.innerHTML = loggedIn
    ? `<div class="session-user"><strong>${user.name}</strong><small>${user.officeName || (user.role === "SUPER_ADMIN" ? "مدیر کل" : "حساب آشیان")}</small></div>`
    : "";
}

async function activeSite() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id) return "تب فعال پیدا نشد";
  if (!tab.url?.includes("amlakplus")) return "در سایت AmlakPlus نیستید";
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "SITE_STATE" });
    return response?.cards ? `${response.cards} کارت آماده import است` : "صفحه AmlakPlus آماده است";
  } catch {
    return "این صفحه هنوز اسکریپت افزونه را نگرفته است؛ یک بار refresh کنید";
  }
}

async function refresh() {
  const state = await send({ type: "SESSION" });
  showUser(state.user);
  siteState.dataset.apiBase = state.apiBase || "";
  siteState.textContent = await activeSite();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.textContent = "";
  try {
    const state = await send({ type: "SESSION" });
    const base = state.apiBase;
    const origin = new URL(base).origin + "/*";
    const granted = await chrome.permissions.request({ origins: [origin] });
    if (!granted) throw new Error("اجازه اتصال به آدرس آشیان داده نشد");
    const response = await send({ type: "LOGIN", username: $("#username").value, password: $("#password").value });
    if (!response.ok) throw new Error(response.error || "ورود انجام نشد");
    $("#password").value = "";
    await refresh();
  } catch (caught) {
    error.textContent = caught.message || "ارتباط با آشیان برقرار نشد";
  }
});

logout.addEventListener("click", async () => {
  await send({ type: "LOGOUT" });
  await refresh();
});

refresh();
