(function () {
  const faDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arDigits = "٠١٢٣٤٥٦٧٨٩";
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const text = (node) => (node?.textContent || "").replace(/\s+/g, " ").trim();
  const normalizeDigits = (value) => String(value || "")
    .replace(/[۰-۹]/g, (digit) => String(faDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arDigits.indexOf(digit)));
  const numberFrom = (value) => {
    const input = normalizeDigits(value).replace(/[,،]/g, "").replace(/٫/g, ".");
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
  const waitFor = async (predicate, timeout = 2500) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const result = predicate();
      if (result) return result;
      await wait(80);
    }
    return null;
  };
  const shortHash = (value) => {
    let hash = 5381;
    for (let index = 0; index < value.length; index += 1) hash = (hash * 33) ^ value.charCodeAt(index);
    return (hash >>> 0).toString(36);
  };
  const isKashanoImage = (value) => {
    try {
      const url = new URL(value, location.href);
      return /^https?:$/i.test(url.protocol) && /(^|\.)pics\.kashano\.ir$/i.test(url.hostname);
    } catch {
      return false;
    }
  };
  const imageUrl = (node) => {
    const value = node?.currentSrc || node?.src || node?.getAttribute("data-src");
    return value && !/^data:image\//i.test(value) && isKashanoImage(value)
      ? new URL(value, location.href).href
      : null;
  };
  const imagesIn = (root) => [...root.querySelectorAll("img")].map(imageUrl).filter(Boolean);
  const closeGallery = (root) => {
    const close = [...root.querySelectorAll("button")].find((node) => text(node) === "بستن");
    if (close) close.click();
  };
  const propertyModal = () => [...document.querySelectorAll(".fixed")]
    .map((node) => node.querySelector(".z-6000") || node)
    .find((node) => text(node).includes("کد ملک:") && node.querySelector("[class*='lead-spec-item-title']"));
  const extractGallery = async (card, report) => {
    const seen = new Set(imagesIn(card));
    const galleryButton = [...card.querySelectorAll("button")].find((node) => /تصاویر ملک/.test(text(node)));
    if (!galleryButton) return [...seen];
    galleryButton.click();
    const gallery = await waitFor(() => {
      const candidate = [...document.querySelectorAll("img")].find((node) => imageUrl(node));
      return candidate?.closest("div") ? document.body : null;
    });
    if (!gallery) return [...seen];
    for (let step = 0; step < 30; step += 1) {
      imagesIn(document).forEach((image) => seen.add(image));
      report(`دریافت تصاویر (${seen.size})`);
      const next = [...document.querySelectorAll("button")].find((node) => /^بعدی/.test(text(node)));
      if (!next || next.disabled || next.classList.contains("cursor-not-allowed")) break;
      next.click();
      await wait(120);
    }
    closeGallery(document);
    return [...seen];
  };
  const field = (root, label) => {
    const title = [...root.querySelectorAll("[class*='lead-spec-item-title']")]
      .find((node) => text(node) === label);
    return text(title?.nextElementSibling);
  };
  const hasField = (root, label) => {
    const title = [...root.querySelectorAll("[class*='lead-spec-item-title']")]
      .find((node) => text(node) === label);
    return Boolean(title?.nextElementSibling && (text(title.nextElementSibling) || title.nextElementSibling.querySelector("svg")));
  };
  const labeledValue = (root, label) => {
    const node = [...root.querySelectorAll("span")].find((item) => text(item) === label);
    return text(node?.nextElementSibling);
  };
  const propertyType = (value) => {
    const known = ["آپارتمان", "خانه", "ویلا", "مغازه", "دفتر", "زمین", "کلنگی", "انبار", "باغ"];
    return known.find((item) => value.includes(item)) || "سایر";
  };
  const adapter = {
    id: "kashano",
    canHandle: () => location.hostname === "kashano.ir" || location.hostname.endsWith(".kashano.ir"),
    findPropertyCards: () => {
      const modal = propertyModal();
      return modal ? [modal] : [];
    },
    async extractProperty(card, report = () => {}) {
      let root = card;
      let openedModal = false;
      if (!field(root, "نوع قرارداد")) {
        const detailsButton = [...card.querySelectorAll("button")].find((node) => /اطلاعات ملک/.test(text(node)));
        if (detailsButton) detailsButton.click();
        root = await waitFor(propertyModal);
        if (!root) throw new Error("پنجره اطلاعات ملک کاشانو باز نشد");
        openedModal = true;
      }
      const allText = text(root);
      const title = `${field(root, "نوع قرارداد")} ${field(root, "نوع ملک")} ${field(root, "زیربنا")} متری`.trim();
      const contract = field(root, "نوع قرارداد") || field(root, "وضعیت ملک") || allText;
      const transactionType = /اجاره|رهن/.test(contract) ? "RENT" : "SALE";
      const area = numberFrom(field(root, "زیربنا"));
      if (!area) throw new Error("متراژ ملک کاشانو پیدا نشد؛ صفحه کامل بارگذاری نشده است");
      const code = normalizeDigits(labeledValue(root, "کد ملک:") || (allText.match(/کد ملک:\s*([\d۰-۹٠-٩]+)/) || [])[1] || "");
      const address = labeledValue(root, "آدرس:") || "آدرس از آگهی دریافت نشد";
      const priceText = field(root, "قیمت کل") || "";
      const rentText = field(root, "اجاره") || field(root, "اجاره ماهانه") || "";
      const mortgageText = field(root, "رهن") || field(root, "ودیعه") || "";
      const description = (allText.match(/توضیحات:\s*(.*?)(?=تصاویر ملک|مشتریان ملک|ثبت یادداشت|$)/) || [])[1]?.trim() || "";
      const identity = [code, address, area, priceText, rentText, mortgageText].join("|");
      report("دریافت اطلاعات ملک");
      const images = await extractGallery(root, report);
      const result = {
        title: title || "ملک کاشانو",
        transactionType,
        propertyType: propertyType(field(root, "نوع ملک") || allText),
        city: (address.match(/^([^،,]+)/) || [])[1] || "تهران",
        district: "",
        neighborhood: address.split("،")[1]?.trim() || "نامشخص",
        address,
        area,
        bedrooms: numberFrom(field(root, "خواب")),
        floor: numberFrom(field(root, "طبقه")),
        buildingAge: numberFrom(field(root, "سن بنا")),
        salePrice: transactionType === "SALE" ? numberFrom(priceText) : 0,
        mortgagePrice: transactionType === "RENT" ? numberFrom(mortgageText) : 0,
        rentPrice: transactionType === "RENT" ? numberFrom(rentText) : 0,
        isConvertible: /قابل تبدیل/.test(allText) && !/غیر قابل تبدیل/.test(allText),
        description: description.slice(0, 9000),
        ownerName: labeledValue(root, "مالک:") || undefined,
        parking: hasField(root, "پارکینگ"),
        storage: hasField(root, "انباری اختصاصی"),
        elevator: hasField(root, "آسانسور"),
        balcony: hasField(root, "بالکن"),
        phone: phoneFrom(labeledValue(root, "شماره مالک:") || allText),
        source: "kashano",
        sourceUrl: `${location.href.split("#")[0]}#kashano-${code || shortHash(identity)}`,
        images,
      };
      if (openedModal) closeGallery(propertyModal() || document);
      return result;
    },
  };
  if (adapter.canHandle()) window.AshianKashanoAdapter = adapter;
})();
