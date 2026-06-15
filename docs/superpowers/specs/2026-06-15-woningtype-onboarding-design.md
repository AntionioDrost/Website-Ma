# Woningtype als verplichte stap na locatiecheck

## Doel

We maken `buildingType` een verplichte onboardingstap direct na een succesvolle locatiecheck in de intakechat van Monument Gids. De gebruiker kan pas verder met de onboarding nadat een woningtype is gekozen uit een vaste lijst.

## Gebruikersvraag

Als gebruiker wil ik direct na de locatiecheck mijn woningtype kiezen, zodat het dossier eerder de juiste context heeft en de onboarding niet doorgaat zonder dit kerngegeven.

## Scope

In scope:
- `buildingType` toevoegen aan de verplichte intakevolgorde
- vaste keuzelijst met woningtypes via chat quick replies
- blokkeren van verdere onboarding tot een keuze is gemaakt
- tonen van `buildingType` in voortgang en kernvelden
- regressietests voor de nieuwe flow

Niet in scope:
- automatische bronlookup voor woningtype
- vrije tekst invoer
- extra woningcategorieen buiten de afgesproken lijst
- wijzigingen aan andere pagina's dan nodig voor consistente dossierweergave

## Vaste opties

De quick replies voor woningtype worden:
- `Villa`
- `Hallenhuisboerderij`
- `Bungalow`
- `Grachtenpand`
- `Rijtjeshuis interbellum`
- `Anders`

## Gewenst gedrag

Na een succesvolle adresmatch via de bestaande officiele lookup wordt `buildingType` het eerstvolgende verplichte veld. De assistant meldt kort dat de locatiecheck is gelukt en vraagt daarna direct om het woningtype te kiezen.

Zolang `buildingType` leeg is:
- blijft dit het eerstvolgende ontbrekende intakeveld
- gaat de flow niet door naar `monumentStatus`, `protectedValues`, `currentUse` of maatregelvragen
- blijven alleen de woningtype-opties als quick replies beschikbaar

Na selectie van een woningtype:
- wordt `buildingType` opgeslagen in het profiel
- wordt de voortgang opnieuw berekend
- gaat de onboarding door naar de volgende bestaande intakevraag

## Productbeslissingen

We houden deze stap in de chatflow en bouwen geen apart formulierblok. Dat sluit het best aan op de huidige intake-ervaring en vraagt de kleinste UI-ingreep.

`Anders` is voorlopig toegestaan als vaste optie om te voorkomen dat gebruikers vastlopen wanneer hun pand niet goed in de lijst past.

## Technisch ontwerp

### Server

In `monument-app/server.mjs`:
- voeg `buildingType` toe aan de toegestane `nextMissingField`-waarden
- neem `buildingType` op in `findNextMissingField`
- neem `buildingType` op in `chooseGuidedFreeField`
- voeg een expliciete vervolgvraag toe voor `buildingType`
- voeg quick replies toe voor `buildingType`
- voeg `buildingType` toe aan `buildNextStepLabelFromField`
- voeg `buildingType` toe aan de stage-indeling als onderdeel van `Monumentanalyse`

De bestaande vrije tekstdetectie voor `buildingType` mag blijven bestaan als ondersteunende extractie, maar de flow mag pas door wanneer het veld daadwerkelijk gevuld is.

### Frontend

In `monument-app/public/intake.js` en `monument-app/public/intake.html`:
- neem `buildingType` zichtbaar op in de kernveldenweergave rechts
- neem `buildingType` op in de voortgangsberekening
- zorg dat ontvangen quick replies netjes klikbaar blijven voor deze stap

Er is geen nieuwe componentstructuur nodig; de bestaande chat- en dashboardweergave volstaat.

## Testplan

We voegen regressietests toe voor:
- succesvolle locatiecheck gevolgd door verplichte vraag naar woningtype
- quick replies met exact de zes woningtype-opties
- doorgaan naar de volgende intakestap nadat `buildingType` is gekozen
- blokkeren van de flow zolang `buildingType` niet is ingevuld

## Risico's en randgevallen

- Sommige panden passen maar losjes in de lijst. Dat vangen we voorlopig op met `Anders`.
- Bestaande dossiers zonder `buildingType` zullen in deze flow alsnog naar deze stap geleid worden zodra de intake verdergaat.
- Omdat woningtype niet uit een officiele bron komt, moet de UI dit impliciet behandelen als gebruikersinvoer en niet als lookup-resultaat.

## Betrokken bestanden

- `monument-app/server.mjs`
- `monument-app/public/intake.js`
- `monument-app/public/intake.html`
- `monument-app/scripts/regression-intake.mjs`
