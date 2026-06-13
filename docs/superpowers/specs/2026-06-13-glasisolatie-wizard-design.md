# Glasisolatie Wizard Redesign

## Doel

De glasformulierpagina moet veranderen van een lange, licht overweldigende demo naar een rustige, gesegmenteerde wizard. De gebruiker moet altijd kunnen zien waar hij in het proces zit, zonder het gevoel te krijgen dat hij vastzit of eerst een heel formulier moet overzien.

De ervaring moet drie dingen tegelijk oplossen:

- duidelijke voortgang tonen
- cognitieve belasting verlagen door per segment te werken
- later huisdata uit een gekoppeld huisdossier automatisch kunnen voorinvullen

## Beslissing

We bouwen de flow om naar een volledige wizard met vrije navigatie.

Dat betekent:

- steeds staat een segment centraal
- de gebruiker kan via de voortgangsbalk altijd naar andere stappen springen
- validatie helpt, maar sluit de gebruiker niet op in een stap
- automatische voorinvulling uit huisdata wordt voorbereid in de state-architectuur

## Gewenste ervaring

De pagina moet aanvoelen als een rustig dossierproces in plaats van een formulierwand.

De gebruiker ziet:

1. een heldere voortgangsbalk bovenin
2. een actieve stap in een rustige werkzone
3. compacte ondersteuning rondom de actieve stap

De gebruiker hoeft niet te raden:

- waar hij nu is
- wat al klaar is
- wat later nog komt
- welke gegevens al uit het huisdossier komen

## Voortgangsbalk

De progress bar wordt het primaire orientatiepunt van de wizard.

### Opbouw

- horizontale rail boven de actieve stap
- per stap een bolletje en een label
- tussen de stappen een verbindende pijl

### States

- `toekomstig`: creme bolletje, rustige tekst, neutrale pijl
- `actief`: creme bolletje met groene focusring en subtiele highlight
- `voltooid`: groen bolletje, groene tekstaccenten, groene pijl naar de volgende stap

### Gedrag

- elke stap in de progress bar is klikbaar
- de gebruiker mag vrij vooruit en terug springen
- de progress bar toont alleen stapnamen en status, geen extra samenvatting erboven of eronder

## Wizardstructuur

De wizard blijft inhoudelijk gebaseerd op de bestaande glasdemo, maar verandert in presentatie en navigatie.

### Hoofdopzet

- de voorbereidende context blijft bestaan, maar wordt visueel secundair aan de wizard
- steeds is slechts een stap prominent zichtbaar
- niet-actieve stappen blijven technisch beschikbaar, maar worden niet allemaal tegelijk getoond

### Actieve stap

Elke actieve stap bevat:

- een duidelijke titel
- korte uitleg waarom deze stap ertoe doet
- relevante velden voor alleen die stap
- optionele badges of helpertekst voor huisdata-voorinvulling
- een duidelijke primaire vervolgactie

### Ondersteunende context

Secundaire informatie blijft beschikbaar, maar mag de werkzone niet domineren:

- wat nog ontbreekt
- welke bijlagen handig zijn
- bronuitleg of referentiebeelden

## Navigatie en vrijheid

De wizard mag niet voelen als een slot.

### Regels

- de gebruiker kan altijd terug
- de gebruiker kan altijd via de progress bar naar een andere stap
- validatie mag waarschuwen, maar niet blokkeren op tussentijdse navigatie
- alleen eindacties zoals exporteren of dossier afronden mogen een complete-check afdwingen

### Feedback

Als een stap onvolledig is, tonen we een korte, concrete melding in of boven de actieve stap, bijvoorbeeld:

`Voor deze stap missen nog 2 onderdelen.`

Daarbij horen directe focuslinks of visuele markering op de relevante velden.

## Validatie

Validatie moet ondersteunend zijn, niet straffend.

### Principes

- velden worden pas duidelijk als onvolledig gemarkeerd nadat de gebruiker met die stap heeft gewerkt of probeert verder te gaan
- onvolledigheid beinvloedt de status van de stap in de progress bar
- onvolledigheid mag niet voorkomen dat iemand eerst andere stappen bekijkt of corrigeert

