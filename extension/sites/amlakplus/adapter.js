(function () {
  const faDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arDigits = "٠١٢٣٤٥٦٧٨٩";
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const text = (node) => (node?.textContent || "").replace(/\s+/g, " ").trim();
  const normalizeDigits = (value) => String(value || "")
    .replace(/[۰-۹]/g, (digit) => String(faDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arDigits.indexOf(digit)));
  const numberFrom = (value) => {
    const input = normalizeDigits(value).replace(/,/g, "").replace(/٫/g, ".");
    const match = input.match(/\d+(?:\.\d+)?/);
    if (!match) return 0;
    const amount = Number(match[0]);
    if (/میلیارد|billion/i.test(input)) return Math.round(amount * 1e9);
    if (/میلیون|million/i.test(input)) return Math.round(amount * 1e6);
    if (/هزار|thousand/i.test(input)) return Math.round(amount * 1e3);
    return Math.round(amount);
  };
  const phoneFrom = (value) => {
    const normalized = normalizeDigits(value).replace(/\D/g, "");
    const match = normalized.match(/09\d{9,10}/);
    return match ? match[0] : null;
  };
  const imageFromStyle = (value) => {
    const match = String(value || "").match(/url\(["']?([^"')]+)["']?\)/i);
    if (!match || /^data:image\//i.test(match[1]) || /placeholder/i.test(match[1])) return null;
    try {
      const url = new URL(match[1], location.href).href;
      return /^https?:/i.test(url) ? url : null;
    } catch {
      return null;
    }
  };
  const imagesIn = (root) => [...root.querySelectorAll(".v-image__image--cover, .v-image__image--contain")]
    .map((node) => imageFromStyle(node.getAttribute("style")))
    .filter(Boolean);
  const waitFor = async (predicate, timeout = 2500) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const result = predicate();
      if (result) return result;
      await wait(80);
    }
    return null;
  };
  const counter = (root) => {
    const match = text(root).match(/(\d+)\s*[\/:／]\s*(\d+)/);
    return match ? { total: Number(match[1]), current: Number(match[2]) } : null;
  };
  const shortHash = (value) => {
    let hash = 5381;
    for (let index = 0; index < value.length; index += 1)
      hash = (hash * 33) ^ value.charCodeAt(index);
    return (hash >>> 0).toString(36);
  };

  const closeDialog = (dialog) => {
    const close = dialog?.querySelector(
      ".gallery__close, button[aria-label*='بستن'], .mdi-close, .mdi-close-circle, .mdi-close-thick",
    );
    if (close) {
      close.click();
      return true;
    }
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }),
    );
    return false;
  };

  const activeImage = (root) => {
    const slide = [...root.querySelectorAll(".v-window-item")]
      .find((node) => !/display\s*:\s*none/i.test(node.getAttribute("style") || ""));
    return imageFromStyle(slide?.querySelector(".v-image__image--contain")?.getAttribute("style"));
  };

  const clickAndWaitForSlide = async (button, before, dialog) => {
    if (!button) return false;
    button.click();
    return Boolean(await waitFor(() => {
      const state = counter(dialog);
      return state && state.current !== before.current ? state : null;
    }, 2500));
  };

  async function extractGallery(card, report) {
    const images = [...new Set(imagesIn(card))];
    const gallery = card.querySelector(".gallery");
    if (!gallery) return images;
    gallery.click();
    const dialog = await waitFor(() => document.querySelector(".v-dialog__content.v-dialog__content--active .estate-gallery-dialog, .estate-gallery-dialog"));
    if (!dialog) return images;
    try {
      const seen = new Set(images);
      let state = counter(dialog);
      const previousButton = dialog.querySelector('.v-window__prev button, button[aria-label*="اسلاید قبلی"], [aria-label*="اسلاید قبلی"]');
      const nextButton = dialog.querySelector('.v-window__next button, button[aria-label*="اسلاید بعدی"], [aria-label*="اسلاید بعدی"]');
      if (state) {
        for (let step = 0; step < state.total && state.current > 1; step += 1) {
          if (!(await clickAndWaitForSlide(previousButton, state, dialog))) break;
          state = counter(dialog) || state;
        }
      }
      for (let step = 0; step < 30; step += 1) {
        state = counter(dialog) || state;
        imagesIn(dialog).forEach((image) => seen.add(image));
        const current = activeImage(dialog);
        if (current) seen.add(current);
        report(`دریافت تصاویر ${state ? `${Math.min(state.current, state.total)}/${state.total}` : step + 1}`);
        if (!state || state.current >= state.total) break;
        if (!(await clickAndWaitForSlide(nextButton, state, dialog))) break;
      }
      return [...seen];
    } finally {
      closeDialog(dialog);
    }
  }

  async function revealDetails(card) {
    if (card.querySelector(".description__text")) return;
    const button = [...card.querySelectorAll("button")].find((node) => /توضیحات بیشتر/.test(text(node)));
    if (!button) return;
    button.click();
    await waitFor(() => card.querySelector(".description__text"), 1800);
  }

  async function extractPhone(card, report) {
    const actions = card.querySelector("[can-get-phone]") || card;
    const button = [...actions.querySelectorAll("button, a")].find((node) =>
      /نمایش\s*شماره/.test(text(node)),
    );
    if (!button) return null;
    button.click();
    // The phone sheet is a Vuetify bottom sheet: `.v-dialog--active` with a
    // `.bottom-sheet-panel__body`, and it carries no role="dialog".
    const dialog = await waitFor(() => {
      const sheets = [
        ...document.querySelectorAll(".v-dialog--active .bottom-sheet-panel, .bottom-sheet-panel"),
      ];
      // The topmost sheet is the one this click just opened.
      const top = sheets.filter((node) => /نمایش\s*شماره/.test(text(node))).at(-1);
      return top ?? null;
    });
    const phone = await waitFor(() => {
      const body = dialog?.querySelector(".bottom-sheet-panel__body") || dialog;
      return (
        phoneFrom(text(body)) ||
        [...actions.querySelectorAll(".v-btn__content, button, a")]
          .map((node) => phoneFrom(text(node)))
          .find(Boolean) ||
        null
      );
    });
    closeDialog(dialog);
    if (phone) report("شماره دریافت شد");
    return phone;
  }

  function metadata(card) {
    const metaRoot = card.querySelector(".meta") || card;
    const meta = text(metaRoot);
    const area = Number((normalizeDigits(meta).match(/(\d+(?:\.\d+)?)\s*متر/) || [])[1] || 0);
    const bedrooms = Number((normalizeDigits(meta).match(/(\d+)\s*خواب/) || [])[1] || 0);
    const floor = Number((normalizeDigits(meta).match(/طبقه\s*(\d+)/) || [])[1] || 0);
    const builtYear = [...metaRoot.querySelectorAll("*")]
      .map((node) => normalizeDigits(text(node)))
      .find((value) => /^(13|14)\d{2}$/.test(value));
    const nowYear = Number(new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" }).format(new Date()).replace(/\D/g, "")) || 1405;
    return { area, bedrooms, floor, buildingAge: builtYear ? Math.max(0, nowYear - Number(builtYear)) : 0 };
  }

  function prices(card, transactionType) {
    const value = text(card.querySelector(".estate-box__price") || card);
    const amounts = value.match(/[\d۰-۹٠-٩]+(?:[.,٫]\d+)?\s*(?:میلیارد|میلیون|هزار)?\s*تومان?/g) || [];
    const numbers = amounts.map(numberFrom);
    if (transactionType === "SALE") return { salePrice: numbers[0] || 0, mortgagePrice: 0, rentPrice: 0 };
    return { salePrice: 0, mortgagePrice: numbers[0] || 0, rentPrice: numbers[1] || 0 };
  }

  const propertyType = (value) => {
    const known = ["آپارتمان", "خانه", "ویلا", "مغازه", "دفتر", "زمین", "کلنگی", "انبار"];
    return known.find((item) => value.includes(item)) || "سایر";
  };

  const adapter = {
    id: "amlakplus",
    canHandle: () => location.hostname.includes("amlakplus"),
    findPropertyCards: () => [...document.querySelectorAll(".estate-box")],
    async extractProperty(card, report = () => {}) {
      await revealDetails(card);
      const title = text(card.querySelector(".estate-box__main-info h3, h3"));
      if (!title) throw new Error("عنوان ملک پیدا نشد");
      const region = text(card.querySelector(".estate-box__region"));
      const regionClean = region
        .replace(/خرید|فروش|رهن|اجاره/g, "")
        .replace(/[\s،,]+$/, "")
        .trim();
      const full = text(card);
      const transactionType = /رهن|اجاره/.test(region + full) ? "RENT" : "SALE";
      const details = metadata(card);
      if (!details.area) throw new Error("متراژ ملک پیدا نشد");
      const sourceLink = [...card.querySelectorAll("a[href]")].find((node) => !/^javascript:/i.test(node.href));
      const fileCode = (full.match(/کدs*فایل\s*[:：]?\s*([\d۰-۹٠-٩]+)/) || [])[1];
      report("دریافت اطلاعات ملک");
      const images = await extractGallery(card, report);
      const phone = await extractPhone(card, report);
      const description = text(card.querySelector(".description__text")) || full;
      const ownerMatch = full.match(/نام مالک\s*:\s*([^\n]+?)(?=وضعیت سند|$)/);
      const has = (label) => new RegExp(label).test(full);
      const price = prices(card, transactionType);
      // The dedup key has to identify the card, not the page or one of its
      // images: a bare listing path collides across every card on a listing,
      // and a CDN image URL is not a stable identity.
      const detailLink =
        sourceLink && new URL(sourceLink.href, location.href).pathname !== location.pathname
          ? sourceLink.href
          : null;
      const identity = [
        title,
        regionClean,
        details.area,
        price.salePrice,
        price.mortgagePrice,
        price.rentPrice,
      ].join("|");
      const stableSourceUrl =
        detailLink ||
        (fileCode
          ? new URL(`/estates#file-${normalizeDigits(fileCode)}`, location.origin).href
          : `${location.href.split("#")[0]}#${shortHash(identity)}`);
      return {
        title,
        transactionType,
        propertyType: propertyType(full),
        city: "تهران",
        district: "",
        neighborhood: regionClean || "نامشخص",
        address: "آدرس از آگهی دریافت نشد",
        ...details,
        ...price,
        isConvertible: false,
        description: description.slice(0, 9000),
        ownerName: ownerMatch?.[1]?.trim(),
        parking: has("پارکینگ"),
        storage: has("انباری"),
        elevator: has("آسانسور"),
        balcony: has("تراس|بالکن"),
        phone,
        source: "amlakplus",
        sourceUrl: stableSourceUrl,
        images,
      };
    },
  };
  window.AshianAmlakPlusAdapter = adapter;
})();
