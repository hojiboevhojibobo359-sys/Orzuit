const defaultContent = {
  siteName: "OrzuIT",
  siteLogo: "https://i.imgur.com/qiFjcQR.jpeg",
  home: {
    title: "Webentwicklung für KMU: performante Websites & skalierbare Web-Apps",
    subtitle: "Websites und digitale Produkte mit klarem Fokus auf Performance, UX und planbare Release-Zyklen",
    intro:
      "Als Webentwicklungspartner für KMU liefern wir messbare Ergebnisse: schnelle Ladezeiten, suchmaschinenfreundliche Struktur, barriereorientierte Oberflächen und begleitende Beratung von der Konzeption bis zum Go-live.",
    ctaText: "Leistungen & Ablauf ansehen",
    ctaLink: "/services"
  },
  services: [
    {
      title: "Website-Entwicklung & Corporate Sites",
      description:
        "Saubere, responsive Unternehmenswebsites und Landingpages mit semantischem HTML, optimierten Core Web Vitals und redaktionsfreundlicher Struktur.",
      details:
        "Wir planen Informationsarchitektur, setzen technisches SEO (Crawlability, Meta-Basics, strukturierte Daten wo sinnvoll) und binden CMS oder Headless-Content nach Bedarf ein. Fokus: klare User Journeys, barriereorientierte Gestaltung entlang gängiger WCAG-Checks, schnelle Time-to-Market und Hosting-Empfehlungen inklusive Monitoring."
    },
    {
      title: "Web-App-Entwicklung & Prozessautomatisierung",
      description:
        "Individuelle Web-Anwendungen für CRM-Light, interne Tools, Kundenportale und automatisierte Workflows – skalierbar und wartbar.",
      details:
        "Von der fachlichen Anforderungsaufnahme über API-Design bis zu rollenbasierten Oberflächen: Wir liefern Release-fähige Module, Logging, Basis-Härtung und optionale Anbindung an Zahlungs- oder Kommunikationsdienste. Technologiewahl erfolgt nach Budget, Team und Langzeit-Roadmap."
    }
  ],
  about: {
    text:
      "OrzuIT ist ein schlank aufgestelltes Team für digitale Produktentwicklung. Wir kombinieren UX-Entscheidungen, moderne Frontend-Stacks und pragmatische Backend-Services, damit kleine Unternehmen ohne eigene IT-Abteilung zuverlässig digitalisieren können.",
    mission:
      "Wir möchten die Wettbewerbsfähigkeit von KMU stärken – durch transparente Projektsteuerung, dokumentierte Schnittstellen und begleitenden Support nach Launch.",
    founder: {
      name: "Gründername",
      role: "Gründerin bzw. Gründer & Geschäftsführung",
      shortBio:
        "Kurzprofil mit Schwerpunkt auf Erfahrung in Webentwicklung, Produktvision und Zusammenarbeit mit kleinen Unternehmen. Wird auf der Über-uns-Seite angezeigt.",
      fullBio:
        "Ausführliche Vita: Stationen in Entwicklung und Beratung, methodische Arbeitsweise, Referenzen (anonymisiert möglich) sowie die langfristige Ausrichtung von OrzuIT als Partner für nachhaltige Webprojekte.",
      photoUrl: "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg",
      linkedin: "",
      email: "",
      details: []
    }
  },
  contacts: {
    email: "hello@orzuit.de",
    phone: "+49 30 1234 5678",
    address: "Berlin, Deutschland",
    telegram: "@orzuit_team",
    workingHours: "Mo–Fr, 09:00–18:00 Uhr (CET)"
  },
  projectCategories: [
    { id: "web", name: "Websites & Landingpages" },
    { id: "app", name: "Web-Apps & interne Tools" }
  ],
  projects: [
    {
      name: "Referenzprojekt (Platzhalter)",
      description:
        "Hier stellen Sie realisierte Projekte vor: Zielsetzung, Technologie-Stack, messbare KPIs und Verlinkung zur Live-Umgebung – ideal für SEO und Vertrieb.",
      link: "#",
      number: "10001",
      categoryId: "web",
      details: []
    }
  ]
};

function normalizeContent(parsed) {
  const parsedAbout = (parsed && parsed.about) || {};
  const parsedFounder = parsedAbout.founder || {};
  return {
    ...structuredClone(defaultContent),
    ...(parsed || {}),
    home: { ...defaultContent.home, ...((parsed && parsed.home) || {}) },
    about: {
      ...defaultContent.about,
      ...parsedAbout,
      founder: {
        ...defaultContent.about.founder,
        ...parsedFounder,
        details: Array.isArray(parsedFounder.details) ? parsedFounder.details : []
      }
    },
    contacts: { ...defaultContent.contacts, ...((parsed && parsed.contacts) || {}) },
    services: Array.isArray(parsed && parsed.services)
      ? parsed.services.map((s) => ({ ...s, details: s.details != null ? s.details : "" }))
      : defaultContent.services,
    siteLogo: (parsed && parsed.siteLogo) != null ? parsed.siteLogo : defaultContent.siteLogo,
    projectCategories: Array.isArray(parsed && parsed.projectCategories)
      ? parsed.projectCategories
      : defaultContent.projectCategories,
    projects: Array.isArray(parsed && parsed.projects)
      ? parsed.projects.map((p) => ({
          ...p,
          details: Array.isArray(p.details) ? p.details : [],
          number: p.number != null ? String(p.number) : "",
          categoryId: p.categoryId != null ? p.categoryId : ""
        }))
      : defaultContent.projects
  };
}

async function getContent() {
  try {
    const response = await fetch("/api/content", {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      return structuredClone(defaultContent);
    }
    const payload = await response.json();
    return normalizeContent(payload.content);
  } catch {
    return structuredClone(defaultContent);
  }
}

async function saveContent(nextContent, token) {
  const response = await fetch("/api/admin/content", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      content: normalizeContent(nextContent)
    })
  });

  if (!response.ok) {
    let message = "Speichern fehlgeschlagen.";
    try {
      const errorPayload = await response.json();
      if (errorPayload && errorPayload.error) {
        message = errorPayload.error;
      }
    } catch {
      // Use fallback message.
    }
    throw new Error(message);
  }

  return response.json();
}

window.TDigitalContent = {
  defaultContent,
  normalizeContent,
  getContent,
  saveContent
};
