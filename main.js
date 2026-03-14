function setActiveNav() {
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const target = link.getAttribute("href");
    if (target === current) {
      link.classList.add("active");
    }
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

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
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
    cta.href = content.home.ctaLink || "services.html";
  }
}

function renderServices(content) {
  const list = document.getElementById("services-list");
  if (!list) return;
  list.innerHTML = "";
  content.services.forEach((service) => {
    const item = document.createElement("article");
    item.className = "card";
    item.innerHTML = `
      <h3>${service.title}</h3>
      <p>${service.description}</p>
    `;
    list.appendChild(item);
  });
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
    fullName.textContent = founder.name || "Grunder";
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
  if (!value) return `<span>-</span>`;

  if (type === "email") {
    return `<a class="contact-link" href="mailto:${value}">${value}</a>`;
  }

  if (type === "phone") {
    const phoneUri = value.replace(/\s+/g, "");
    return `<a class="contact-link" href="tel:${phoneUri}">${value}</a>`;
  }

  if (type === "telegram") {
    const username = value.replace(/^@/, "");
    return `<a class="contact-link" href="https://t.me/${username}" target="_blank" rel="noreferrer">${value}</a>`;
  }

  if (type === "address") {
    const mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(value)}`;
    return `<a class="contact-link" href="${mapsLink}" target="_blank" rel="noreferrer">${value}</a>`;
  }

  return `<span>${value}</span>`;
}

function renderProjects(content) {
  const list = document.getElementById("projects-list");
  if (!list) return;
  list.innerHTML = "";
  content.projects.forEach((project) => {
    list.appendChild(createProjectCard(project));
  });
}

function renderFeaturedProject(content) {
  const section = document.getElementById("featured-project-section");
  const card = document.getElementById("featured-project-card");
  if (!section || !card) return;

  const projects = Array.isArray(content.projects) ? content.projects : [];
  if (!projects.length) {
    section.hidden = true;
    return;
  }

  const mainProject = projects[0];
  section.hidden = false;
  card.innerHTML = "";
  card.appendChild(createProjectCard(mainProject, true));
}

function createProjectCard(project, isFeatured = false) {
  const item = document.createElement("article");
  item.className = isFeatured ? "project-card featured-card" : "card project-card";

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

  const description = document.createElement("p");
  description.textContent = project.description || "";
  item.appendChild(description);

  const link = document.createElement("a");
  link.className = "button secondary";
  link.textContent = "Offnen";
  link.target = "_blank";
  link.rel = "noreferrer";
  if (linkUrl) {
    link.href = linkUrl;
  } else {
    link.href = "#";
    link.classList.add("is-disabled");
    link.setAttribute("aria-disabled", "true");
  }
  item.appendChild(link);

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

function applyCommon(content) {
  document.querySelectorAll("[data-site-name]").forEach((el) => {
    el.textContent = content.siteName;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupMenuToggle();
  setActiveNav();
  setupRevealAnimations();

  const { getContent } = window.TDigitalContent;
  const content = await getContent();

  applyCommon(content);
  renderHome(content);
  renderServices(content);
  renderAbout(content);
  renderContacts(content);
  renderProjects(content);
  renderFeaturedProject(content);

  requestAnimationFrame(() => {
    document.body.classList.add("content-ready");
    observeRevealElements();
  });
});
