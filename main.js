function setActiveNav() {
  const path = (location.pathname || "/").replace(/\/+$/, "") || "/";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    const target = href.replace(/\/+$/, "") || "/";
    let active = false;
    if (target === "/") {
      active = path === "/";
    } else if (path === target) {
      active = true;
    } else if (target === "/services" && path === "/service") {
      active = true;
    } else if (target === "/projects" && path === "/project") {
      active = true;
    } else if (target === "/about" && path === "/founder") {
      active = true;
    }
    link.classList.toggle("active", active);
  });
}

function setupMenuToggle() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  function closeMenu() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("is-open")) return;
    if (toggle.contains(e.target) || nav.contains(e.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) closeMenu();
  });
}

var revealObserver = null;

function setupRevealAnimations() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    document.querySelectorAll(".reveal-in").forEach((el) => el.classList.add("is-visible"));
    return;
  }
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { threshold: 0.08, rootMargin: "40px 0px" }
  );
  observeRevealElements();
}

function observeRevealElements() {
  if (!revealObserver) return;
  const selector = "main .section-title, main .card, main .contact-item, main .grid .card, .featured-project .card";
  document.querySelectorAll(selector).forEach((el) => {
    if (el.closest(".hero")) return;
    if (!el.classList.contains("reveal-in")) el.classList.add("reveal-in");
    revealObserver.observe(el);
  });
}

function renderHome(content) {
  const title = document.getElementById("home-title");
  const subtitle = document.getElementById("home-subtitle");
  const intro = document.getElementById("home-intro");
  const cta = document.getElementById("home-cta");

  if (title) title.textContent = content.home.title;
  if (subtitle) subtitle.textContent = content.home.subtitle;
  if (intro) intro.textContent = content.home.intro;
  if (cta) {
    cta.textContent = content.home.ctaText;
    cta.href = content.home.ctaLink || "/services";
  }
}

