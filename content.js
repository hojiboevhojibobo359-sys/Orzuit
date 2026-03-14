const defaultContent = {
  siteName: "OrzuIT",
  home: {
    title: "Wir entwickeln Websites und Web-Apps für kleine Unternehmen",
    subtitle: "Ein IT-Unternehmen mit Fokus auf Qualität, Tempo und klare Ergebnisse",
    intro:
      "Wir helfen kleinen Unternehmen, moderne digitale Lösungen zu starten. Wir liefern hohe Qualität, durchdachtes UX und zuverlässige Begleitung in jeder Projektphase.",
    ctaText: "Leistungen ansehen",
    ctaLink: "services.html"
  },
  services: [
    {
      title: "Website-Entwicklung",
      description:
        "Wir erstellen moderne Unternehmenswebsites und Landingpages mit responsivem Design und klarer Struktur für Ihre Kunden.",
      details: ""
    },
    {
      title: "Web-App-Entwicklung",
      description:
        "Wir planen und entwickeln Web-Anwendungen zur Automatisierung von Prozessen, Anfragen, Verwaltung und Kundenkommunikation.",
      details: ""
    }
  ],
  about: {
    text:
      "OrzuIT ist ein Team, das digitale Lösungen für kleine Unternehmen entwickelt. Wir verbinden Design, Entwicklung und praxisnahe Umsetzung, damit Ihre Prozesse schneller und effizienter laufen.",
    mission:
      "Unser Ziel ist es, die Leistungsfähigkeit kleiner Unternehmen zu verbessern und die technologische Entwicklung im Unternehmertum aktiv zu unterstützen.",
    founder: {
      name: "Gründername",
      role: "Gründer & Leitung",
      shortBio:
        "Kurzbeschreibung des Gründers und seiner Rolle bei OrzuIT. Dieser Text erscheint im Über-uns-Bereich.",
      fullBio:
        "Ausführlicher Text über den Gründer: Hintergrund, Erfahrung und Vision für OrzuIT und die Unterstützung kleiner Unternehmen.",
      photoUrl: "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg",
      linkedin: "",
      email: ""
    }
  },
  contacts: {
    email: "hello@orzuit.de",
    phone: "+49 30 1234 5678",
    address: "Berlin, Deutschland",
    telegram: "@orzuit_team",
    workingHours: "Mo-Fr, 09:00-18:00"
  },
  projects: [
    {
      name: "Meine Projekte",
      description:
        "Hier werden Ihre realisierten Projekte veroffentlicht: Websites und Web-Anwendungen fur kleine Unternehmen.",
      link: "#",
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
        ...parsedFounder
      }
    },
    contacts: { ...defaultContent.contacts, ...((parsed && parsed.contacts) || {}) },
    services: Array.isArray(parsed && parsed.services)
      ? parsed.services.map((s) => ({ ...s, details: s.details != null ? s.details : "" }))
      : defaultContent.services,
    projects: Array.isArray(parsed && parsed.projects)
      ? parsed.projects.map((p) => ({ ...p, details: Array.isArray(p.details) ? p.details : [] }))
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
