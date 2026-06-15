# Mijn Dossier Design

## Samenvatting

We voegen een nieuwe productpagina `Mijn dossier` toe aan Monument Gids. Op deze pagina ziet de gebruiker alle bekende gegevens uit zijn of haar dossiers op een rustige, controleerbare plek, met inline bewerken per sectie. De pagina leest bestaande dossierrecords uit Supabase via `application_dossiers`, ondersteunt in v1 de dossierbronnen `intake` en `glass`, en is voorbereid op latere extra routes.

De ervaring moet aanvoelen als een kalme controleplek, niet als een extra formulier of nieuwe wizard. De gebruiker moet snel kunnen zien:

- wat al bekend is
- waar de gegevens vandaan komen
- wat nog ontbreekt
- wat eventueel tegenstrijdig is
- wat direct aangepast kan worden

## Doel

De nieuwe pagina verlaagt frictie tussen verzamelen en controleren. Nu zijn gegevens verspreid over de intakechat en de glaswizard. Daardoor is het lastig om in één oogopslag te zien wat al bekend is en wat aangepast moet worden. `Mijn dossier` wordt de vaste plek voor overzicht, correctie en vertrouwen.

## In Scope

- Nieuwe hoofdroute `Mijn dossier`
- Nieuwe pagina binnen de bestaande app-shell
- Inladen van alle dossierrecords voor de huidige gebruiker
- Samengevoegde overzichtslaag voor gedeelde kernvelden
- Aparte secties voor `Pand en context`, `Intake`, `Glaswizard`
- Inline bewerken per sectie
- Opslaan naar Supabase per onderliggend dossierrecord
- Basisweergave van broninformatie per veld of sectie
- Subtiele conflictmelding voor gedeelde kernvelden
- Leegstaat, foutstaat en gedeeltelijk gevulde staten
- Mobiele en desktopvriendelijke weergave

## Buiten Scope

- Nieuwe wizardstappen of nieuwe intakevragen
- Herontwerp van de intakechat of glaswizard zelf
- Volledige bestandsuploader of mediabeheer
- Automatische conflictresolutie tussen dossiers
- Audittrail of tijdlijn per wijziging
- Nieuwe database-tabellen of schemawijzigingen

## Gebruikersverhaal

Als monumenteigenaar wil ik op één plek kunnen zien wat ik al heb ingevuld, zodat ik fouten kan herstellen, ontbrekende gegevens kan aanvullen en met meer rust verder kan in mijn dossier.

## Informatiearchitectuur

De nieuwe pagina komt als gelijkwaardige route in de navigatie naast:

- `Thuis`
- `Intakechat`
- `Glaswizard`
- `Mijn dossier`

De pagina krijgt vier hoofdgebieden:

1. Bovenste overzichtskaart
2. Sectie `Pand en context`
3. Sectie `Intake`
4. Sectie `Glaswizard`

Een eenvoudige blokweergave voor `Bestanden en stukken` kan in v1 als onderdeel van `Glaswizard` of als onderblok op de pagina landen, zolang het geen volwaardig uploadbeheer hoeft te zijn.

## Ervaring En Layout

### 1. Overzichtskaart

Doel: de gebruiker snel rust geven met een samenvatting van de belangrijkste gegevens.

Inhoud:

- naam
- adres
- e-mailadres
- monumentstatus
- actieve maatregel of route
- voortgang per dossier

Gedrag:

- alleen lezen
- compacte statuschips of voortgangslabels
- geen tabeluitstraling

### 2. Pand en context

Doel: gedeelde gegevens samenbrengen die route-overstijgend zijn.

Inhoud:

- eigenaar of aanvrager
- adres
- postcode
- plaats of gemeente
- monumentstatus
- huidig gebruik
- beschermde waarden
- globale maatregelomschrijving
- doel van de ingreep

Gedrag:

- standaard leesmodus
- knop `Aanpassen`
- inline editmodus met veldtypes passend bij de inhoud
- knopzone met `Opslaan` en `Annuleren`

### 3. Intake

Doel: de gebruiker laten zien wat uit de intakechat is opgebouwd zonder de chat zelf te herhalen.

Inhoud:

- korte samenvatting
- kernvelden uit `profile`
- gekozen maatregelen
- open punten uit `guidance.missingItems`
- documentenindicatie

