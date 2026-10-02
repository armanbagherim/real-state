(function () {
  const adapter = [window.AshianSiteAdapter, window.AshianAmlakPlusAdapter, window.AshianKashanoAdapter]
    .find((candidate) => candidate?.canHandle?.());
  if (!adapter?.canHandle()) return;
  const buttonClass = "ashian-import-property";
  const statusLabels = { ready: "افزودن به آشیان", extracting: "در حال استخراج…", importing: "در حال ثبت…", success: "✓ اضافه شد", duplicate: "قبلاً ثبت شده", error: "خطا؛ تلاش مجدد" };
  const setLabel = (button, state) => {
    button.dataset.state = state;
    button.innerHTML = `<span class="ashian-import-property__label">${statusLabels[state] || state}</span>`;
    button.setAttribute("aria-label", statusLabels[state] || state);
  };
  const report = (button, state) => {
    setLabel(button, state);
  };
  const addButton = (card) => {
    if (card.dataset.ashianImportReady === "true") return;
    card.dataset.ashianImportReady = "true";
    card.classList.add("ashian-import-host");
    const button = document.createElement("button");
    button.type = "button";
    button.className = buttonClass;
    setLabel(button, "ready");
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (["extracting", "importing", "success", "duplicate"].includes(button.dataset.state)) return;
      try {
        report(button, "extracting");
        const property = await adapter.extractProperty(card, (message) => { button.dataset.progress = message; });
        report(button, "importing");
        const response = await chrome.runtime.sendMessage({ type: "IMPORT_PROPERTY", property });
        if (!response?.ok) {
          if (response?.status === 401) throw new Error("ابتدا از پنجره افزونه وارد آشیان شوید");
          if (response?.status === 404) throw new Error("API افزونه روی آدرس آشیان deploy نشده است");
          if (response?.status === 409 || response?.body?.duplicate) {
            report(button, "duplicate");
            button.title = response.body.property?.fileCode ? `فایل ${response.body.property.fileCode}` : "این ملک قبلاً وارد شده است";
            return;
          }
          throw new Error(response?.body?.error || response?.error || "ثبت انجام نشد");
        }
        report(button, "success");
        button.title = `فایل ${response.body.property.fileCode} ثبت شد`;
      } catch (error) {
        report(button, "error");
        button.title = error.message || "خطا در import";
        console.warn("[Ashian Extension] Import failed", error);
      }
    });
    card.append(button);
  };
  const scan = () => adapter.findPropertyCards().forEach(addButton);
  scan();
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "SITE_STATE") {
      sendResponse({ cards: adapter.findPropertyCards().length, site: adapter.id });
    }
  });
  const observer = new MutationObserver(() => scan());
  observer.observe(document.body, { childList: true, subtree: true });
  console.info(`[Ashian Extension] ${adapter.id} adapter ready`);
})();
