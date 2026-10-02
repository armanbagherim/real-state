(function () {
  const faDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arDigits = "٠١٢٣٤٥٦٧٨٩";
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const text = (node) => (node?.textContent || "").replace(/\s+/g, " ").trim();
  /** Same as `text` but keeps line breaks, so ad descriptions survive intact. */
  const blockText = (node) =>
    String(node?.textContent || "")
      .replace(/\r/g, "")
      .split("\n")
      .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
      .filter(Boolean)
      .join("\n");
  const normalizeDigits = (value) =>
    String(value || "")
      .replace(/[۰-۹]/g, (digit) => String(faDigits.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String(arDigits.indexOf(digit)));
  const numberFrom = (value) => {
    const input = normalizeDigits(value)
      .replace(/[,،]/g, "")
      .replace(/٫/g, ".");
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
  const closeDialog = () => {
    const close = document.querySelector(
      '[role="dialog"] button[aria-label*="بستن"], [role="dialog"] button[aria-label*="close" i], [role="dialog"] button[title*="بستن"], [data-testid="close-button"]',
    );
    if (close) {
      close.click();
      return true;
    }
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        bubbles: true,
      }),
    );
    return false;
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
  const imageUrl = (node) => {
    const value =
      node?.currentSrc || node?.src || node?.getAttribute("data-src");
    if (!value || /^data:image\//i.test(value) || /mapimage/i.test(value))
      return null;
    try {
      const url = new URL(value, location.href).href;
      return /^https?:\/\//i.test(url) ? url : null;
    } catch {
      return null;
    }
  };
  const imagesIn = (root) =>
    [
      ...root.querySelectorAll(
        'img[data-testid="image-element"], img.kt-image-block__image',
      ),
    ]
      .map(imageUrl)
      .filter((url) => url && !/webp_thumbnail/i.test(url));
  const rows = (root) =>
    [
      ...root.querySelectorAll(
        '[data-testid="unexpandable-info-row"], .kt-unexpandable-row',
      ),
    ]
      .map((row) => ({
        title: text(row.querySelector(".kt-unexpandable-row__title")),
        value: text(
          row.querySelector(
            ".kt-unexpandable-row__value, .kt-unexpandable-row__action",
          ),
        ),
      }))
      .filter((row) => row.title && row.value);
  const groupValue = (root, label) => {
    const group = [...root.querySelectorAll(".kt-group-row")].find((node) =>
      [
        ...node.querySelectorAll(
          ".kt-group-row__heading .kt-group-row-item__title",
        ),
      ].some((node) => text(node) === label),
    );
    if (!group) return "";
    const headers = [
      ...group.querySelectorAll(
        ".kt-group-row__heading .kt-group-row-item__title",
      ),
    ];
    const index = headers.findIndex((node) => text(node) === label);
    const values = group.querySelectorAll(
      ".kt-group-row__data-row .kt-group-row-item__value",
    );
    return index >= 0 ? text(values[index]) : "";
  };
  /**
   * Divar writes absent amenities as "آسانسور ندارد" / "پارکینگ ندارد", so a bare
   * substring test would report every listing as having everything. This returns
   * true only when the word appears without a negation right after it.
   */
  const NEGATION =
    /^\s*(ندارد|ندار[ه‌]?|نیست|نده|نمی[\u200c ]*باشد|نمی[\u200c ]*شه|غیر[\u200c ]*فعال)/;
  const hasAmenity = (haystack, word) => {
    let index = haystack.indexOf(word);
    while (index !== -1) {
      const after = haystack.slice(
        index + word.length,
        index + word.length + 12,
      );
      if (!NEGATION.test(after)) return true;
      index = haystack.indexOf(word, index + word.length);
    }
    return false;
  };
  /**
   * Divar renders amenities as a `kt-group-row` whose header cells carry a
   * `data-icon` and whose value cell says "پارکینگ" or "پارکینگ ندارد". Reading
   * that table is far more reliable than scanning prose.
   */
  const AMENITY_ICONS = {
    elevator: "elevator",
    parking: "parking",
    cabinet: "storage",
    balcony: "balcony",
    terrace: "balcony",
  };
  const amenityTable = (root) => {
    const found = {};
    for (const group of root.querySelectorAll(".kt-group-row")) {
      const headerCells = [
        ...group.querySelectorAll(".kt-group-row__heading .kt-group-row-item"),
      ];
      const valueCells = [
        ...group.querySelectorAll(".kt-group-row__data-row .kt-group-row-item"),
      ];
      headerCells.forEach((cell, index) => {
        const icon = cell.querySelector("[data-icon]");
        if (!icon) return;
        const key = AMENITY_ICONS[icon.getAttribute("data-icon") || ""];
        const cell_ = valueCells[index];
        if (!key || !cell_) return;
        const label = text(cell_);
        if (!label) return;
        found[key] = !NEGATION.test(label.replace(/^[^\s:]+[\s:]*\s*/, ""));
      });
    }
    return found;
  };

  /**
   * The page has two `.kt-description-row__text` nodes: the publish-date line in
   * the collapsed info row, and the seller's real description further down.
   * Pick by content, not by DOM order, and fall back to the longest candidate.
   */
  const descriptionOf = (root) => {
    const candidates = [
      ...root.querySelectorAll(
        ".kt-description-row__text, [data-testid='description']",
      ),
    ]
      .map(blockText)
      .filter(Boolean)
      .filter((value) => !/^انتشار آگهی\s*:/.test(value))
      .filter(
        (value) => !/^آخرین به[\u200c]?روز[\u200c]?رسانی\s*:/.test(value),
      );
    if (!candidates.length) return "";
    return candidates.reduce((best, value) =>
      value.length > best.length ? value : best,
    );
  };

  const transactionType = (value) =>
    /اجاره|رهن/.test(value) ? "RENT" : "SALE";
  const propertyType = (value) => {
    if (/ویلا/.test(value)) return "ویلا";
    if (/زمین/.test(value)) return "زمین";
    if (/مغازه|فروشگاه/.test(value)) return "مغازه";
    if (/دفتر|اداری|مطب/.test(value)) return "دفتر";
    if (/خانه/.test(value)) return "خانه";
    return "آپارتمان";
  };

  const adapter = {
    id: "divar",
    canHandle: () =>
      location.hostname === "divar.ir" ||
      location.hostname.endsWith(".divar.ir"),
    findPropertyCards: () => {
      const main = document.querySelector("main");
      return main ? [main] : [];
    },
    async extractProperty(card, report = () => {}) {
      const title =
        text(card.querySelector('[data-testid="title"], h1')) ||
        text(document.querySelector('meta[property="og:title"]'));
      if (!title) throw new Error("عنوان آگهی دیوار پیدا نشد");
      const allText = text(card);
      const area = numberFrom(groupValue(card, "متراژ"));
      const bedrooms = numberFrom(groupValue(card, "اتاق"));
      const builtYear = numberFrom(groupValue(card, "ساخت"));
      if (!area)
        throw new Error(
          "متراژ آگهی دیوار پیدا نشد؛ صفحه کامل بارگذاری نشده است",
        );

      const type = transactionType(`${title} ${allText}`);
      const priceRows = rows(card);
      const deposit =
        priceRows.find((row) => /ودیعه/.test(row.title))?.value || "";
      const rent =
        priceRows.find(
          (row) => /اجاره/.test(row.title) && !/ودیعه/.test(row.title),
        )?.value || "";
      const sale =
        priceRows.find((row) => /قیمت|فروش/.test(row.title))?.value || "";
      const floor = numberFrom(
        priceRows.find((row) => /طبقه/.test(row.title))?.value || "",
      );
      const convertible = !priceRows.some(
        (row) =>
          /ودیعه و اجاره/.test(row.title) && /غیر قابل تبدیل/.test(row.value),
      );
      const description = descriptionOf(card) || allText;
      const visibleDetails = priceRows
        .filter((row) => row.title && row.value)
        .map((row) => `${row.title}: ${row.value}`)
        .join("\n");
      const tableAmenities = amenityTable(card);
      const amenities = {
        parking: tableAmenities.parking ?? hasAmenity(allText, "پارکینگ"),
        storage: tableAmenities.storage ?? hasAmenity(allText, "انباری"),
        elevator: tableAmenities.elevator ?? hasAmenity(allText, "آسانسور"),
        balcony:
          tableAmenities.balcony ??
          (hasAmenity(allText, "بالکن") || hasAmenity(allText, "تراس")),
      };
      const seenImages = new Set(imagesIn(card));
      for (let step = 0; step < 20; step += 1) {
        const next = [
          ...card.querySelectorAll('button[aria-label*="تصویر"]'),
        ].find((node) => !node.dataset.ashianClicked);
        if (!next) break;
        next.dataset.ashianClicked = "true";
        next.click();
        await wait(180);
        imagesIn(card).forEach((image) => seenImages.add(image));
        report(`دریافت تصاویر (${seenImages.size})`);
      }
      const phoneButton = [...card.querySelectorAll("button")].find((node) =>
        /اطلاعات تماس|نمایش شماره/.test(text(node)),
      );
      const contactPhone = () => {
        const contactRow = rows(card).find((row) =>
          /شمارهٔ? موبایل|شماره موبایل/.test(row.title),
        );
        return phoneFrom(contactRow?.value);
      };
      let phone = contactPhone();
      if (phoneButton) {
        phoneButton.click();
        phone = await waitFor(contactPhone, 1800);
        if (closeDialog()) await wait(120);
        if (phone) report("شماره دریافت شد");
      }
      const city = text(
        card.querySelector(".kt-breadcrumbs__action-text"),
      )?.includes("تهران")
        ? "تهران"
        : "تهران";
      const district =
        text(card.querySelectorAll(".kt-breadcrumbs__action-text")[3]) || "";
      return {
        title,
        transactionType: type,
        propertyType: propertyType(allText),
        city,
        district,
        neighborhood: district || "نامشخص",
        address: district ? `${city}، ${district}` : `آگهی دیوار: ${title}`,
        area,
        bedrooms,
        floor,
        buildingAge: builtYear ? Math.max(0, 1405 - builtYear) : 0,
        salePrice: type === "SALE" ? numberFrom(sale) : 0,
        mortgagePrice: type === "RENT" ? numberFrom(deposit) : 0,
        rentPrice: type === "RENT" ? numberFrom(rent) : 0,
        isConvertible: convertible,
        description: `${description}${
          visibleDetails ? `\n\nاطلاعات آگهی دیوار:\n${visibleDetails}` : ""
        }`.slice(0, 9000),
        parking: amenities.parking,
        storage: amenities.storage,
        elevator: amenities.elevator,
        balcony: amenities.balcony,
        phone,
        source: "divar",
        sourceUrl: location.href,
        images: [...seenImages],
      };
    },
  };
  if (adapter.canHandle()) window.AshianSiteAdapter = adapter;
  // Exposed so the parsing rules can be unit-tested without a live divar page.
  window.AshianDivarParse = {
    blockText,
    descriptionOf,
    amenityTable,
    hasAmenity,
    NEGATION,
  };
})();
