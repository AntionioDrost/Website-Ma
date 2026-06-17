# Zonnepanelenwizard Design

## Samenvatting

We voegen een nieuwe productpagina `Zonnepanelen` toe aan Monument Gids. De pagina moet monumenteigenaren helpen om een legplan voor zonnepanelen rustig op te bouwen, inclusief dakdelen, zichtbaarheid vanaf openbaar gebied, buurcontext, bijlagen en een concepttekst voor vooroverleg of vergunning.

De belangrijkste les uit de losse prototypefase: bouw dit niet als één losse static demo met ad-hoc functies. De zonnepanelenwizard moet aansluiten op de bestaande Monument Gids-appshell, dossieropslag en routepatronen. De ervaring moet aanvoelen als een volwassen onderdeel naast `Glaswizard` en `Mijn dossier`.

## Context uit de bestaande app

De repository bevat al een duidelijke appstructuur:

- De server serveert publieke routes vanuit `monument-app/public`.
- Bestaande routes zijn onder andere `/thuis`, `/intake`, `/glasisolatie-demo` en `/mijn-dossier`.
- `Zonnepanelen` staat al in de maatregelcatalogus van de intake, maar heeft nog geen eigen route of wizardpagina.
- De glaswizard gebruikt een aparte HTML/CSS/JS-combinatie en is al ontworpen als rustige wizard met vrije stapnavigatie.
- `Mijn dossier` is ontworpen als centrale plek voor route-overstijgende gegevens en broninformatie.

Daarom moet de zonnepanelenpagina niet opnieuw alles uitvinden, maar deze patronen volgen.

## Doel

De zonnepanelenwizard moet drie problemen oplossen:

1. De gebruiker helpen een duidelijk legplan per dakdeel te maken.
2. De gebruiker helpen aantonen of de panelen zichtbaar zijn vanaf openbaar toegankelijk gebied.
3. De gebruiker voorbereiden op vooroverleg of een vergunningaanvraag met een compleet, controleerbaar dossier.

De pagina moet rust geven. De gebruiker hoeft geen GIS-specialist, installateur of vergunningadviseur te zijn. De wizard vertaalt de technische en ruimtelijke keuzes naar begrijpelijke stappen.

## Productprincipes

### 1. Geen magische black box

De app mag live data gebruiken, maar moet altijd uitleggen wat automatisch is opgehaald en wat de gebruiker zelf heeft aangepast.

Gebruik daarom bronlabels:

- `Ingevuld uit adreszoeking`
- `Ingetekend door gebruiker`
- `Geschat door wizard`
- `Controleer met installateur`
- `Controleer met gemeente`

### 2. Indicatief is niet officieel

3D, luchtfoto, zichtlijnen en legplannen mogen helpen bij vooroverleg, maar de UI moet niet suggereren dat dit automatisch juridisch bewijs is.

Gebruik vaste disclaimer-copy:

> Deze analyse is een voorbereiding op vooroverleg of aanvraag. Controleer maatvoering, zichtbaarheid en constructie altijd met de gemeente, installateur of adviseur.

### 3. Werk per dakdeel

Monumenten hebben vaak meerdere relevante dakvlakken: voor-, zij- en achterdak, platte uitbouw, bijgebouw of erfopstelling. Alles in de wizard moet daarom dakdeel-gebaseerd zijn.

Een dakdeel is een eerste-klas object in de state, niet alleen een rij in een formulier.

### 4. Zichtbaarheid is leidend voor monumenten

Bij monumenten is het legplan niet alleen technisch. Het belangrijkste gesprek met de gemeente gaat vaak over zichtbaarheid, aantasting van het aanzicht en plaatsing op minder prominente plekken.

De wizard moet daarom zichtbaarheid even belangrijk maken als paneelaantallen.

## Gewenste route

Nieuwe route:

- `/zonnepanelen`
- alternatief: `/zonnepanelen.html`

Nieuwe publieke bestanden:

- `monument-app/public/zonnepanelen.html`
- `monument-app/public/zonnepanelen.css`
- `monument-app/public/zonnepanelen.js`

