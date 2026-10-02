const $ = (selector) => document.querySelector(selector);
const send = (message) => chrome.runtime.sendMessage(message);
const form = $("#login-form");
const error = $("#login-error");
const session = $("#session");
const logout = $("#logout");
const siteState = $("#site-state");
const folderPicker = $("#folder-picker");
const folderSelect = $("#folder-select");

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
  if (!/amlakplus|divar|kashano/.test(tab.url || "")) return "در سایت پشتیبانی‌شده نیستید";
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "SITE_STATE" });
    return response?.cards ? `${response.cards} کارت آماده import است` : "صفحه سایت آماده است";
  } catch {
    return "این صفحه هنوز اسکریپت افزونه را نگرفته است؛ یک بار refresh کنید";
  }
}

function showFolders(folders, defaultFolderId) {
  const hasFolders = Array.isArray(folders) && folders.length > 0;
  folderPicker.hidden = !hasFolders;
  if (!hasFolders) return;
  const byParent = new Map();
  for (const folder of folders) {
    const key = folder.parentId || "";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(folder);
  }
  folderSelect.replaceChildren();
  const add = (value, label) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    folderSelect.append(option);
  };
  add("", "بدون پوشه");
  const walk = (parentId, depth) => {
    for (const folder of byParent.get(parentId) || []) {
      add(folder.id, `${depth ? "↳ " : ""}${folder.name}`);
      walk(folder.id, depth + 1);
    }
  };
  walk("", 0);
  folderSelect.value = defaultFolderId || "";
}

async function refresh() {
  const state = await send({ type: "SESSION" });
  showUser(state.user);
  siteState.dataset.apiBase = state.apiBase || "";
  siteState.textContent = await activeSite();
  showFolders(state.folders, state.defaultFolderId);
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

folderSelect.addEventListener("change", async () => {
  await send({ type: "SET_DEFAULT_FOLDER", folderId: folderSelect.value });
  const name = folderSelect.selectedOptions[0]?.textContent || "";
  folderSelect.dataset.saved = name;
});

logout.addEventListener("click", async () => {
  await send({ type: "LOGOUT" });
  await refresh();
});

refresh();