Gedrag:

- compact en controleerbaar
- geen chatbubbels of gesprekslog
- inline aanpassen op relevante velden

### 4. Glaswizard

Doel: de gebruiker inzicht geven in de concrete routegegevens van het glasisolatiedossier.

Inhoud:

- geschiktheidscheck
- pand- en contactvelden
- routekeuze
- vensterinformatie
- technische routegegevens
- reviewstatus

Gedrag:

- compacter en taakgerichter dan intake
- inline bewerken voor velden die nu al in state zitten
- route-specifieke informatie blijft zichtbaar gegroepeerd

## Dataontwerp

De pagina gebruikt twee lagen:

### Samenvattingslaag

Een afgeleide viewmodel-laag voor gedeelde kerninformatie:

- `name`
- `email`
- `address`
- `postcode`
- `city`
- `municipality`
- `monumentStatus`
- `currentUse`
- `protectedValues`
- `measureDescription`
- `measureGoal`
- `activeRoutes`
- `conflicts`

Deze laag wordt niet als apart dossier opgeslagen, maar tijdens renderen samengesteld.

### Bronnenlaag

De ruwe dossierstates blijven per `dossier_type` leidend:

- `intake.state`
- `glass.state`

Wijzigingen worden altijd teruggeschreven naar het bijbehorende bronrecord.

## Bronprioriteit

Voor gedeelde velden gebruiken we in v1 een expliciete voorkeursvolgorde:

- `naam`, `email`, `adres`, `monumentstatus`: eerst `glass`, anders `intake`
- `maatregelomschrijving` en `doel`: toon samengevoegd, maar behoud bronvermelding
- route-specifieke technische velden: alleen vanuit hun eigen dossier

Als twee bronnen verschillende waarden hebben voor hetzelfde kernveld:

- toon de voorkeurswaarde
- toon een subtiele conflictmelding
- toon broninformatie zodat de gebruiker kan corrigeren

We overschrijven nooit stilletjes beide bronnen tegelijk zonder expliciete mappingkeuze.

## Technisch Ontwerp

### Nieuwe bestanden

- `monument-app/public/mijn-dossier.html`
- `monument-app/public/mijn-dossier.js`

### Aan te passen bestanden

- `monument-app/public/styles.css`
- `monument-app/public/thuis.html`
- `monument-app/public/intake.html`
- `monument-app/public/glasisolatie-demo.html`
- `monument-app/public/thuis.js`
- `monument-app/public/dossier-store.js`
- `monument-app/server.mjs`

### Serverrouting

`server.mjs` krijgt een extra route:

- `/mijn-dossier`

Deze route serveert `public/mijn-dossier.html` binnen hetzelfde patroon als `/thuis`, `/intake` en `/glasisolatie-demo`.

### Dossier-store uitbreidingen

`dossier-store.js` krijgt helpers voor:

- ophalen van alle dossiers van de huidige gebruiker
- laden van één dossier met fallback
- opslaan van één dossier

Waarschijnlijke helpers:

- `loadAllRemoteDossiers()`
- `hydrateAllDossiers()`
- `saveRemoteDossier()`

De bestaande per-dossier helperstructuur blijft bruikbaar. We voegen alleen multi-dossierondersteuning toe in plaats van die te vervangen.

### Viewmodel-mapping

`mijn-dossier.js` krijgt een mappinglaag die ruwe data omzet naar:

- overzichtskaartdata
- gedeelde contextvelden
- intake-sectiegegevens
- glaswizard-sectiegegevens
- conflictinformatie

Deze mappinglaag voorkomt dat de UI direct leunt op elk intern statepad uit intake en glass.

## Bewerkflow

Standaard staat elke sectie in leesmodus.

Per sectie:

1. gebruiker klikt `Aanpassen`
2. alleen die sectie gaat naar editmodus
3. de gebruiker past velden aan
4. gebruiker kiest `Opslaan` of `Annuleren`
5. bij `Opslaan` wordt alleen het betreffende bronrecord bijgewerkt
6. na succes keert de sectie terug naar leesmodus met bevestiging

Belangrijke UX-keuzes:

- geen modals voor standaard bewerken
- geen full-page edit mode
- geen page refresh na save
- leesbare labels in B1-Nederlands
- foutmeldingen in menselijke taal