Serverrouting toevoegen in `server.mjs`:

```js
if (pathname === "/zonnepanelen" || pathname === "/zonnepanelen.html") {
  return path.join(publicDir, "zonnepanelen.html");
}
```

Navigatie uitbreiden in de bestaande appshell:

- `Thuis`
- `Intakechat`
- `Glaswizard`
- `Zonnepanelen`
- `Mijn dossier`

Gebruik hetzelfde visuele navigatiepatroon als de bestaande sidebar.

## Wizardstructuur

De wizard krijgt vrije stapnavigatie, net als de vernieuwde glaswizard. Validatie waarschuwt, maar blokkeert navigatie niet.

### Stap 1 — Start en adres

Doel: bepalen om welk pand het gaat en basisdata ophalen.

Velden:

- Adreszoekveld
- Gemeente
- Monumentstatus
- Beschermd gezicht / monumentomgeving
- Korte omschrijving van de maatregel

Acties:

- `Zoek adres`
- `Laad demo-adres Prins Hendriklaan 26, Zeist`
- `Gebruik handmatige invoer`

Databronnen:

- PDOK Locatieserver voor adreszoeking
- bestaande serverlogica voor BAG/erfgoeddata waar bruikbaar
- later Supabase huisdossier als voorkeursbron

Belangrijk gedrag:

- Adres zoeken moet nooit de hele wizard breken.
- Bij fout: toon menselijke foutmelding en laat handmatige invoer toe.
- Demo-adres moet altijd werken, desnoods met fallbackdata.

### Stap 2 — Dakdelen

Doel: dakdelen toevoegen, beheren en selecteren.

Een dakdeel bevat minimaal:

```js
{
  id: "stable-id",
  name: "Hoofddak achterzijde",
  type: "hellend" | "plat" | "bijgebouw" | "erf",
  orientation: "voor" | "achter" | "links" | "rechts" | "onbekend",
  material: "pannen" | "leien" | "bitumen" | "anders",
  visibility: "niet-zichtbaar" | "beperkt" | "duidelijk" | "onbekend",
  roofWidthM: number,
  roofDepthM: number,
  pitchDeg: number,
  marginCm: number,
  panelCountTarget: number,
  mapPolygon: Array<[number, number]>,
  source: "user" | "demo" | "estimated"
}
```

Verplichte interacties:

- Dakdeel toevoegen
- Dakdeel dupliceren
- Dakdeel verwijderen
- Dakdeel selecteren
- Naam aanpassen
- Type aanpassen

Verwijderen moet robuust zijn:

- gebruik event delegation op de lijstcontainer
- verwijder op basis van `data-roof-id`
- vraag alleen bevestiging als het dakdeel al data bevat
- laat minimaal nul dakdelen toe, maar toon dan een goede leegstaat
- render na elke delete opnieuw de lijst, kaart, 3D en berekeningen

Nooit inline `onclick` gebruiken voor cruciale acties.

Leegstaat:

> Nog geen dakdelen. Voeg eerst een dakdeel toe of laad het demo-adres.

### Stap 3 — Kaart en luchtfoto

Doel: dakdelen kunnen intekenen op een kaart/luchtfoto.

Gebruik:

- Leaflet voor 2D kaart
- PDOK Luchtfoto als basislaag
- OpenStreetMap als kaartlaag/fallback

Interactie:

- actief dakdeel kiezen
- polygoon tekenen
- punten tonen als duidelijke bolletjes
- punten kunnen verplaatsen
- punt verwijderen
- polygoon sluiten door eerste punt aan te klikken
- kaartmaat gebruiken als schatting voor dakmaat

UI-regels:

- Lijn moet altijd zichtbaar zijn op luchtfoto: witte halo + groene of oranje lijn.
- Actief dakdeel is groen/oranje; andere dakdelen zijn rustiger.
- Elke polygoon heeft een label met dakdeelnaam of nummer.

Fallback:

Als kaarttegels niet laden:

- toon foutmelding
- laat formuliermatig dakmaat invullen
- wizard blijft bruikbaar

### Stap 4 — Legplan

