# Ottenauer Motorradfreunde e. V.

Neue offizielle Website der Ottenauer Motorradfreunde e. V. aus Gaggenau-Ottenau.

## Versionen ansehen

- **Fertige Hauptseite:** [https://www.ottenauer-motorradfreunde.de/](https://www.ottenauer-motorradfreunde.de/)

## Status

Die visuelle v9-Version ist die aktuelle Hauptseite. Sie wurde aus dem eigenständigen HTML-Prototyp in eine wartbarere Struktur mit ausgelagerten Assets, Styles und JavaScript überführt. Der vorherige mehrseitige Astro-Entwurf bleibt im Repository erhalten. Seine Dateien und der Ordner `_aktuelles` in `src/pages` beginnen mit `_` und werden von Astro nicht veröffentlicht. Öffentlich bleiben die Hauptseite, Impressum und Datenschutz. Das CMS ist weiterhin nicht Bestandteil dieser Frontend-Phase.

Die Sitemap enthält ausschließlich die indexierbare Hauptseite. Impressum und Datenschutz behalten ihre bestehende `noindex`-Markierung, solange die Vereinsbestätigung aussteht. `robots.txt` erlaubt deren Abruf und verweist auf die Sitemap. SEO-Metadaten sowie `Organization`- und `WebSite`-Daten verwenden die offizielle Domain, bestehende Vereinsinformationen und das Instagram-Profil.

## Technik

- Astro mit TypeScript
- statische Ausgabe mit wenig clientseitigem JavaScript
- zentrale Design-Tokens in CSS
- v9-Bilder, Schriften, Styles und Verhalten als separate Assets
- redaktionelle Listen der Hauptseite direkt in Astro-Datenstrukturen
- einheitliche Bildkarten mit tastaturbedienbarer Foto-Großansicht
- Jubiläums-Countdown mit Sekunden, Google-Maps-Anfahrt und optionaler Standortkarte
- strukturierte Mock-Daten als spätere CMS-Schnittstelle

## Änderungen vom 1. Oktober 2026

- Neue Vereinsfotos ersetzen die unscharfen Gruppenbilder und Zeitungsausschnitte. Der Jubiläumsrückblick ist mit 2016 gekennzeichnet.
- Bildausschnitte, Farben und Helligkeit verbessert; das historische Foto begradigt und Kennzeichen im Tourenbild unkenntlich gemacht. Originale erhalten.
- Bilder für kurze Ladezeiten und unterschiedliche Bildschirmgrößen optimiert.
- Bildkarten und Kontaktinformationen einheitlich ausgerichtet.
- Foto-Großansicht mit Weiterblättern und Tastaturbedienung ergänzt.
- Countdown um Sekunden und die Anfahrt zur Merkurhalle mit Routenlink und einer erst nach Zustimmung geladenen Standortkarte ergänzt.
- Impressum und Datenschutz überarbeitet und verlinkt; sichtbare Entwurfshinweise entfernt. Offene Freigabepunkte bleiben dokumentiert.
- Jubiläumslogo vergrößert, Lorbeerfarbe und Zweigabstand angepasst sowie störende Mittelkanten korrigiert.
- Sanften diagonalen Glanz und einen kurzen Glanzpunkt an der rechten Lorbeerspitze ergänzt, auch mobil. Logo und Schrift bleiben ohne Effekt.
- [Instagram-Profil @omf19762026](https://www.instagram.com/omf19762026/) mit offiziellem Glyph im Kontaktbereich und Footer verlinkt, ohne eingebetteten Feed.
- Vereinslogo im Footer wie im Header freigestellt dargestellt.
- Darstellung auf Desktop, Tablet und Smartphone sowie Seitenfunktionen geprüft.

## Änderungen vom 2. Oktober 2026

- Anfahrt-Kachel kompakt angeordnet: Adresse, Routenlinks und kleine, sofort sichtbare Kartenvorschau.
- Interaktive Karte optional, mit kurzem Datenschutzhinweis erst nach dem Öffnen.
- Instagram-Verlinkung im Kontaktbereich größer und deutlicher gestaltet; den doppelten Link im Footer entfernt.
- Hellen Hintergrund gedämpft und Abschnittsabstände harmonisiert; klare Hell-Dunkel-Gliederung beibehalten.
- Überschrift „Seit 1976“ stärker gewichtet und Abschnittsanfänge beim Navigieren unterhalb des Headers sichtbar gehalten.

## Änderungen vom 3. Oktober 2026

- Einheitliche Bildunterschriften direkt unter den Vereinsfotos und in der Großansicht ergänzt.
- Tourenrückblick dem Clubhausfoto zugeordnet; den Text zum Stammtisch und Kennenlernen wiederhergestellt.
- Überschriften der Bildkarten bleiben trotz unterschiedlich langer Bildunterschriften auf gleicher Höhe.

## Lokal starten

```bash
npm install
npm run dev
```

Produktionsprüfung:

```bash
npm run build
npm run test:site
```

## Dokumentation

- [Umsetzungsplan](docs/implementation-plan.md)
- [Architektur](docs/architecture.md)
- [Inhaltsmodell](docs/content-model.md)
- [Vereinsfotos und Bildaufbereitung](docs/photo-assets.md)
- [Rechtliche Quellen und offene Freigaben](docs/legal-review.md)
- [Herkunft des Instagram-Glyphs](docs/brand-assets.md)

## Noch zu bestätigen

Die neuen Vereinsfotos ersetzen die Zeitungsausschnitte und die alten verpixelten Bilder. Impressum und Datenschutz sind im Design der Hauptseite vorbereitet und im Footer verlinkt.

Die endgültige Domain, Veranstaltungsangaben, zustellfähige Vereinsanschrift und aktuelle Vorstandsvertretung sind noch zu bestätigen. Details und Quellen: [rechtliche Freigabe](docs/legal-review.md).