function renderServices(content) {
  const list = document.getElementById("services-list");
  if (!list) return;
  list.innerHTML = "";
  const services = Array.isArray(content.services) ? content.services : [];
  services.forEach((service) => {
    const title = (service.title || "").trim() || "Leistung";
    const desc = service.description || "";
    const detailUrl = "/service?title=" + encodeURIComponent(title);
    const orderUrl = "/contacts?service=" + encodeURIComponent(title) + "#order-section";
    const item = document.createElement("article");
    item.className = "card service-card";
    item.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(desc)}</p>
      <div class="service-card-actions">
        <a class="button secondary service-btn-detail" href="${detailUrl}">Mehr erfahren</a>
        <a class="button service-btn-order" href="${orderUrl}">Bestellen</a>
      </div>
    `;
    list.appendChild(item);
  });
}

function renderServiceDetailPage(content) {
  const block = document.getElementById("service-detail");
  if (!block) return;
  const params = new URLSearchParams(location.search);
  const titleParam = params.get("title");
  const services = Array.isArray(content.services) ? content.services : [];
  const service = titleParam ? services.find((s) => (s.title || "").trim() === titleParam.trim()) : null;
  if (!service) {
    block.innerHTML = `
      <p class="service-detail-notfound">Leistung nicht gefunden.</p>
      <a class="button" href="/services">Alle Leistungen</a>
    `;
    document.title = "Leistung nicht gefunden - " + (content.siteName || "OrzuIT");
    setMetaDescription(
      "Die angeforderte Leistung ist nicht verfügbar. Übersicht aller Dienstleistungen für Webentwicklung und Web-Apps – " +
        (content.siteName || "OrzuIT") +
        "."
    );
    return;
  }
  const title = (service.title || "").trim() || "Leistung";
  const description = service.description || "";
  const details = service.details != null ? String(service.details) : "";
  block.innerHTML = `
    <a class="service-detail-back" href="/services">← Leistungen</a>
    <h1 class="service-detail-title">${escapeHtml(title)}</h1>
    ${description ? `<p class="service-detail-lead">${escapeHtml(description)}</p>` : ""}
    <div class="service-detail-body">${details ? escapeHtml(details).replace(/\n/g, "<br>") : "<p class=\"muted\">Keine weiteren Details.</p>"}</div>
    <a class="button" href="/contacts?service=${encodeURIComponent(title)}#order-section">Jetzt anfragen</a>
  `;
  document.title = title + " – Leistung | " + (content.siteName || "OrzuIT");
  const metaDesc = [description, details].filter(Boolean).join(" ").trim() || title;
  setMetaDescription(metaDesc + " · " + (content.siteName || "OrzuIT"));
  try {
    setCanonicalUrl(`${location.origin}/service?title=${encodeURIComponent(title)}`);
  } catch {
    // ignore
  }
}

function renderProjectDetailPage(content) {
  const block = document.getElementById("project-detail");
  if (!block) return;
  const params = new URLSearchParams(location.search);
  const nameParam = params.get("name");
  const projects = Array.isArray(content.projects) ? content.projects : [];
  const project = nameParam ? projects.find((p) => (p.name || "").trim() === nameParam.trim()) : null;
  if (!project) {
    block.innerHTML = `
      <p class="service-detail-notfound">Projekt nicht gefunden.</p>
      <a class="button" href="/projects">Alle Projekte</a>
    `;
    document.title = "Projekt nicht gefunden - " + (content.siteName || "OrzuIT");
    setMetaDescription(
      "Referenzprojekt nicht gefunden. Weitere Webprojekte und Case Studies – " + (content.siteName || "OrzuIT") + "."
    );
    return;
  }
  const name = (project.name || "").trim() || "Projekt";
  const description = project.description || "";
  const details = Array.isArray(project.details) ? project.details : [];
  const detailsHtml = details
    .filter((d) => (d.label || d.value))
    .map((d) => `<div class="project-detail-row"><span class="project-detail-label">${escapeHtml(d.label || "")}</span><span class="project-detail-value">${escapeHtml(d.value || "")}</span></div>`)
    .join("");
  const projectNumber = (project.number || "").trim();
  const projectLinkUrl = normalizeExternalUrl(project.link);
  const orderBtn = projectNumber
    ? `<a class="button" href="/contacts?project=${encodeURIComponent(projectNumber)}#order-section">Bestellen</a>`
    : "";
  const openBtn = projectLinkUrl
    ? `<a class="button secondary" href="${escapeHtml(projectLinkUrl)}" target="_blank" rel="noreferrer">Projekt öffnen</a>`
    : "";
  block.innerHTML = `
    <a class="service-detail-back" href="/projects">← Projekte</a>
    <h1 class="service-detail-title">${escapeHtml(name)}</h1>
    ${projectNumber ? `<p class="project-detail-number muted">Projektnummer: ${escapeHtml(projectNumber)}</p>` : ""}
    ${description ? `<p class="service-detail-lead">${escapeHtml(description)}</p>` : ""}
    ${detailsHtml ? `<div class="project-detail-body">${detailsHtml}</div>` : ""}
    <div class="project-detail-actions">${orderBtn} ${openBtn}</div>
  `;
  document.title = name + " – Referenzprojekt | " + (content.siteName || "OrzuIT");
  setMetaDescription(
    (description || "Referenzprojekt: " + name) + " · Webentwicklung für KMU · " + (content.siteName || "OrzuIT")
  );
  try {
    setCanonicalUrl(`${location.origin}/project?name=${encodeURIComponent(name)}`);
  } catch {
    // ignore
  }
}

function escapeHtml(s) {
  if (typeof s !== "string") return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function setMetaDescription(text) {
  const content = typeof text === "string" ? text.trim() : "";
  if (!content) return;
  let el = document.querySelector('meta[name="description"]');
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", "description");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content.length > 165 ? content.slice(0, 162).trimEnd() + "…" : content);
}

function setCanonicalUrl(absoluteUrl) {
  if (typeof absoluteUrl !== "string" || !absoluteUrl) return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", absoluteUrl);
}

function renderAbout(content) {
  const text = document.getElementById("about-text");
  const mission = document.getElementById("about-mission");
  if (text) text.textContent = content.about.text;
  if (mission) mission.textContent = content.about.mission;

  const founder = content.about && content.about.founder ? content.about.founder : null;
  const previewName = document.getElementById("founder-name");
  const previewRole = document.getElementById("founder-role");
  const previewBio = document.getElementById("founder-short-bio");
  const previewPhoto = document.getElementById("founder-photo");

  if (founder && previewName && previewRole && previewBio && previewPhoto) {
    previewName.textContent = founder.name || "";
    previewRole.textContent = founder.role || "";
    previewBio.textContent = founder.shortBio || "";
    if (founder.photoUrl) {
      previewPhoto.src = founder.photoUrl;
      previewPhoto.style.display = "block";
    } else {
      previewPhoto.style.display = "none";
    }
  }

  const fullName = document.getElementById("founder-name-full");
  const fullRole = document.getElementById("founder-role-full");
  const fullBio = document.getElementById("founder-full-bio");
  const fullPhoto = document.getElementById("founder-photo-full");
  const emailLink = document.getElementById("founder-email-link");
  const linkedInLink = document.getElementById("founder-linkedin-link");

  if (founder && fullName && fullRole && fullBio && fullPhoto) {
    fullName.textContent = founder.name || "Gründer";
    fullRole.textContent = founder.role || "";
    fullBio.textContent = founder.fullBio || founder.shortBio || "";
    if (founder.photoUrl) {
      fullPhoto.src = founder.photoUrl;
      fullPhoto.style.display = "block";
    } else {
      fullPhoto.style.display = "none";
    }

    if (emailLink) {
      if (founder.email) {
        emailLink.href = `mailto:${founder.email}`;
        emailLink.textContent = founder.email;
        emailLink.style.display = "inline-block";
      } else {
        emailLink.style.display = "none";
      }
    }

    if (linkedInLink) {
      if (founder.linkedin) {
        const href = /^https?:\/\//i.test(founder.linkedin)
          ? founder.linkedin
          : `https://www.linkedin.com/in/${founder.linkedin.replace(/^@/, "")}`;
        linkedInLink.href = href;
        linkedInLink.textContent = "LinkedIn Profil";
        linkedInLink.style.display = "inline-block";
      } else {
        linkedInLink.style.display = "none";
      }
    }

    const founderDetailsEl = document.getElementById("founder-details");
    if (founderDetailsEl && Array.isArray(founder.details)) {
      const rows = founder.details.filter((d) => d.label || d.value);
      founderDetailsEl.innerHTML = rows.length
        ? rows.map((d) => `<div class="project-detail-row"><span class="project-detail-label">${escapeHtml(d.label || "")}</span><span class="project-detail-value">${escapeHtml(d.value || "")}</span></div>`).join("")
        : "";
    }
  }
}