Doel: panelen per dakdeel logisch positioneren.

Velden per dakdeel:

- paneelbreedte
- paneelhoogte
- Wp per paneel
- portret / landschap
- tussenruimte
- randzone
- gewenste hoeveelheid panelen
- obstakels
- bij plat dak: hellingshoek en rijafstand

Output per dakdeel:

- aantal passende panelen
- kWp
- rijen / kolommen
- conflicten met obstakels
- waarschuwingen over randzones of zichtbaarheid

Visuele output:

- eenvoudige 2D-legplantekening per dakdeel
- duidelijk onderscheid tussen dakvlak, no-go-zone, panelen en obstakels

### Stap 5 — Zicht vanaf openbare ruimte

Doel: onderbouwen of panelen zichtbaar zijn vanaf openbaar toegankelijk gebied.

Een zichtpunt bevat:

```js
{
  id: "stable-id",
  name: "Overzijde van de straat",
  type: "straat" | "stoep" | "plein" | "park" | "brug" | "achterpad" | "anders",
  lat: number,
  lon: number,
  eyeHeightM: 1.6,
  result: "niet-zichtbaar" | "beperkt" | "duidelijk" | "onbekend",
  note: string,
  source: "user" | "generated" | "analysis"
}
```

Interactie:

- zichtpunt toevoegen
- zichtpunt verwijderen
- zichtpunt op kaart plaatsen
- zichtpunt slepen
- zichtpunten automatisch genereren rond het pand
- zichtanalyse handmatig overschrijven

Belangrijke UI:

- genummerde zichtpunten op kaart
- zichtlijnen naar actief dakdeel of naar pandcentrum
- kleurcode:
  - groen = niet zichtbaar
  - amber = beperkt zichtbaar
  - rood = duidelijk zichtbaar
  - grijs = onbekend

### Stap 6 — 3D en buurcontext

Doel: het pand, buurhuizen, dakdelen en zichtlijnen ruimtelijk begrijpen.

Gebruik in v1:

- echte interactieve 3D-viewer met CesiumJS of een goed gescheiden canvasfallback
- PDOK 3D Basisvoorziening als live 3D-bron waar mogelijk
- fallback-gebouwen als vereenvoudigde volumes als PDOK niet laadt

3D-bronnen:

- PDOK 3D Basisvoorziening / 3D Tiles Gebouwen
- eventueel PDOK 3D Terreinen
- BAG/BGT/AHN-achtergrond via bestaande PDOK-stack

Belangrijk gedrag:

- De 3D-render mag nooit een lege grijze bak zijn zonder uitleg.
- Als live 3D niet laadt, toon expliciet:

> Live 3D-gegevens konden niet worden geladen. We tonen nu een vereenvoudigd model op basis van je dakdelen en buurvolumes.

Camera:

- start altijd boven maaiveld
- kijk op het pand, niet vanuit onder de grond
- bied knoppen:
  - `Reset 3D`
  - `Vanaf straat`
  - `Schuin boven`
  - `Bovenaanzicht`

Buurhuizen:

Een buurvolume bevat:

```js
{
  id: "stable-id",
  name: "Buurhuis links",
  side: "links" | "rechts" | "voor" | "achter",
  type: "hellend" | "plat",
  widthM: number,
  depthM: number,
  eaveHeightM: number,
  ridgeHeightM: number,
  source: "pdok" | "estimated" | "user"
}
```

Buurhuizen moeten:

- zichtbaar zijn in de 3D-viewer
- in een tabel aanpasbaar zijn
- kunnen worden verwijderd
- bronlabel tonen: `PDOK`, `geschat` of `handmatig`

### Stap 7 — Uitvoering en schadepreventie

Doel: erfgoedvriendelijke uitvoering vastleggen.

Velden:

- paneeluiterlijk
- montagemethode
- kabelroute
- omvormerlocatie
- bestaande dakbedekking behouden
- omkeerbaarheid
- constructiecontrole
- brandveiligheid

Toon adviezen als ondersteunende meldingen, niet als harde fouten.

### Stap 8 — Bijlagen en export