## State En Opslag

### Laden

Bij paginastart:

1. auth controleren via bestaande `requireAuthPage()`
2. alle dossierrecords van de gebruiker ophalen
3. ontbrekende dossierbronnen opvangen met lege states
4. viewmodel afleiden
5. pagina renderen

### Opslaan

Bij opslaan van een sectie:

1. local draft valideren
2. ruwe bronstate immutably bijwerken
3. `saveRemoteDossier()` aanroepen voor het relevante `dossier_type`
4. bij succes UI verversen met nieuwe bronstate
5. bij fout editstatus behouden en fout tonen

### Validatie

V1 gebruikt lichte clientvalidatie:

- verplichte tekstvelden mogen niet per ongeluk naar ongeldige types veranderen
- e-mailveld krijgt eenvoudige formatcontrole
- selectvelden mogen alleen bekende waarden opslaan waar relevant

We voegen geen zware formele validatielaag toe zolang bestaande flows dat ook niet doen.

## Lege, Gedeeltelijke En Foutstaten

### Leegstaat

Als er nog geen dossiers zijn:

- toon warme leegstaat
- leg uit dat hier later alle ingevulde gegevens verschijnen
- bied directe links naar `Intakechat` en `Glaswizard`

### Gedeeltelijke staat

Als alleen intake of alleen glass bestaat:

- toon beschikbare sectie gevuld
- toon andere sectie als `Nog niet gestart`

### Foutstaat bij laden

Als Supabase niet laadt:

- toon foutkaart in de main-content
- bied `Opnieuw proberen`
- laat de rest van de shell intact

### Foutstaat bij opslaan

Als save mislukt:

- bewaar draft in de actieve sectie
- toon duidelijke foutmelding
- laat gebruiker opnieuw proberen zonder data te verliezen

## Conflicten

In v1 signaleren we alleen lichte inhoudelijke conflicten op kernvelden, bijvoorbeeld:

- adres
- e-mailadres
- monumentstatus
- maatregelomschrijving

We lossen conflicten niet automatisch op. De UI toont:

- actieve waarde
- bronvermelding
- korte melding dat een andere route iets anders bevat

De gebruiker corrigeert daarna bewust in de juiste sectie.

## Toegankelijkheid

- alle invoer krijgt gekoppelde labels
- editknoppen krijgen duidelijke naamgeving
- succes- en foutmeldingen worden tekstueel aangekondigd
- focus blijft binnen de sectie na enter/exit van editmodus
- mobiele layout blijft stapelbaar en leesbaar
- contrast blijft in lijn met de bestaande appstijl

## Testing

Minimaal te verifiëren:

- laden met alleen intake
- laden met alleen glass
- laden met beide dossiers
- inline bewerken van intakevelden
- inline bewerken van glasvelden
- conflictweergave
- leegstaat
- mobiele layout
- foutmelding bij save failure
- sessie-afhandeling via bestaande auth

## Risico's

- intake en glass gebruiken verschillende statevormen, dus mapping moet bewust en klein blijven
- gedeelde velden hebben niet altijd exact dezelfde betekenis in beide routes
- bestandstatussen in glass zijn deels afgeleid uit booleans en bestandsnamen, dus de eerste versie moet daar bescheiden in blijven

## Aanbevolen Implementatiefase

### Fase 1

- route `Mijn dossier`
- overzichtskaart
- secties `Pand en context`, `Intake`, `Glaswizard`
- inline edit per sectie
- Supabase multi-dossier laden
- save per bronrecord
- lichte conflictweergave

### Fase 2

- rijkere bestandsweergave
- extra dossier_types
- expliciete conflictresolutie
- betere progressweergave over routes heen

## Definitie Van Klaar

Deze feature is klaar wanneer:

- de gebruiker `Mijn dossier` vanuit de hoofdnav kan openen
- de pagina intake- en glasdossierdata van Supabase laadt
- gedeelde kerngegevens overzichtelijk samengebracht zijn
- de gebruiker per sectie inline kan aanpassen
- wijzigingen correct teruggeschreven worden naar het juiste dossierrecord
- fout- en leegstaten netjes afgehandeld zijn
- de pagina op mobiel en desktop goed bruikbaar blijft
