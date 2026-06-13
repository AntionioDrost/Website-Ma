# Zeist Glasisolatie Demo Subpagina

## Samenvatting

We bouwen een nieuwe demo-subpagina binnen de bestaande `monument-app` voor bewoners en eigenaren in Zeist die glasisolatie willen aanvragen voor een monument, rijksmonument of pand in beschermd dorps- of stadsgezicht. De subpagina combineert een informatieve entree met een begeleide wizard. De wizard volgt de inhoudelijke logica van het bestaande glasformulier, maar in een vriendelijkere en duidelijkere online ervaring.

De demo is nadrukkelijk geen vervanging van het Omgevingsloket. De gebruiker wordt geholpen om het glasformulier volledig en beter onderbouwd voor te bereiden, tussentijds lokaal op te slaan en aan het eind als dossier te exporteren.

## Doel

- Bewoners stap voor stap begeleiden bij het correct invullen van het glasformulier.
- De drempel verlagen voor monumenteigenaren die niet weten welke informatie, foto’s en maten nodig zijn.
- De kans vergroten dat een aanvraag in één keer vollediger en bruikbaarder wordt voorbereid.
- De demo opzetten voor glasisolatie nu, maar met een structuur die later ook andere verduurzamingsmaatregelen kan ondersteunen.

## Doelgroep

- Eigenaren en bewoners van panden in gemeente Zeist.
- Rijksmonumenten.
- Gemeentelijke monumenten.
- Panden in beschermd dorps- of stadsgezicht waarvoor glasisolatie relevant is.

## Niet-doelen

- Geen formele vergunningaanvraag indienen.
- Geen account- of mailgestuurde hervatflow.
- Geen volledige generieke verduurzamingswizard voor alle maatregeltypen in deze eerste demo.
- Geen juridisch bindende vergunningstoets.

## Goedgekeurde productkeuzes

- Productvorm: hybride subpagina met uitleg plus wizard.
- Uitkomst: zowel tussentijds lokaal opslaan als een eindexport van het dossier.
- Scope: glasisolatie eerst, maar uitbreidbaar naar andere maatregelen.
- Start: eerst een korte geschiktheidscheck.
- Brongebruik `Een warme jas`: combinatie van directe visuele ondersteuning en gerichte verwijzingen.
- Hervatten: eenvoudige demo-opslag op hetzelfde apparaat en in dezelfde browser.

## Inhoudelijke uitgangspunten

De inhoud wordt gebaseerd op:

- het bestaande glasformulier;
- de toelichting bij het formulier;
- de Duurzame Monumentenregeling Zeist 2025 en het beoordelingskader;
- het RCE-afwegingskader voor vensterisolatie;
- relevante stappen en tekeningen uit `Een warme jas`.

De online ervaring mag niet klinken als een koud formulier. Wel moet de uitkomst voldoende precies zijn voor voorbereiding van een echte aanvraag.

## Gebruikerservaring

De subpagina heeft vijf blokken op één route:

1. `Intro`
   Korte uitleg voor wie deze route bedoeld is, wat de gebruiker ermee kan, en dat de demo de formele aanvraag niet vervangt.

2. `Geschiktheidscheck`
   Korte controle op gemeente, beschermingsregime en maatregeltype.

3. `Voorbereiding`
   Heldere checklist van wat de gebruiker bij de hand moet hebben, zoals adresgegevens, monumentstatus, foto’s, maten en eventuele offerte.

4. `Wizard`
   Een begeleide stap-voor-stap invulroute voor glasisolatie.

5. `Dossier en export`
   Overzicht van compleetheid, ontbrekende onderdelen en export als conceptdossier.

## Geschiktheidscheck

De route start met drie poorten:

- Ligt het pand in Zeist?
- Gaat het om een monument of pand in beschermd gezicht?
- Gaat de aanvraag over glasisolatie?

Wanneer de gebruiker buiten scope valt, stopt de demo niet hard. In plaats daarvan verschijnt een nette uitleg met een vervolgadvies, bijvoorbeeld dat de huidige demo alleen voor glasisolatie in Zeist is bedoeld.