### Hard stops

De enige harde blokkades zitten op acties die een bruikbaar dossier vereisen:

- exporteren
- definitieve afronding

## Motion-richting

De motion moet productmatig en rustig aanvoelen. Orientatie en feedback zijn belangrijker dan spektakel.

### Weging

- Primary: Emil Kowalski
- Secondary: Jakub Krehel

### Toepassing

- snelle stapwissels, ongeveer 180-220ms
- lichte enter transition met opacity, kleine translateY en subtiele blur naar scherp
- exit subtieler dan enter
- geen grote slide-bewegingen, geen parallax, geen looping aandachtstrekkers
- progress states animeren kleur en fill, niet de layout

### Accessibility

- `prefers-reduced-motion` schakelt over naar directe of vrijwel directe statewissels
- alle taken moeten volledig bruikbaar blijven zonder motion

## Huisdata en latere Supabase-koppeling

De UI moet nu al voorbereid worden op automatische voorinvulling uit een huisdossier.

### Gewenst gedrag

- zodra relevante huisdata beschikbaar is, worden velden automatisch vooringevuld
- zulke velden krijgen een duidelijk label zoals `Ingevuld uit huisdossier`
- de gebruiker mag elk vooringevuld veld overschrijven
- zodra een gebruiker een veld handmatig wijzigt, blijft zichtbaar dat dit een gebruikerswijziging is

### State-model

Naast de bestaande formulierstate introduceren we een aparte `houseProfile`-laag en een herkomstlaag voor velden.

Voorbeelden van benodigde concepten:

- `houseProfile`: ruwe data uit huisdossier of latere Supabase-bron
- `fieldSources`: per veld bijhouden of de waarde komt uit default, houseProfile of user
- `editedByUser`: expliciete override-status voor velden die eerst automatisch waren ingevuld

### Waarom dit nu al nodig is

Zonder deze scheiding wordt de latere Supabase-koppeling rommelig:

- onduidelijk waar een waarde vandaan komt
- lastig te tonen wat automatisch is ingevuld
- lastig te bewaren wat een gebruiker bewust heeft aangepast

## Implementatiescope

De eerste implementatieslag blijft bewust scherp.

### In scope

1. de verticale of zijbalk-voortgang vervangen door een horizontale, sticky progress bar boven de wizard
2. de actieve stap visueel centraler maken en niet-actieve stappen verbergen
3. vrije stapnavigatie toevoegen via de progress bar
4. validatie versoepelen zodat die ondersteunt in plaats van opsluit
5. voorbereid `houseProfile`- en veldherkomstmodel toevoegen zonder echte Supabase-calls
6. rustige motion toevoegen aan stapwissels en progress states

### Buiten scope

- echte Supabase-koppeling
- productieklare database-sync
- inhoudelijke herschrijving van de volledige glasroute
- nieuwe serverlogica behalve als een kleine mockstructuur nodig blijkt

## Verwachte bestandsimpact

De kern van het werk zit in:

- `monument-app/public/glasisolatie-demo.html`
- `monument-app/public/glasisolatie-demo.css`
- `monument-app/public/glasisolatie-demo.js`

Mogelijk later aanvullend:

- `monument-app/server.mjs`, alleen als een mock house-profile route nodig blijkt

## Risico's

- Te veel visuele compressie kan technische stappen onduidelijk maken.
- Te veel statusinformatie rondom de wizard kan de rust alsnog breken.
- Automatische voorinvulling zonder heldere herkomstmarkering kan verwarrend of onbetrouwbaar voelen.

Daarom moet de implementatie steeds toetsen op:

- rust
- duidelijk eigenaarschap van data
- vrijheid zonder chaos

## Samenvatting

We bouwen de glasdemo om naar een rustige, vrij navigeerbare wizard met:

- één centrale stap tegelijk
- een duidelijke creme-naar-groen voortgangsbalk met pijlen
- niet-blokkerende validatie
- voorbereidende architectuur voor automatische huisdata-voorinvulling
- snelle, subtiele motion die orientatie ondersteunt