function renderContacts(content) {
  const list = document.getElementById("contacts-list");
  if (!list) return;
  list.innerHTML = "";
  const rows = [
    { label: "E-Mail", value: content.contacts.email, type: "email" },
    { label: "Telefon", value: content.contacts.phone, type: "phone" },
    { label: "Adresse", value: content.contacts.address, type: "address" },
    { label: "Telegram", value: content.contacts.telegram, type: "telegram" },
    { label: "Arbeitszeiten", value: content.contacts.workingHours, type: "text" }
  ];
  rows.forEach(({ label, value, type }) => {
    const item = document.createElement("div");
    item.className = "contact-item";
    const valueMarkup = createContactValueMarkup(type, value);
    item.innerHTML = `<span>${label}</span>${valueMarkup}`;
    list.appendChild(item);
  });
}

function createContactValueMarkup(type, value) {
  if (!value) return "<span>-</span>";
  const raw = String(value);
  const safeText = escapeHtml(raw);

  if (type === "email") {
    const addr = raw.trim();
    return `<a class="contact-link" href="mailto:${encodeURIComponent(addr)}">${safeText}</a>`;
  }

  if (type === "phone") {
    const phoneUri = raw.replace(/[^\d+]/g, "");
    return phoneUri
      ? `<a class="contact-link" href="tel:${phoneUri}">${safeText}</a>`
      : `<span>${safeText}</span>`;
  }

  if (type === "telegram") {
    let username = raw.replace(/^@/, "").trim().split(/[/?#]/)[0];
    username = username.replace(/[^\w]/g, "");
    if (!username) return `<span>${safeText}</span>`;
    return `<a class="contact-link" href="https://t.me/${username}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
  }

  if (type === "address") {
    const mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(raw)}`;
    return `<a class="contact-link" href="${escapeHtml(mapsLink)}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
  }

  return `<span>${safeText}</span>`;
}

function applyProjectsFilter() {
  const list = document.getElementById("projects-list");
  const categorySelect = document.getElementById("project-category-filter");
  const numberInput = document.getElementById("project-number-search");
  if (!list) return;
  const categoryVal = (categorySelect && categorySelect.value) || "";
  const numberVal = (numberInput && numberInput.value.trim()) || "";
  list.querySelectorAll(".project-card").forEach((card) => {
    const catMatch = !categoryVal || (card.dataset.categoryId === categoryVal);
    const numMatch = !numberVal || (card.dataset.projectNumber || "").indexOf(numberVal) !== -1;
    card.style.display = catMatch && numMatch ? "" : "none";
  });
}

function renderProjects(content) {
  const list = document.getElementById("projects-list");
  const filterWrap = document.getElementById("projects-filter");
  const categories = content.projectCategories || [];
  const projects = content.projects || [];

  if (filterWrap) {
    filterWrap.innerHTML = "";
    const searchLabel = document.createElement("label");
    searchLabel.textContent = "Projektnummer suchen: ";
    const numberInput = document.createElement("input");
    numberInput.type = "text";
    numberInput.id = "project-number-search";
    numberInput.placeholder = "z. B. 10001";
    numberInput.autocomplete = "off";
    searchLabel.appendChild(numberInput);
    filterWrap.appendChild(searchLabel);
    numberInput.addEventListener("input", applyProjectsFilter);
    numberInput.addEventListener("change", applyProjectsFilter);

    if (categories.length > 0) {
      const catLabel = document.createElement("label");
      catLabel.textContent = "Kategorie: ";
      const select = document.createElement("select");
      select.id = "project-category-filter";
      select.innerHTML = "<option value=\"\">Alle</option>";
      categories.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id || "";
        opt.textContent = c.name || "";
        select.appendChild(opt);
      });
      catLabel.appendChild(select);
      filterWrap.appendChild(catLabel);
      select.addEventListener("change", applyProjectsFilter);
    }
  }

  if (!list) return;
  list.innerHTML = "";
  projects.forEach((project) => {
    list.appendChild(createProjectCard(project, false, categories));
  });
}

function renderFeaturedProject(content) {
  const section = document.getElementById("featured-project-section");
  const card = document.getElementById("featured-project-card");
  if (!section || !card) return;

  const projects = Array.isArray(content.projects) ? content.projects : [];
  const categories = content.projectCategories || [];
  if (!projects.length) {
    section.hidden = true;
    return;
  }

  const mainProject = projects[0];
  section.hidden = false;
  card.innerHTML = "";
  card.appendChild(createProjectCard(mainProject, true, categories));
}

function createProjectCard(project, isFeatured = false, categories = []) {
  const item = document.createElement("article");
  item.className = isFeatured ? "project-card featured-card" : "card project-card";
  item.dataset.categoryId = project.categoryId || "";
  item.dataset.projectNumber = (project.number || "").trim();

  const linkUrl = normalizeExternalUrl(project.link);
  const domain = getDomainFromUrl(linkUrl);

  const media = document.createElement("div");
  media.className = "project-media";

  const img = document.createElement("img");
  img.alt = `Vorschau: ${project.name || "Projekt"}`;
  img.loading = "lazy";
  img.decoding = "async";

  const previewSources = getPreviewSources(linkUrl);
  img.dataset.sourceIndex = "0";
  if (previewSources.length) {
    img.src = previewSources[0];
  } else {
    img.style.display = "none";
  }

  img.addEventListener("error", () => {
    const nextIndex = Number(img.dataset.sourceIndex || "0") + 1;
    if (nextIndex < previewSources.length) {
      img.dataset.sourceIndex = String(nextIndex);
      img.src = previewSources[nextIndex];
      return;
    }
    img.style.display = "none";
  });

  const fallback = document.createElement("div");
  fallback.className = "project-fallback";
  fallback.textContent = domain ? domain.toUpperCase() : "PROJEKT";

  media.appendChild(img);
  media.appendChild(fallback);
  item.appendChild(media);

  const title = document.createElement("h3");
  title.textContent = project.name || "Projekt";
  item.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "project-card-meta";
  const projectNumber = (project.number || "").trim();
  if (projectNumber) {
    const numSpan = document.createElement("span");
    numSpan.className = "project-number";
    numSpan.textContent = "Nr. " + projectNumber;
    meta.appendChild(numSpan);
  }
  const cat = (project.categoryId && Array.isArray(categories)) ? categories.find((c) => c.id === project.categoryId) : null;
  if (cat && cat.name) {
    const catSpan = document.createElement("span");
    catSpan.className = "project-category";
    catSpan.textContent = cat.name;
    meta.appendChild(catSpan);
  }
  item.appendChild(meta);

  const description = document.createElement("p");
  description.textContent = project.description || "";
  item.appendChild(description);

  const actions = document.createElement("div");
  actions.className = "project-card-actions";
  const detailLink = document.createElement("a");
  detailLink.className = "button secondary";
  detailLink.textContent = "Mehr erfahren";
  const projectName = (project.name || "").trim() || "Projekt";
  detailLink.href = "/project?name=" + encodeURIComponent(projectName);
  actions.appendChild(detailLink);
  const orderLink = document.createElement("a");
  orderLink.className = "button";
  orderLink.textContent = "Bestellen";
  orderLink.href = projectNumber
    ? "/contacts?project=" + encodeURIComponent(projectNumber) + "#order-section"
    : "/contacts#order-section";
  actions.appendChild(orderLink);
  const link = document.createElement("a");
  link.className = "button secondary";
  link.textContent = "Öffnen";
  link.target = "_blank";
  link.rel = "noreferrer";
  if (linkUrl) {
    link.href = linkUrl;
  } else {
    link.href = "#";
    link.classList.add("is-disabled");
    link.setAttribute("aria-disabled", "true");
  }
  actions.appendChild(link);
  item.appendChild(actions);

  return item;
}

function normalizeExternalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || raw === "#") return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function getDomainFromUrl(url) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function getPreviewSources(url) {
  if (!url) return [];
  const safeUrl = encodeURI(url);
  const domain = getDomainFromUrl(url);
  const sources = [`https://image.thum.io/get/width/1200/noanimate/${safeUrl}`];
  if (domain) {
    sources.push(`https://www.google.com/s2/favicons?sz=256&domain=${encodeURIComponent(domain)}`);
  }
  return sources;
}

const DEFAULT_LOGO_URL = "https://i.imgur.com/qiFjcQR.jpeg";

function applyCommon(content) {
  document.querySelectorAll("[data-site-name]").forEach((el) => {
    el.textContent = content.siteName;
  });
  document.querySelectorAll(".brand-logo").forEach((img) => {
    img.src = (content.siteLogo && content.siteLogo.trim()) || DEFAULT_LOGO_URL;
  });
}

function applyFounderPageSeo(content) {
  const path = (location.pathname || "").replace(/\/+$/, "") || "/";
  if (path !== "/founder") return;
  const founder = content.about && content.about.founder;
  if (!founder) return;
  const name = (founder.name || "").trim() || "Gründerprofil";
  document.title = name + " – Gründerprofil | " + (content.siteName || "OrzuIT");
  const bio = (founder.fullBio || founder.shortBio || "").trim();
  const lead = bio ? bio.slice(0, 140).trimEnd() + (bio.length > 140 ? "…" : "") + " " : "";
  setMetaDescription(lead + "Ansprechpartner für Webprojekte – " + (content.siteName || "OrzuIT"));
  try {
    setCanonicalUrl(`${location.origin}/founder`);
  } catch {
    // ignore
  }
}

function fillOrderServiceSelect(services) {
  const select = document.getElementById("order-service");
  if (!select) return;
  const firstOption = select.querySelector('option[value=""]');
  select.innerHTML = firstOption ? firstOption.outerHTML : '<option value="">— Bitte wählen —</option>';
  (Array.isArray(services) ? services : []).forEach((s) => {
    const title = (s.title || "").trim();
    if (!title) return;
    const opt = document.createElement("option");
    opt.value = title;
    opt.textContent = title;
    select.appendChild(opt);
  });
}

function applyOrderFormFromUrl(content) {
  const params = new URLSearchParams(location.search);
  const service = params.get("service");
  const project = params.get("project");
  fillOrderServiceSelect(content.services);
  const select = document.getElementById("order-service");
  if (service && select) {
    const option = Array.from(select.options).find((o) => o.value === service);
    if (option) select.value = service;
  }
  const messageEl = document.getElementById("order-message");
  if (project && messageEl) {
    const prefix = "Projektnummer: " + project.trim();
    messageEl.value = messageEl.value ? messageEl.value + "\n" + prefix : prefix;
  }
  const section = document.getElementById("order-section");
  if ((service || project) && section) {
    requestAnimationFrame(() => {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function setupOrderForm() {
  const form = document.getElementById("order-form");
  const statusEl = document.getElementById("order-status");
  if (!form || !statusEl) return;

  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.className = "order-status " + (isError ? "order-status-error" : "order-status-ok");
  }

  function showOrderSuccessScreen() {
    const overlay = document.createElement("div");
    overlay.className = "order-success-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Anfrage zugestellt");
    overlay.innerHTML = `
      <div class="order-success-backdrop"></div>
      <div class="order-success-content">
        <div class="order-success-track">
          <div class="order-success-point order-success-point-a" aria-hidden="true"></div>
          <div class="order-success-ship" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M24 4L8 14v20l16 10 16-10V14L24 4z" stroke="currentColor" stroke-width="2" fill="rgba(0,245,255,0.15)"/>
              <path d="M24 8l-10 6v12l10 6 10-6V14L24 8z" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <circle cx="24" cy="20" r="3" fill="currentColor"/>
            </svg>
          </div>
          <div class="order-success-point order-success-point-b" aria-hidden="true"></div>
        </div>
        <div class="order-success-message">
          <h2 class="order-success-title">Anfrage zugestellt</h2>
          <p class="order-success-subtitle">Wir melden uns innerhalb von 3 Werktagen bei Ihnen.</p>
          <button type="button" class="button order-success-close">Schließen</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("is-visible"));

    const close = () => {
      overlay.classList.remove("is-visible");
      setTimeout(() => overlay.remove(), 400);
    };

    overlay.querySelector(".order-success-close").addEventListener("click", close);
    overlay.querySelector(".order-success-backdrop").addEventListener("click", close);
    overlay.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = (document.getElementById("order-name") && document.getElementById("order-name").value) || "";
    const email = (document.getElementById("order-email") && document.getElementById("order-email").value) || "";
    const phone = (document.getElementById("order-phone") && document.getElementById("order-phone").value) || "";
    const message = (document.getElementById("order-message") && document.getElementById("order-message").value) || "";
    const serviceEl = document.getElementById("order-service");
    const service = (serviceEl && serviceEl.value) || "";
    setStatus("Wird gesendet…", false);

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message, service })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus("Anfrage wurde gesendet.", false);
        form.reset();
        showOrderSuccessScreen();
      } else {
        setStatus(data.error || "Senden fehlgeschlagen.", true);
      }
    } catch (err) {
      setStatus("Netzwerkfehler. Bitte später erneut versuchen.", true);
    }
  });
}

function injectBgSequenceAnimations() {
  if (document.body.dataset.adminPage || document.querySelector(".admin-shell")) return;
  if (document.getElementById("bg-strip-bottom")) return;
  const stripBottom = document.createElement("div");
  stripBottom.id = "bg-strip-bottom";
  stripBottom.className = "bg-strip-bottom";
  stripBottom.setAttribute("aria-hidden", "true");
  const robot = document.createElement("div");
  robot.id = "bg-robot";
  robot.className = "bg-robot";
  robot.setAttribute("aria-hidden", "true");
  robot.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="13" r="1.5" fill="currentColor"/><circle cx="15.5" cy="13" r="1.5" fill="currentColor"/><path d="M9 18h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 2v4M10 4h4" stroke="currentColor" stroke-width="1.5"/></svg>';
  const stripVertical = document.createElement("div");
  stripVertical.id = "bg-strip-vertical";
  stripVertical.className = "bg-strip-vertical";
  stripVertical.setAttribute("aria-hidden", "true");
  document.body.appendChild(stripBottom);
  document.body.appendChild(robot);
  document.body.appendChild(stripVertical);
}

document.addEventListener("DOMContentLoaded", async () => {
  injectBgSequenceAnimations();
  setupMenuToggle();
  setActiveNav();
  setupRevealAnimations();
  setupOrderForm();

  const { getContent } = window.TDigitalContent;
  const content = await getContent();

  applyCommon(content);
  renderHome(content);
  renderServices(content);
  renderServiceDetailPage(content);
  renderProjectDetailPage(content);
  renderAbout(content);
  applyFounderPageSeo(content);
  renderContacts(content);
  renderProjects(content);
  renderFeaturedProject(content);
  applyOrderFormFromUrl(content);

  requestAnimationFrame(() => {
    document.body.classList.add("content-ready");
    observeRevealElements();
  });
});
