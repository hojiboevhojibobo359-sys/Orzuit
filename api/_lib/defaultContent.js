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
      "Wir möchten die Wettbewerbsfähigkeit von KMU stärken – durch transparente Projektsteuerung, dokumentierte Schnittstellen und begleitenden Support nach Launch."
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
      details: [
        { label: "Ziel / Ergebnis", value: "" },
        { label: "Technologie-Stack", value: "" },
        { label: "Laufzeit", value: "" },
        { label: "Teamgröße", value: "" },
        { label: "Budgetrahmen", value: "" },
        { label: "Go-live", value: "" }
      ]
    }
  ]
};

module.exports = {
  defaultContent
};