Doel: dossierstukken afvinken en exporteren.

Bijlagenlijst:

- luchtfoto met dakdelen
- legplan per dakdeel
- zichtlijnenkaart
- foto’s vanaf openbaar gebied
- 3D-render of screenshots
- productblad panelen
- montagemethode
- kabelroute
- constructieve verklaring indien nodig
- alternatievenafweging

Exportacties:

- Markdown conceptverzoek
- JSON dossierstate
- print/PDF-vriendelijke pagina
- later: screenshot/export van kaart en 3D-view

## Live koppelingen

### Adres zoeken

Gebruik PDOK Locatieserver bij voorkeur via de server of een kleine clienthelper.

Gewenst patroon:

1. gebruiker vult adres in
2. client vraagt `/api/address-lookup?q=...` of bestaande lookuphelper aan
3. server doet PDOK-call
4. response bevat:
   - officiële adresweergave
   - lat/lon
   - gemeente
   - BAG-id waar mogelijk
   - status
   - waarschuwing bij twijfel

Als er nog geen specifieke endpoint is voor zonnepanelen, hergebruik of extract bestaande adreslookuplogica uit `server.mjs` in plaats van dupliceren in browser-JS.

### 3D-gebouwen

Gebruik PDOK 3D Basisvoorziening waar mogelijk.

Gewenst gedrag:

- start Cesium-viewer pas nadat adrescoördinaten bekend zijn
- zoom naar pand
- voeg 3D Tileset toe
- voeg eigen dakdelen/panelen als overlay primitives of entities toe
- vang tile-load errors af
- toon fallback-model als tiles niet laden

Belangrijk: maak live 3D een laag, niet de enige bron van waarheid. De wizardstate blijft leidend.

## State en opslag

Gebruik een eigen dossierstate `solar`.

Aanbevolen structuur:

```js
const solarState = {
  schemaVersion: 1,
  project: {
    address: "",
    municipality: "",
    monumentStatus: "",
    coordinates: null,
    bagId: "",
    source: "manual" | "pdok" | "houseProfile"
  },
  roofParts: [],
  viewpoints: [],
  neighborBuildings: [],
  system: {},
  safety: {},
  attachments: {},
  fieldSources: {},
  editedByUser: {}
};
```

Opslag:

- lokaal autosaven tijdens werken
- remote opslaan via bestaande dossier-store als gebruiker ingelogd is
- dossier_type bij voorkeur: `solar`

Mijn dossier:

- later moet `Mijn dossier` ook `solar` kunnen tonen naast `intake` en `glass`
- gedeelde velden zoals adres en monumentstatus moeten niet stil overschreven worden

## Bestandsscope voor Codex

### Nieuwe bestanden

- `monument-app/public/zonnepanelen.html`
- `monument-app/public/zonnepanelen.css`
- `monument-app/public/zonnepanelen.js`

### Aan te passen bestanden

- `monument-app/server.mjs`
  - route `/zonnepanelen`
  - eventueel API-proxy voor adreslookup en/of 3D-config
- `monument-app/public/thuis.html`
  - kaart/link naar zonnepanelenroute
- `monument-app/public/thuis.js`
  - routekaart of CTA als die dynamisch is
- `monument-app/public/mijn-dossier.js`
  - later solar-dossier tonen
- `monument-app/public/dossier-store.js`
  - indien nodig dossier_type `solar` ondersteunen
- `monument-app/public/styles.css`
  - alleen gedeelde componenten; geen zonnepanelenspecifieke bulk hierin

### Documentatie

- `docs/superpowers/specs/design-zonnepanelen.md`

## UI-stijl

Gebruik de Monument Gids-stijl:

- rustige witte en creme oppervlakken
- donkergroen als primaire actie- en vertrouwenskleur
- ronde kaarten
- zachte schaduw
- B1-taalniveau
- geen technische GIS-taal tenzij nodig
- geen druk dashboardgevoel

Teksttoon:

- naast de gebruiker zitten
- concreet
- kalm
- eerlijk over onzekerheden

Voorbeeldcopy:

- `Teken het dakdeel dat je wilt gebruiken.`
- `Dit is een schatting op basis van de kaart. Controleer de maat nog.`
- `Vanaf dit punt lijken de panelen beperkt zichtbaar.`
- `Voeg een straatfoto toe als onderbouwing.`

## Accessibility

- alle inputs met labels
- knoppen met duidelijke tekst, niet alleen iconen
- kaartacties ook via formulier beschikbaar
- 3D-viewer mag niet essentieel zijn om verder te kunnen
- foutmeldingen tekstueel tonen
- toetsenbordnavigatie voor wizardstappen en tabellen
- `prefers-reduced-motion` respecteren

## Testscenario’s

Codex moet minimaal deze scenario’s werkend opleveren:

### 1. Demo-adres

- open `/zonnepanelen`
- klik `Laad demo-adres Prins Hendriklaan 26, Zeist`
- adresvelden worden gevuld
- minimaal twee dakdelen verschijnen
- 3D-view toont pand of fallbackmodel
- geen console-errors

### 2. Adres zoeken

- vul `Prins Hendriklaan 26, Zeist` in
- klik `Zoek adres`
- officiële of fallback-resultaat verschijnt
- gebruiker kan verder als PDOK faalt

### 3. Dakdelen verwijderen

- voeg drie dakdelen toe
- verwijder middelste dakdeel
- juiste dakdeel verdwijnt
- lijst, kaart, legplan en 3D updaten
- geen oude geselecteerde index blijft hangen

### 4. Kaart tekenen

- teken een dakdeelpolygoon
- sluit door eerste punt aan te klikken
- sleep een punt
- verwijder een punt
- gebruik kaartmaat als schatting

### 5. 3D fallback

- simuleer falende PDOK 3D Tiles
- toon duidelijke fallbackmelding
- toon vereenvoudigd model
- wizard blijft bruikbaar

### 6. Zichtpunten

- genereer zichtpunten
- plaats handmatig zichtpunt
- verwijder zichtpunt
- wijzig resultaat naar `beperkt zichtbaar`
- concepttekst neemt dit over

### 7. Export

- vul minimaal adres, dakdelen en zichtpunten in
- exporteer concepttekst
- tekst bevat dakdelen, zichtbaarheid, bijlagen en disclaimers

## Hard requirements

Deze punten zijn niet onderhandelbaar:

1. Geen kapotte knoppen.
2. Geen inline event handlers voor kritieke acties.
3. Geen dubbele definities van dezelfde functie in hetzelfde JS-bestand.
4. Geen 3D-view die stil een leeg vlak toont.
5. Geen afhankelijkheid van live PDOK om de wizard überhaupt te kunnen gebruiken.
6. Verwijderen van dakdelen en zichtpunten moet met stabiele IDs, niet met broze array-indexen.
7. Demo-adres moet altijd een bruikbare route demonstreren.
8. Console moet schoon blijven bij de standaard testscenario’s.

## Buiten scope voor eerste Codex-implementatie

- Juridisch sluitende zichtanalyse
- Exacte paneelengineering
- Inloggen verplicht maken voordat de wizard bruikbaar is
- Volwaardige bestandsuploader
- Automatische vergunningsbeslissing
- Volledige AHN-raycasting

## Later uitbreiden

- echte AHN-hoogteanalyse per zichtlijn
- 3D screenshot export
- foto-upload met fotomontage
- automatische straatpuntdetectie via wegen/BGT
- koppeling met gemeentelijk beleid per gemeente
- solar-dossier tonen in `Mijn dossier`

## Acceptatiecriteria

De implementatie is goed genoeg als:

- `/zonnepanelen` visueel voelt als onderdeel van Monument Gids
- de wizard dezelfde rust en vrije navigatie heeft als de glaswizard
- demo-adres en handmatige invoer werken
- dakdelen toevoegen, selecteren, wijzigen en verwijderen betrouwbaar werken
- 2D kaart en 3D-view hebben duidelijke fout- en fallbackstaten
- zichtpunten en zichtanalyse in de concepttekst landen
- de code geen oude prototype-rommel of dubbele functies bevat