## Wizardopbouw

De wizard bestaat uit zeven fasen.

### 1. Doelgroep en pand

- naam aanvrager;
- eigenaar indien anders;
- adres pand;
- monumentstatus;
- telefoonnummer;
- e-mailadres.

### 2. Om welke vensters gaat het

- gevel;
- windrichting;
- aantal identieke vensters;
- overzichtsfoto gevel;
- markering van de relevante vensters.

### 3. Bestaande situatie

- foto’s buiten;
- detailfoto’s binnen;
- ouderdom voor zover bekend;
- type openen bestaand raam;
- huidige tochtwering;
- ventilatie in bestaande situatie;
- technische staat van kozijn, raam en schilderwerk;
- luiken en sporen van luiken.

### 4. Huidig glas en oplossingsrichting

- soort glas;
- keuze `glas vervangen` of `achterzetramen`.

Deze stap markeert de belangrijkste inhoudelijke afslag in de wizard.

### 5A. Technische uitwerking bij glas vervangen

- afmetingen glas;
- sponningmaten;
- roedebreedte;
- schets sponning bestaand;
- mogelijkheid tot uitfrezen;
- technisch haalbare opties;
- gekozen verbetering;
- schets sponning nieuw;
- openen in nieuwe situatie;
- tochtwering nieuw;
- offertegegevens.

### 5B. Technische uitwerking bij achterzetramen

- plaats voorzetraam;
- type voorzetraam;
- indeling en wijze van openen;
- tochtwering nieuw;
- ventilatie van de spouw;
- offertegegevens.

### 6. Controle op compleetheid

- verplichte velden;
- foto’s;
- schetsen;
- technische maten;
- gekozen oplossingsrichting.

### 7. Dossier en export

- duidelijke samenvatting;
- wat compleet is;
- wat nog ontbreekt;
- export naar een net conceptdocument of PDF.

## Inhoudslaag per stap

Elke stap krijgt twee lagen:

- `Invullen`
  De feitelijke vragen, keuzen en uploads.
- `Waarom we dit vragen`
  Een korte uitleg in eenvoudig Nederlands die onzekerheid verlaagt en helpt bij het verzamelen van de juiste stukken.

De toon blijft rustig, menselijk en praktisch. De wizard mag wel precies zijn, maar nooit onnodig bureaucratisch.

## Gebruik van `Een warme jas`

`Een warme jas` wordt niet als volledig boek overgenomen. De demo gebruikt een combinatie van:

- korte contextuele toelichting;
- enkele relevante tekeningen of uitsneden bij lastige stappen;
- gerichte verwijzingen naar het juiste detail of onderwerp.

Belangrijkste toepassingsmomenten:

- uitleg dat regulier isolatieglas vaak niet zomaar past;
- verschil tussen historisch glas behouden en later glas vervangen;
- sponning, roeden en profielen;
- keuze tussen dun dubbelglas, gelamineerd isolatieglas, vacuümglas en achterzetramen.

## Brongebruik en assets

Voor de demo gaan we uit van de volgende aannames:

- de gemeente of het projectteam kan beschikken over de relevante tekeningen of uitsneden uit `Een warme jas`;
- alleen de meest relevante visuals worden gebruikt, niet volledige hoofdstukken of een volledige reproductie van het boek;
- visuals worden technisch voorbereid als losse web-assets of uitgesneden pagina-afbeeldingen.

Als deze assets niet direct beschikbaar blijken, valt de eerste implementatie terug op eigen toelichtende tekst met een compacte melding dat de verdiepende illustraties later worden toegevoegd.

## Opslaan en hervatten

Voor de demo geldt:

- opslaan gebeurt lokaal in de browser;
- hervatten werkt alleen op hetzelfde apparaat en in dezelfde browser;
- de gebruiker ziet duidelijk wanneer de laatste lokale opslag is bijgewerkt;
- er komt een handmatige knop `Opslaan en later verder`;
- auto-save mag aanvullend worden gebruikt, maar de UX communiceert de opslagstatus zichtbaar.

## Export

