const STORAGE_KEY = "tDigitalContentDe";

const defaultContent = {
  siteName: "T.Digital",
  home: {
    title: "Wir entwickeln Websites und Web-Apps fur kleine Unternehmen",
    subtitle: "Ein junges IT-Unternehmen mit Fokus auf Qualitat, Tempo und klare Ergebnisse",
    intro:
      "Wir helfen kleinen Unternehmen, moderne digitale Losungen zu starten. Obwohl wir ein junges Team sind, liefern wir hohe Qualitat, durchdachtes UX und zuverlassige Begleitung in jeder Projektphase.",
    ctaText: "Leistungen ansehen",
    ctaLink: "services.html"
  },
  services: [
    {
      title: "Website-Entwicklung",
      description:
        "Wir erstellen moderne Unternehmenswebsites und Landingpages mit responsivem Design und klarer Struktur fur Ihre Kunden."
    },
    {
      title: "Web-App-Entwicklung",
      description:
        "Wir planen und entwickeln Web-Anwendungen zur Automatisierung von Prozessen, Anfragen, Verwaltung und Kundenkommunikation."
    }
  ],
  about: {
    text:
      "T.Digital ist ein Team, das digitale Losungen fur kleine Unternehmen entwickelt. Wir verbinden Design, Entwicklung und praxisnahe Umsetzung, damit Ihre Prozesse schneller und effizienter laufen.",
    mission:
      "Unser Ziel ist es, die Leistungsfahigkeit kleiner Unternehmen zu verbessern und die technologische Entwicklung im Unternehmertum aktiv zu unterstutzen."
  },
  contacts: {
    email: "hello@t-digital.de",
    phone: "+49 30 1234 5678",
    address: "Berlin, Deutschland",
    telegram: "@tdigital_team",
    workingHours: "Mo-Fr, 09:00-18:00"
  },
  projects: [
    {
      name: "Meine Projekte",
      description:
        "Hier werden Ihre realisierten Projekte veroffentlicht: Websites und Web-Anwendungen fur kleine Unternehmen.",
      link: "#"
    }
  ]
};

function getContent() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return structuredClone(defaultContent);
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultContent),
      ...parsed,
      home: { ...defaultContent.home, ...(parsed.home || {}) },
      about: { ...defaultContent.about, ...(parsed.about || {}) },
      contacts: { ...defaultContent.contacts, ...(parsed.contacts || {}) },
      services: Array.isArray(parsed.services) ? parsed.services : defaultContent.services,
      projects: Array.isArray(parsed.projects) ? parsed.projects : defaultContent.projects
    };
  } catch {
    return structuredClone(defaultContent);
  }
}

function saveContent(nextContent) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextContent));
}

window.TDigitalContent = {
  STORAGE_KEY,
  defaultContent,
  getContent,
  saveContent
};
