# Audit & SEO-Update – T.Digital / OrzuIT (2026-03-31)

## Kurzfassung

Statische Multi-Page-Website (Vercel) mit serverlosen APIs (`/api/content`, `/api/order`, Analytics, Admin). Es wurden Navigations- und Link-Bugs behoben, XSS-Risiken in Kontakt-Rendering reduziert, SEO-Metadaten und Fließtexte überarbeitet, Font-Ladestrategie verbessert, strukturierte Daten ergänzt und automatisierte Tests für die zentrale API-Validierung hinzugefügt.

---

## Gefundene Probleme und Fixes

| Thema | Problem | Maßnahme |
|--------|---------|----------|
| Navigation | `setActiveNav()` verglich `pathname`-Segment mit `href` (`/` vs. leer) – Startseite nie aktiv | Normalisierung von Pfad und `href`, Sonderfälle `/service`, `/project`, `/founder` |
| Interne URLs | Gemischte Nutzung von `contacts.html` und Clean URLs unter `vercel.json` | Einheitlich `/contacts` mit Query und Hash |
| CTA-Fallback | `ctaLink`-Fallback zeigte auf `services.html` | Fallback `/services` |
| XSS / Markup | Kontaktwerte wurden unescaped in HTML injiziert | `escapeHtml` für sichtbaren Text, sicherere `tel:`- und Telegram-Handles |
| SEO (Detailseiten) | Kein konsistentes `meta description` / `canonical` nach JS-Render | `setMetaDescription`, `setCanonicalUrl` bei Service- und Projekt-Detail |
| Copy / Tippfehler | „Grunder“, „Offnen“, Platzhalter-Deutsch | „Gründer“, „Öffnen“, professionelle Default-Texte |
| Logging | `order.js` loggte `data.id` bei fehlgeschlagenem Telegram-Versand (undefiniert) | `createdOrderId` aus `Order.create` |
| Analytics-API | Unbegrenzte Länge von `page` / `referrer` | Kürzung auf 2048 Zeichen |
| Performance | `@import` Google Fonts in `styles.css` blockiert parsend | Fonts per `<link>` im HTML, `@import` entfernt |
| Skripte | `analytics.js` ohne `defer`, parallele Ausführung zu `main.js` | `defer` auf allen öffentlichen Seiten |
| Footer / SEO | Wenige interne Links im Footer | Navigationszeile im Footer auf allen Hauptseiten |
| UX Menü | Offenes Mobile-Menü blieb bei Klick außerhalb offen | Schließen bei Außenklick und `Escape` |
| Tests | Keine automatisierten Checks | `node --test` gegen `api/_lib/validate.js` |

---

## Architektur & Skalierung (Empfehlung)

- **Inhalt:** JSON via `SiteContent` skaliert gut; bei wachsender Komplexität lohnt sich ein Headless-CMS oder SSG (z. B. Content-Sammlung zu Build-Zeit für noch bessere First-Byte-SEO ohne JS für Primärtexte).
- **Preview-Bilder:** `image.thum.io` / Google Favicons als Drittanbieter – für DSGVO und Performance eigene Screenshots oder serverseitige Thumbnails (bereits `sharp` in Dependencies) prüfen.
- **Integrationen:** Telegram und Postgres sind gekapselt; Bot-Token ausschließlich über Umgebungsvariablen / Admin, Rate-Limiting ist vorhanden – beibehalten.

---

## SEO – umgesetzt

- Titel, Description, Keywords (ergänzend, natürlich formuliert) und `robots` auf Hauptseiten.
- JSON-LD (`Organization` + `WebSite`) auf der Startseite.
- Konsistente Clean-URLs (bereits `vercel.json`).
- `sitemap.xml` – `lastmod` auf 2026-03-31 aktualisiert.
- `site.webmanifest` – Kurzbeschreibung angepasst.
- Alt-Texte und `width`/`height` an ausgewählten Gründer-Bildern für CLS.

**Weiter offen (manuell):**

- Echte `sameAs`-URLs im JSON-LD (LinkedIn, X, Impressum-Link).
- OG-Bild als gehostete Datei unter eigenDomain statt nur Imgur (Cache, Branding).
- Bei Bedarf: getrennte `hreflang`, wenn EN-Version kommt.

---

## Tests

- Befehl: `npm test`
- Umfang: Unit-Tests für `validateOrder`, `validateLogin`, `validateContent`, `validateTelegram`.
- **Integrationstests** (HTTP gegen laufendes `vercel dev`) sind nicht im Repo – empfohlen für CI mit Preview-Deployment.

---

## Deploy / Vercel: `404 NOT_FOUND` (fra1::…)

Trat diese Meldung **nach** „Deployment completed“ bei **Build-Cache-Upload** auf, handelt es sich um einen **bekannten Infrastruktur-Fehler** seitens Vercel (Region/Storage), nicht um fehlerhaften Projektcode. Mit `npm run build` (Tests + Pflichtdateien) schlägt die Anwendungs-Build-Phase bei Problemen im Repo fehl. Bei wiederholten Cache-Fehlern: Redeploy oder Vercel-Support mit der angezeigten **ID** kontaktieren.

---

## Priorisierte nächste Schritte (Backlog)

1. **P0:** Produktions-Content in Admin einpflegen (keine Platzhalter-Gründerdaten live).
2. **P0:** Lighthouse / PageSpeed messen; Bilder (`logo.png`, Projektbilder) in moderne Formate und feste Abmessungen.
3. **P1:** DSGVO-Seite + Cookie-/Analytics-Hinweis falls Tracking erweitert wird.
4. **P1:** Serverseitige Order-/Content-Integrationstests in CI.
5. **P2:** Ersetzen externer Screenshot-Provider durch eigene Pipeline mit `sharp`.