De export levert een conceptdossier op dat de gebruiker kan bewaren of gebruiken voor verdere voorbereiding. Voor de eerste demo is de minimale eis:

- alle antwoorden samengevoegd;
- ontbrekende onderdelen gemarkeerd;
- gekozen oplossingsrichting opgenomen;
- overzicht van benodigde bijlagen zichtbaar.

De eerste implementatie levert een printvriendelijke dossierweergave op die de gebruiker direct als PDF kan opslaan vanuit de browser.

## Technische ontwerpkeuzes

De demo wordt toegevoegd aan de bestaande `monument-app` als aparte route met eigen front-end state. Waar nuttig worden bestaande patronen hergebruikt:

- bestaande serverrouter voor nieuwe publieke route;
- bestaande visuele taal uit `styles.css`;
- bestaande appstructuur voor statische pagina’s;
- bestaande adres- of profielverrijking mag worden hergebruikt als dat de demo eenvoudiger en consistenter maakt.

De wizard krijgt een eigen state-model met:

- geschiktheidscheck;
- voortgang per stap;
- formuliervelden;
- uploadreferenties of een duidelijke markering dat een bijlage in deze demoversie nog handmatig wordt voorbereid;
- gekozen route `glas vervangen` of `achterzetramen`;
- opslagstatus;
- compleetheidsstatus;
- exportsamenvatting.

## Structuur voor latere uitbreiding

Hoewel deze demo alleen glasisolatie ondersteunt, wordt de informatiestructuur zo opgezet dat later ook andere maatregeltypen kunnen worden toegevoegd. Dat betekent:

- een generieke bovenstructuur voor `check -> voorbereiding -> wizard -> dossier`;
- maatregel-specifieke stapconfiguraties;
- maatregel-specifieke hulpblokken;
- maatregel-specifieke exportvelden.

## Validatie en foutafhandeling

- Verplichte velden blokkeren alleen de relevante vervolgstap.
- Onwaarschijnlijke technische maten geven een zachte waarschuwing.
- Ontbrekende foto’s en schetsen blijven zichtbaar in de compleetheidscheck.
- Buiten-scope gebruikers krijgen een nette uitroute.
- Als lokale opslag niet beschikbaar is, meldt de pagina dit direct en valt de flow terug op alleen de actieve sessie.

## Toetsing aan inhoudelijke kaders

De demo moet de volgende inhoudelijke principes uit de bronstukken respecteren:

- behoud gaat voor vernieuwen;
- historisch of bijzonder glas vraagt om meer terughoudendheid;
- omkeerbare en minder zichtbare maatregelen hebben de voorkeur;
- technische haalbaarheid en monumentwaarde moeten in balans blijven;
- ventilatie en bouwfysische gevolgen horen expliciet meegewogen te worden.

De demo zelf voert geen definitieve erfgoedafweging uit, maar helpt de gebruiker de relevante input daarvoor goed te verzamelen.

## Testaanpak

- scope-check voor gebruikers binnen en buiten de doelgroep;
- volledig pad voor `glas vervangen`;
- volledig pad voor `achterzetramen`;
- opslag en hervatten in dezelfde browser;
- export bevat antwoorden en signaleert open punten;
- hulpblokken uit `Een warme jas` verschijnen op de juiste stappen;
- copy blijft begrijpelijk voor niet-professionele gebruikers.

## Risico’s

- De demo kan te technisch aanvoelen als de meetstappen te vroeg of te kaal komen.
- Zonder goed voorbereide visuals uit `Een warme jas` verliest de wizard veel uitlegkracht.
- Lokale opslag kan door gebruikers worden overschat als “definitief bewaard”.
- Als export te veel op het bronformulier lijkt zonder goede UX-laag, voelt de route alsnog formulierachtig.

## Beslissing

We bouwen een nieuwe demo-subpagina in de bestaande `monument-app` voor glasisolatie in Zeist. De route combineert doelgroepcheck, voorbereiding, een begeleide wizard, lokale opslag, contextuele hulp uit `Een warme jas` en een exporteerbaar conceptdossier. De structuur wordt meteen uitbreidbaar opgezet voor andere verduurzamingsmaatregelen in een latere fase.
