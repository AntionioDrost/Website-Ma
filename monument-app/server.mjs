import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 4173);
const locationSearchUrl = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";
const bagApiBase = "https://api.pdok.nl/kadaster/bag/ogc/v2";
const heritageApiBase = "https://api.pdok.nl/rce/beschermde-gebieden-cultuurhistorie/ogc/v1";
const roadTypes = [
  "straat",
  "laan",
  "weg",
  "plein",
  "gracht",
  "singel",
  "kade",
  "steeg",
  "pad",
  "dreef",
  "boulevard",
  "allee",
  "plantsoen",
  "hof",
  "erf",
  "park",
  "wal",
  "markt",
  "vaart",
  "dijk",
];
const roadTypePattern = roadTypes.join("|");
const runtimeConfig = loadRuntimeConfig();

const emptyProfile = {
  street: "",
  houseNumber: "",
  postcode: "",
  city: "",
  municipality: "",
  buildingAge: "",
  buildingType: "",
  currentUse: "",
  ownershipRole: "",
  monumentStatus: "",
  protectedView: "",
  protectedValues: "",
  measureDescription: "",
  measureLocation: "",
  measureGoal: "",
  supportFocus: "",
  documentsAvailable: "",
  notes: "",
};

const emptyLookupResult = {
  foundFields: [],
  profile: { ...emptyProfile },
  resolvedAddress: "",
  sources: [],
  status: "not_attempted",
  suggestion: null,
};

const emptyMeasureContext = {
  annualGasUsage: "",
  currentHeatingSystem: "",
  currentTopic: "",
  exteriorVisibility: "",
  heatingEmitters: "",
  insulationLevel: "",
  measureGoal: "",
  measureIntent: "",
  measureVariant: "",
  primaryMeasure: "",
};

const measureCatalog = [
  "Glasvervanging",
  "Dakisolatie",
  "Vloerisolatie",
  "Gevelisolatie",
  "Warmtepomp",
  "Zonnepanelen",
  "Ventilatie",
  "Dakkapel",
];

const monumentStatuses = [
  "Onbekend",
  "Geen status genoemd",
  "Rijksmonument",
  "Gemeentelijk monument",
  "Beschermd stadsgezicht",
  "Beschermd dorpsgezicht",
  "Beeldbepalend pand",
  "Geen monumentstatus",
];

const intakeSchema = z.object({
  reply: z.string(),
  extractedProfile: z
    .object({
      street: z.string().default(""),
      houseNumber: z.string().default(""),
      postcode: z.string().default(""),
      city: z.string().default(""),
      municipality: z.string().default(""),
      buildingAge: z.string().default(""),
      buildingType: z.string().default(""),
      currentUse: z.string().default(""),
      ownershipRole: z.string().default(""),
      monumentStatus: z.string().default(""),
      protectedView: z.string().default(""),
      protectedValues: z.string().default(""),
      measureDescription: z.string().default(""),
      measureLocation: z.string().default(""),
      measureGoal: z.string().default(""),
      supportFocus: z.string().default(""),
      documentsAvailable: z.string().default(""),
      notes: z.string().default(""),
    })
    .default(emptyProfile),
  measureMentions: z.array(z.string()).default([]),
  dossierSummary: z.string().default(""),
  nextMissingField: z
    .enum([
      "street",
      "houseNumber",
      "postcode",
      "municipality",
      "buildingAge",
      "monumentStatus",
      "protectedValues",
      "currentUse",
      "measureDescription",
      "measureLocation",
      "measureGoal",
      "documentsAvailable",
      "none",
    ])
    .default("none"),
});

const openai = runtimeConfig.openaiApiKey ? new OpenAI({ apiKey: runtimeConfig.openaiApiKey }) : null;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const systemPrompt = `
Je bent Monumentenverkenner, een warme Nederlandse monumenten- en vergunningscoach voor verduurzaming, onderhoud, restauratie en verbouwing van oudere panden.

Jouw rol:
- Begeleid de gebruiker van A tot Z bij een aanvraag.
- Werk als een projectbegeleider, niet als een algemene chatbot.
- Verzamel zo veel mogelijk bruikbare informatie via chat, zonder te gokken.
- Houd het gesprek compact, natuurlijk en behulpzaam.
- Schrijf in vriendelijk B1-Nederlands.

Verplichte werkwijze:
- Geef nooit direct inhoudelijk advies als de basis nog niet compleet is.
- Start altijd met het vaststellen van adres, gemeente, monumentstatus, beschermde waarden en het type ingreep.
- Als een gebruiker een maatregel noemt, werk dan stap voor stap toe naar een compleet dossier:
  doel van de maatregel,
  plek van de ingreep,
  betrokken bouwdelen,
  huidige situatie,
  beschikbare foto's,
  beschikbare tekeningen of offertes,
  gewenste planning.
- Gebruik alleen deze maatregelnamen als maatregel wordt genoemd: ${measureCatalog.join(", ")}.
- Gebruik voor monumentStatus bij voorkeur een van deze waarden als het past: ${monumentStatuses.join(", ")}.
- Vul nooit informatie in die niet expliciet uit het gesprek of de officiële lookup volgt.
- Als iets onbekend is, laat het leeg in extractedProfile.
- Als adres bekend is, gebruik de reeds gevonden officiële BAG- en erfgoedgegevens.
- Als de officiële lookup geen exacte adresmatch vond, vraag om bevestiging en doe nog geen definitieve aanname.
- Als de basis bekend is, mag je kort aangeven wat waarschijnlijk nog nodig is voor vergunning, tekeningen en subsidie, maar altijd voorzichtig en niet juridisch bindend.

Toon:
- Deskundig, praktisch, geduldig en helder.
- Reageer alsof je naast de gebruiker zit.

Outputregels:
- reply is de tekst die direct aan de gebruiker wordt getoond.
- extractedProfile bevat alleen velden die echt uit het gesprek of de meegegeven officiële lookup zijn af te leiden.
- measureMentions bevat alleen maatregelen die de gebruiker noemde of duidelijk bevestigde.
- dossierSummary is een ultrakorte samenvatting van wat nu bekend is.
- nextMissingField is het belangrijkste ontbrekende veld dat je hierna zou willen ophalen.
`.trim();

const modePrompts = {
  "guided-free": `
Actieve chatmodus: Vrije intake.

Werk hybride:
- Laat de gebruiker eerst vrij vertellen wat er speelt, ook als het verhaal nog rommelig of onvolledig is.
- Haal actief context uit vrije tekst voordat je naar verplichte intakevelden springt.
- Vat kort samen wat je al begrijpt zodra daar aanleiding voor is.
- Reageer alsof je een capabele gesprekspartner bent, niet alsof je een intakeformulier afwerkt.
- Stel alleen een vervolgvraag als dat natuurlijk voelt. Soms is een korte reflectie of mini-samenvatting beter dan meteen weer een vraag.
- Vermijd intake-taal zoals "ik mis nog", "volgende veld", "stap voor stap dossier compleet maken" tenzij het echt nodig is.
- Geef in vrije modus prioriteit aan het plan, de maatregel, de context en de hulpvraag van de gebruiker; detailvragen over monumentwaarden mogen later komen.
- Onderbreek de gebruiker niet onnodig met formulierachtige vragen als de context nog duidelijk aan het landen is.
- Als adres, monumentstatus of ingreep nog echt cruciaal ontbreken, stuur dan vriendelijk terug naar dat ene punt.
- Als de gebruiker zegt "geen idee", "weet ik niet" of iets vergelijkbaars, herhaal dan niet meteen exact dezelfde vraag.
- Erken kort dat dat prima is, ga vloeiend door met een ander nuttig onderwerp en kom alleen later terug op dat punt als het echt nodig is.
- Gebruik quick replies alleen als ze echt helpen; liever geen quick-reply-gevoel bij gewone intakebeurten.
- Klink als een projectbegeleider die meedenkt, niet als een checklist.
`.trim(),
  strict: `
Actieve chatmodus: Strakke intake.

Werk strak:
- Stuur nadrukkelijk op een compleet dossier.
- Vraag maximaal 1 concrete vervolgvraag per beurt.
- Werk in vaste intakevolgorde richting adres, monumentstatus, beschermde waarden en maatregel.
- Wees directer en compacter dan in de vrije modus.
- Gebruik quick replies gerust als ze de intake versnellen.
`.trim(),
};

export async function handleHealthRequest() {
  return {
    authRequired: runtimeConfig.authRequired,
    addressLookup: true,
    configured: Boolean(openai),
    measures: measureCatalog,
    ok: true,
    supabaseConfigured: Boolean(runtimeConfig.supabaseUrl && runtimeConfig.supabasePublishableKey),
  };
}

export async function handleClientConfigRequest() {
  return {
    authRequired: runtimeConfig.authRequired,
    supabasePublishableKey: runtimeConfig.supabasePublishableKey,
    supabaseUrl: runtimeConfig.supabaseUrl,
  };
}

export async function handleChatRequest(body = {}) {
  const chatMode = normalizeChatMode(body.chatMode);
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const profile = normalizeProfile(body.profile);
  const selectedMeasures = normalizeMeasures(body.selectedMeasures);
  const context = await prepareIntakeContext({
    messages,
    profile,
    selectedMeasures,
  });

  if (!openai) {
    return buildFallbackPayload({
      addressLookup: context.addressLookup,
      conversationState: context.conversationState,
      lookupAnnouncementFields: context.lookupAnnouncementFields,
      measureContext: context.measureContext,
      chatMode,
      profile: context.profile,
      selectedMeasures: context.selectedMeasures,
      warning: "Geen actieve API key gevonden. Lokale intakefallback gebruikt.",
    });
  }

  try {
    const parsedResponse = await openai.responses.parse({
      model: "gpt-5.5",
      store: false,
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "system",
          content: getModePrompt(chatMode),
        },
        {
          role: "system",
          content:
            `Huidige dossierstatus:\n${JSON.stringify(context.profile, null, 2)}\n` +
            `Reeds geselecteerde maatregelen: ${context.selectedMeasures.join(", ") || "geen"}\n` +
            `Actieve maatregelcontext: ${JSON.stringify(context.measureContext, null, 2)}\n` +
            `Beschikbare maatregelen: ${measureCatalog.join(", ")}`,
        },
        {
          role: "system",
          content: buildOfficialLookupContext(context.addressLookup),
        },
        {
          role: "system",
          content: buildConversationStatePrompt(context.conversationState),
        },
        ...messages
          .map((message) => ({
            role: message?.role === "assistant" ? "assistant" : "user",
            content: getMessageText(message),
          }))
          .filter((message) => typeof message.content === "string" && message.content.trim()),
      ],
      text: {
        format: zodTextFormat(intakeSchema, "monument_intake"),
      },
    });

    const parsed = parsedResponse.output_parsed;
    const nextProfile = mergeProfile(context.profile, parsed.extractedProfile);
    const mergedMeasures = normalizeMeasures([
      ...context.selectedMeasures,
      ...(parsed.measureMentions || []),
    ]);
    const nextMissingField = resolveNextMissingField(
      nextProfile,
      mergedMeasures,
      chatMode,
      context.conversationState,
    );
    const guidance = alignGuidanceWithNextField(
      buildGuidance(nextProfile, mergedMeasures, context.measureContext),
      nextMissingField,
      context.measureContext,
    );
    const reply =
      context.addressLookup.status === "needs_confirmation"
        ? buildAddressConfirmationReply(context.addressLookup)
        : parsed.reply;
    const quickReplies = buildQuickReplies(
      context.addressLookup,
      nextMissingField,
      nextProfile,
      mergedMeasures,
      context.measureContext,
      chatMode,
    );

    return {
      chatMode,
      guidance,
      mode: "openai",
      profile: nextProfile,
      quickReplies,
      reply,
      selectedMeasures: mergedMeasures,
      summary: parsed.dossierSummary || buildSummary(nextProfile, mergedMeasures, guidance),
      nextMissingField,
    };
  } catch (error) {
    console.error(error);
    const warning =
      error instanceof Error
        ? `Live OpenAI-koppeling tijdelijk niet beschikbaar: ${error.message}`
        : "Live OpenAI-koppeling tijdelijk niet beschikbaar.";

    return buildFallbackPayload({
      addressLookup: context.addressLookup,
      conversationState: context.conversationState,
      lookupAnnouncementFields: context.lookupAnnouncementFields,
      measureContext: context.measureContext,
      chatMode,
      profile: context.profile,
      selectedMeasures: context.selectedMeasures,
      warning,
    });
  }
}

async function handleRequest(request, response) {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/client-config") {
      return json(response, 200, await handleClientConfigRequest());
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json(response, 200, await handleHealthRequest());
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      if (runtimeConfig.authRequired) {
        try {
          await verifySupabaseSession(request.headers.authorization);
        } catch (error) {
          return json(response, 401, {
            error: error instanceof Error ? error.message : "Log eerst in om de chat te gebruiken.",
          });
        }
      }

      const body = await readJsonBody(request);
      return json(response, 200, await handleChatRequest(body));
    }

    if (request.method === "GET") {
      const filePath = resolvePublicPath(url.pathname);
      return await serveFile(response, filePath);
    }

    response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Method not allowed");
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Er ging iets mis op de server.";
    json(response, 500, { error: message });
  }
}

const launchedFile = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";

if (launchedFile === import.meta.url) {
  createServer(handleRequest).listen(port, () => {
    console.log(`Monument app draait op http://127.0.0.1:${port}`);
  });
}

function loadRuntimeConfig() {
  const env = tryReadEnvFile(path.join(__dirname, ".env"));
  const localEnv = tryReadEnvFile(path.join(__dirname, ".env.local"));

  return {
    openaiApiKey:
      process.env.OPENAI_API_KEY || localEnv.OPENAI_API_KEY || env.OPENAI_API_KEY || "",
    authRequired:
      (process.env.AUTH_REQUIRED || localEnv.AUTH_REQUIRED || env.AUTH_REQUIRED || "false").toLowerCase() === "true",
    supabasePublishableKey:
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      localEnv.SUPABASE_PUBLISHABLE_KEY ||
      localEnv.SUPABASE_ANON_KEY ||
      localEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      env.SUPABASE_PUBLISHABLE_KEY ||
      env.SUPABASE_ANON_KEY ||
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "",
    supabaseUrl:
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      localEnv.SUPABASE_URL ||
      localEnv.NEXT_PUBLIC_SUPABASE_URL ||
      env.SUPABASE_URL ||
      env.NEXT_PUBLIC_SUPABASE_URL ||
      "",
  };
}

async function serveFile(response, filePath) {
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      throw new Error("Not a file");
    }

    const extension = path.extname(filePath);
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
    });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Pagina niet gevonden");
  }
}

function resolvePublicPath(pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(publicDir, safePath.replace(/^\/+/, "")));

  if (!filePath.startsWith(publicDir)) {
    return path.join(publicDir, "index.html");
  }

  if (pathname === "/" || pathname === "/index.html") {
    return path.join(publicDir, "index.html");
  }

  if (pathname === "/intake" || pathname === "/intake.html") {
    return path.join(publicDir, "intake.html");
  }

  if (pathname === "/thuis" || pathname === "/thuis.html") {
    return path.join(publicDir, "thuis.html");
  }

  if (pathname === "/login" || pathname === "/login.html") {
    return path.join(publicDir, "login.html");
  }

  if (pathname === "/glasisolatie-demo" || pathname === "/glasisolatie-demo.html") {
    return path.join(publicDir, "glasisolatie-demo.html");
  }

  return filePath;
}

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

export async function verifySupabaseSession(authorizationHeader) {
  const token = getBearerToken(authorizationHeader);

  if (!token) {
    throw new Error("Log eerst in om de chat te gebruiken.");
  }

  if (!runtimeConfig.supabaseUrl || !runtimeConfig.supabasePublishableKey) {
    throw new Error("Supabase auth is nog niet volledig geconfigureerd.");
  }

  const response = await fetch(`${runtimeConfig.supabaseUrl}/auth/v1/user`, {
    headers: {
      Accept: "application/json",
      apikey: runtimeConfig.supabasePublishableKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Je sessie is verlopen. Log opnieuw in.");
  }

  return response.json();
}

function getBearerToken(authorizationHeader) {
  const value = String(authorizationHeader || "");
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

async function prepareIntakeContext({ messages, profile, selectedMeasures }) {
  const lastUserMessage = getLastUserMessage(messages);
  const effectiveUserMessage = buildEffectiveUserMessage(messages, lastUserMessage);
  const extractedProfile = extractProfileFromText(effectiveUserMessage);
  const mergedFromText = mergeProfile(profile, extractedProfile);
  const addressContext = extractAddressContext(effectiveUserMessage, mergedFromText);
  const addressLookup = await enrichAddressFromOfficialSources(addressContext);
  const nextProfile = mergeProfile(mergedFromText, addressLookup.profile);
  const lookupAnnouncementFields = getLookupAnnouncementFields(
    mergedFromText,
    addressLookup.profile,
    addressLookup.foundFields,
  );
  const mergedMeasures = normalizeMeasures([
    ...selectedMeasures,
    ...extractMeasuresFromText(effectiveUserMessage),
  ]);
  const measureContext = extractMeasureContextFromMessages(messages, mergedMeasures);
  const conversationState = analyzeConversationState(messages, lastUserMessage);

  return {
    addressLookup,
    conversationState,
    effectiveUserMessage,
    lastUserMessage,
    lookupAnnouncementFields,
    measureContext,
    profile: nextProfile,
    selectedMeasures: mergedMeasures,
  };
}

function normalizeMeasures(items) {
  const input = Array.isArray(items) ? items : [];
  const normalized = new Set();

  for (const item of input) {
    const match = measureCatalog.find(
      (candidate) => candidate.toLowerCase() === String(item).trim().toLowerCase(),
    );
    if (match) {
      normalized.add(match);
    }
  }

  return [...normalized];
}

function normalizeProfile(profile) {
  const source = profile && typeof profile === "object" ? profile : {};
  return {
    street: String(source.street || "").trim(),
    houseNumber: String(source.houseNumber || "").trim(),
    postcode: String(source.postcode || "").trim(),
    city: String(source.city || "").trim(),
    municipality: String(source.municipality || "").trim(),
    buildingAge: String(source.buildingAge || "").trim(),
    buildingType: String(source.buildingType || "").trim(),
    currentUse: String(source.currentUse || "").trim(),
    ownershipRole: String(source.ownershipRole || "").trim(),
    monumentStatus: String(source.monumentStatus || "").trim(),
    protectedView: String(source.protectedView || "").trim(),
    protectedValues: String(source.protectedValues || "").trim(),
    measureDescription: String(source.measureDescription || "").trim(),
    measureLocation: String(source.measureLocation || "").trim(),
    measureGoal: String(source.measureGoal || "").trim(),
    supportFocus: String(source.supportFocus || "").trim(),
    documentsAvailable: String(source.documentsAvailable || "").trim(),
    notes: String(source.notes || "").trim(),
  };
}

function mergeProfile(currentProfile, extractedProfile) {
  const nextProfile = { ...currentProfile };

  for (const [key, value] of Object.entries(normalizeProfile(extractedProfile))) {
    if (value) {
      nextProfile[key] = value;
    }
  }

  return nextProfile;
}

function getLookupAnnouncementFields(currentProfile, officialProfile, foundFields) {
  const normalizedCurrent = normalizeProfile(currentProfile);
  const normalizedOfficial = normalizeProfile(officialProfile);
  const fields = Array.isArray(foundFields) ? foundFields : [];

  return fields.filter((field) => {
    if (!(field in normalizedOfficial)) {
      return false;
    }

    const officialValue = normalizedOfficial[field];
    if (!officialValue) {
      return false;
    }

    return normalizedCurrent[field] !== officialValue;
  });
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request body is te groot."));
      }
    });

    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Ongeldige JSON ontvangen."));
      }
    });

    request.on("error", reject);
  });
}

function buildFallbackPayload({
  addressLookup,
  chatMode,
  conversationState,
  lookupAnnouncementFields,
  measureContext,
  profile,
  selectedMeasures,
  warning,
}) {
  const nextMissingField = resolveNextMissingField(profile, selectedMeasures, chatMode, conversationState);
  const guidance = alignGuidanceWithNextField(
    buildGuidance(profile, selectedMeasures, measureContext),
    nextMissingField,
    measureContext,
  );

  return {
    guidance,
    chatMode,
    mode: "fallback",
    nextMissingField,
    profile,
    quickReplies: buildQuickReplies(
      addressLookup,
      nextMissingField,
      profile,
      selectedMeasures,
      measureContext,
      chatMode,
    ),
    reply: buildFallbackReply(
      profile,
      selectedMeasures,
      nextMissingField,
      addressLookup,
      lookupAnnouncementFields,
      measureContext,
      guidance,
      chatMode,
      conversationState,
    ),
    selectedMeasures,
    summary: buildSummary(profile, selectedMeasures, guidance),
    warning,
  };
}

function extractProfileFromText(text) {
  const result = { ...emptyProfile };
  const normalizedText = String(text || "").replace(/\s+/g, " ").trim();
  const lowerText = normalizedText.toLowerCase();

  const postcodeMatch = normalizedText.match(/\b([1-9][0-9]{3}\s?[A-Za-z]{2})\b/);
  if (postcodeMatch) {
    result.postcode = normalizePostcode(postcodeMatch[1]);
  }

  const streetHousePatterns = [
    /\b(?:ik woon(?:\s+aan)?|adres(?:\s+is)?|het adres is|pand(?:\s+staat)?\s+(?:op|aan))\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ' .-]{1,}?)\s+(\d+[A-Za-z0-9\-\/]*)\b/i,
    new RegExp(
      `\\b([A-ZÀ-ÿ][A-Za-zÀ-ÿ' .-]*?(?:${roadTypePattern}))\\s+(\\d+[A-Za-z0-9\\-\\/]*)\\b`,
      "i",
    ),
  ];
  const streetHouseMatch = streetHousePatterns
    .map((pattern) => normalizedText.match(pattern))
    .find(Boolean);
  if (streetHouseMatch) {
    result.street = normalizeStreetCandidate(streetHouseMatch[1]);
    result.houseNumber = streetHouseMatch[2].trim();
  }

  result.city = cleanPlaceCandidate(extractCityFromText(normalizedText));
  result.municipality = detectMunicipality(normalizedText, result.city);

  const yearMatch = normalizedText.match(
    /\b(?:gebouwd(?:\s+rond|\s+in)?|bouwjaar(?:\s+is)?|pand\s+uit|woning\s+uit|huis\s+uit|gebouw\s+uit)\s+(1[6-9][0-9]{2}|20[0-2][0-9])\b/i,
  );
  if (yearMatch) {
    result.buildingAge = `Gebouwd in ${yearMatch[1]}`;
  }

  const ageMatch = normalizedText.match(/\b(\d{2,3})\s+jaar\s+oud\b/i);
  if (!result.buildingAge && ageMatch) {
    result.buildingAge = `${ageMatch[1]} jaar oud`;
  }

  const statusMap = [
    ["rijksmonument", "Rijksmonument"],
    ["gemeentelijk monument", "Gemeentelijk monument"],
    ["beschermd stadsgezicht", "Beschermd stadsgezicht"],
    ["beschermd dorpsgezicht", "Beschermd dorpsgezicht"],
    ["beeldbepalend", "Beeldbepalend pand"],
    ["onbekend", "Onbekend"],
    ["geen monument", "Geen monumentstatus"],
  ];

  for (const [needle, label] of statusMap) {
    if (lowerText.includes(needle)) {
      result.monumentStatus = label;
      break;
    }
  }

  result.buildingType = detectBuildingType(lowerText);
  result.currentUse = detectCurrentUse(lowerText);
  result.ownershipRole = detectOwnershipRole(lowerText);
  result.protectedView = detectProtectedView(lowerText);
  result.protectedValues = detectProtectedValues(lowerText);
  result.measureDescription = detectMeasureDescription(normalizedText);
  result.measureLocation = detectMeasureLocation(lowerText);
  result.measureGoal = detectGeneralMeasureGoal(lowerText);
  result.supportFocus = detectSupportFocus(lowerText);
  result.documentsAvailable = detectDocumentsAvailable(lowerText);

  return result;
}

function detectMunicipality(text, fallbackCity = "") {
  const municipalityMatch = String(text || "").match(
    /\b(?:gemeente|gemeent[eé])\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ' -]{1,}?)(?=(?:[,.!?]|$))/i,
  );
  if (municipalityMatch) {
    return municipalityMatch[1].trim();
  }

  return fallbackCity || "";
}

function detectBuildingType(text) {
  const pairs = [
    ["boerderij", "Boerderij"],
    ["herenhuis", "Herenhuis"],
    ["villa", "Villa"],
    ["kerk", "Kerk"],
    ["winkelpand", "Winkelpand"],
    ["kantoor", "Kantoorpand"],
    ["appartement", "Appartement"],
    ["woonhuis", "Woonhuis"],
    ["schuur", "Schuur"],
    ["loods", "Loods"],
    ["pand", "Pand"],
    ["woning", "Woning"],
  ];

  return pairs.find(([needle]) => text.includes(needle))?.[1] || "";
}

function detectCurrentUse(text) {
  if (/\b(gemengd gebruik|winkel.*woning|woning.*winkel)\b/.test(text)) {
    return "Gemengd gebruik";
  }
  if (/\b(ik woon|we wonen|bewoon|woning|woonhuis|thuis)\b/.test(text)) {
    return "Woning";
  }
  if (/\b(verhuur|huurwoning|airbnb)\b/.test(text)) {
    return "Verhuur";
  }
  if (/\b(winkel|horeca|restaurant|cafe|café)\b/.test(text)) {
    return "Commercieel";
  }
  if (/\bcommercieel\b/.test(text)) {
    return "Commercieel";
  }
  if (/\b(kantoor|praktijk)\b/.test(text)) {
    return "Kantoor of praktijk";
  }
  if (/\b(kerk|museum|publieksfunctie)\b/.test(text)) {
    return "Publieksfunctie";
  }

  return "";
}

function detectOwnershipRole(text) {
  if (/\bvve\b/.test(text)) {
    return "VvE";
  }
  if (/\bhuurder\b/.test(text)) {
    return "Huurder";
  }
  if (/\b(eigenaar|eigenares|eigen woning|ons pand|mijn pand)\b/.test(text)) {
    return "Eigenaar";
  }

  return "";
}

function detectProtectedView(text) {
  if (text.includes("beschermd stadsgezicht")) {
    return "Beschermd stadsgezicht";
  }
  if (text.includes("beschermd dorpsgezicht")) {
    return "Beschermd dorpsgezicht";
  }

  return "";
}

function detectProtectedValues(text) {
  const values = [];
  const mapping = [
    ["gevel", "Gevel"],
    ["kozijn", "Kozijnen"],
    ["raam", "Ramen"],
    ["dak", "Dakvorm"],
    ["kap", "Kapconstructie"],
    ["interieur", "Interieur"],
    ["trap", "Trap"],
    ["vloer", "Vloeren"],
  ];

  for (const [needle, label] of mapping) {
    if (text.includes(needle) && !values.includes(label)) {
      values.push(label);
    }
  }

  return values.join(", ");
}

function detectMeasureDescription(text) {
  const measures = extractMeasuresFromText(text);
  if (!measures.length && !/\b(isoleren|vervangen|plaatsen|aanbrengen|verbouwen|restaureren)\b/i.test(text)) {
    return "";
  }

  const sentence = String(text || "")
    .split(/(?<=[.!?])/)
    .map((part) => part.trim())
    .find((part) => /\b(isoleren|vervangen|plaatsen|aanbrengen|verbouwen|restaureren|warmtepomp|zonnepanelen|dakkapel)\b/i.test(part));

  return sentence ? sentence.slice(0, 180) : "";
}

function detectMeasureLocation(text) {
  const locations = [];
  const mapping = [
    ["voorgevel", "Voorgevel"],
    ["achtergevel", "Achtergevel"],
    ["zijgevel", "Zijgevel"],
    ["dak", "Dak"],
    ["zolder", "Zolder"],
    ["vloer", "Vloer"],
    ["begane grond", "Begane grond"],
    ["kelder", "Kelder"],
    ["kozijnen", "Kozijnen"],
    ["ramen", "Ramen"],
    ["tuin", "Tuin of erf"],
    ["achterzijde", "Achterzijde"],
    ["voorkant", "Voorzijde"],
  ];

  for (const [needle, label] of mapping) {
    if (text.includes(needle) && !locations.includes(label)) {
      locations.push(label);
    }
  }

  return locations.join(", ");
}

function detectGeneralMeasureGoal(text) {
  if (/\b(van het gas af|gasloos|all electric)\b/.test(text)) {
    return "Van het gas af";
  }
  if (/\b(lagere energiekosten|energiekosten verlagen|kosten verlagen|besparen|zuiniger)\b/.test(text)) {
    return "Energiekosten verlagen";
  }
  if (/\b(meer comfort|comfort verbeteren|minder tocht)\b/.test(text)) {
    return "Meer comfort";
  }
  if (/\b(onderhoud|achterstallig onderhoud|renoveren|restaureren)\b/.test(text)) {
    return "Onderhoud of restauratie";
  }

  return "";
}

function detectSupportFocus(text) {
  if (/\bhaalbaarheid\b/.test(text)) {
    return "Haalbaarheid";
  }
  if (/\bmonumentbeperkingen\b/.test(text)) {
    return "Monumentbeperkingen";
  }
  if (/\b(kosten en subsidie|subsidie en kosten)\b/.test(text)) {
    return "Kosten en subsidie";
  }
  if (/\bvergunning\b/.test(text)) {
    return "Vergunning";
  }
  if (/\bdocumenten\b/.test(text)) {
    return "Documenten";
  }
  if (/\bsubsidie\b/.test(text)) {
    return "Subsidie";
  }

  return "";
}

function detectDocumentsAvailable(text) {
  const docs = [];

  if (/\bfoto/.test(text)) {
    docs.push("Foto's");
  }
  if (/\b(tekening|plattegrond|detailtekening|gevelaanzicht)\b/.test(text)) {
    docs.push("Tekeningen");
  }
  if (/\b(offerte|prijsopgave|aannemer|installateur)\b/.test(text)) {
    docs.push("Offertes");
  }
  if (/\b(productblad|datasheet|specificatie|u waarde|vermogen)\b/.test(text)) {
    docs.push("Technische specificaties");
  }

  if (docs.length) {
    return docs.join(", ");
  }

  if (
    /\b(nog niets|nog geen|geen stukken|geen documenten|geen tekening|geen offerte|niets beschikbaar|niks beschikbaar|nee)\b/.test(
      text,
    )
  ) {
    return "Nog niets beschikbaar";
  }

  return docs.join(", ");
}

function extractAddressContext(text, currentProfile) {
  const normalizedText = String(text || "").replace(/\s+/g, " ").trim();
  const mergedProfile = normalizeProfile(currentProfile);
  const city = cleanPlaceCandidate(extractCityFromText(normalizedText) || extractLooseCityFromText(normalizedText));

  return {
    city: mergedProfile.city || city,
    postcode: mergedProfile.postcode || extractProfileFromText(normalizedText).postcode,
    street: normalizeStreetCandidate(mergedProfile.street),
    houseNumber: mergedProfile.houseNumber,
  };
}

function extractCityFromText(text) {
  const normalizedText = String(text || "").replace(/\s+/g, " ").trim();
  const postcodeCityMatch = normalizedText.match(
    /\b[1-9][0-9]{3}\s?[A-Za-z]{2}\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ' -]{1,}?)(?=(?:[,.!?]|$))/,
  );
  if (postcodeCityMatch) {
    return postcodeCityMatch[1].trim();
  }

  const cityMatch = normalizedText.match(
    /\b(?:in|te)\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ' -]{1,}?)(?=(?:[,.!?]|(?:\s+(?:en|maar|want|omdat|voor)\b)|$))/i,
  );
  return cityMatch ? cityMatch[1].trim() : "";
}

function extractMeasuresFromText(text) {
  const lower = String(text || "").toLowerCase();
  const matches = [];

  const dictionary = {
    Glasvervanging: ["glas", "beglazing", "ramen", "glasvervanging"],
    Dakisolatie: ["dakisolatie", "dak isolatie", "dak isoleren"],
    Vloerisolatie: ["vloerisolatie", "vloer isolatie", "vloer isoleren"],
    Gevelisolatie: ["gevelisolatie", "gevel isolatie", "muurisolatie"],
    Warmtepomp: ["warmtepomp", "hybride pomp"],
    Zonnepanelen: ["zonnepanelen", "panelen op het dak", "panelen"],
    Ventilatie: ["ventilatie", "balansventilatie", "afzuiging"],
    Dakkapel: ["dakkapel"],
  };

  for (const [measure, needles] of Object.entries(dictionary)) {
    if (needles.some((needle) => lower.includes(needle))) {
      matches.push(measure);
    }
  }

  return matches;
}

function extractMeasureContextFromMessages(messages, selectedMeasures) {
  const userMessages = (Array.isArray(messages) ? messages : [])
    .filter((message) => message?.role !== "assistant")
    .map((message) => getMessageText(message))
    .filter((text) => typeof text === "string" && text.trim());

  let context = { ...emptyMeasureContext };

  for (const messageText of userMessages) {
    context = mergeMeasureContext(context, extractMeasureContextFromText(messageText, context));
  }

  if (!context.primaryMeasure && selectedMeasures.includes("Warmtepomp")) {
    context.primaryMeasure = "Warmtepomp";
  }

  if (!context.currentTopic && context.primaryMeasure) {
    context.currentTopic = context.primaryMeasure;
  }

  return normalizeMeasureContext(context);
}

function extractMeasureContextFromText(text, currentContext) {
  const nextContext = { ...emptyMeasureContext };
  const normalizedText = normalizeIntentText(text);
  const measures = extractMeasuresFromText(text);
  const existingContext = normalizeMeasureContext(currentContext);
  const primaryMeasure = measures[0] || existingContext.primaryMeasure;

  if (primaryMeasure) {
    nextContext.primaryMeasure = primaryMeasure;
    nextContext.currentTopic = primaryMeasure;
  }

  if (primaryMeasure === "Warmtepomp") {
    nextContext.annualGasUsage = detectAnnualGasUsage(normalizedText);
    nextContext.measureVariant = detectWarmtepompVariant(normalizedText);
    nextContext.measureIntent = detectWarmtepompIntent(normalizedText);
    nextContext.currentHeatingSystem = detectCurrentHeatingSystem(normalizedText);
    nextContext.exteriorVisibility = detectExteriorVisibility(normalizedText);
    nextContext.heatingEmitters = detectHeatingEmitters(normalizedText);
    nextContext.insulationLevel = detectInsulationLevel(normalizedText);
    nextContext.measureGoal = detectWarmtepompGoal(normalizedText);
  }

  return nextContext;
}

function normalizeMeasureContext(context) {
  const source = context && typeof context === "object" ? context : {};

  return {
    annualGasUsage: String(source.annualGasUsage || "").trim(),
    currentHeatingSystem: String(source.currentHeatingSystem || "").trim(),
    currentTopic: String(source.currentTopic || "").trim(),
    exteriorVisibility: String(source.exteriorVisibility || "").trim(),
    heatingEmitters: String(source.heatingEmitters || "").trim(),
    insulationLevel: String(source.insulationLevel || "").trim(),
    measureGoal: String(source.measureGoal || "").trim(),
    measureIntent: String(source.measureIntent || "").trim(),
    measureVariant: String(source.measureVariant || "").trim(),
    primaryMeasure: String(source.primaryMeasure || "").trim(),
  };
}

function mergeMeasureContext(currentContext, extractedContext) {
  const nextContext = normalizeMeasureContext(currentContext);

  for (const [key, value] of Object.entries(normalizeMeasureContext(extractedContext))) {
    if (value) {
      nextContext[key] = value;
    }
  }

  return nextContext;
}

function detectWarmtepompVariant(text) {
  if (/\b(fully electric|full electric|all electric|volledig elektrisch|volledig elektrische|helemaal elektrisch)\b/.test(text)) {
    return "Fully electric";
  }

  if (/\bhybride\b/.test(text)) {
    return "Hybride";
  }

  if (/\blucht water\b/.test(text)) {
    return "Lucht-water";
  }

  if (/\bwater water\b/.test(text)) {
    return "Water-water";
  }

  if (/\b(bodem|grondgebonden)\b/.test(text)) {
    return "Bodem";
  }

  return "";
}

function detectWarmtepompIntent(text) {
  if (/\b(installeren|installatie|plaatsen|laten plaatsen|aanleggen)\b/.test(text)) {
    return "Installeren";
  }

  if (/\b(vervangen|vervanging|ombouwen)\b/.test(text)) {
    return "Vervangen";
  }

  if (/\b(onderzoeken|uitzoeken|verkennen|bekijken|checken|advies)\b/.test(text)) {
    return "Onderzoeken";
  }

  return "";
}

function detectCurrentHeatingSystem(text) {
  if (/\b(cv ketel|cvketel|hr ketel|hrketel|combiketel|ketel)\b/.test(text)) {
    return "Cv-ketel";
  }

  if (/\bstadsverwarming\b/.test(text)) {
    return "Stadsverwarming";
  }

  if (/\bblokverwarming\b/.test(text)) {
    return "Blokverwarming";
  }

  if (/\belektrische verwarming\b/.test(text)) {
    return "Elektrische verwarming";
  }

  if (/\bgaskachel\b/.test(text)) {
    return "Gaskachel";
  }

  if (/\bpelletkachel\b/.test(text)) {
    return "Pelletkachel";
  }

  if (/\b(anders|onbekend|iets anders)\b/.test(text)) {
    return "Anders of onbekend";
  }

  return "";
}

function detectHeatingEmitters(text) {
  const hasRadiatoren = /\b(radiator|radiatoren)\b/.test(text);
  const hasVloerverwarming = /\b(vloerverwarming)\b/.test(text);

  if (hasRadiatoren && hasVloerverwarming) {
    return "Allebei";
  }
  if (hasVloerverwarming) {
    return "Vloerverwarming";
  }
  if (hasRadiatoren) {
    return "Radiatoren";
  }

  return "";
}

function detectExteriorVisibility(text) {
  if (/\b(niet zichtbaar|uit het zicht|geen zicht|niet in het zicht)\b/.test(text)) {
    return "Niet zichtbaar";
  }

  if (/\b(beperkt zichtbaar|deels zichtbaar|nauwelijks zichtbaar)\b/.test(text)) {
    return "Beperkt zichtbaar";
  }

  if (/\b(zichtbaar|in het zicht|vanaf straat zichtbaar|openbare ruimte)\b/.test(text)) {
    return "Zichtbaar";
  }

  return "";
}

function detectAnnualGasUsage(text) {
  const match = text.match(/\b(\d{3,5})\s?(?:m3|m\^3|kuub|kubieke meter)\b/);
  if (!match) {
    return "";
  }

  return `${match[1]} m3 per jaar`;
}

function detectInsulationLevel(text) {
  if (/\bnog beperkt\b/.test(text)) {
    return "Nog beperkt";
  }

  if (/\bgoed geisoleerd\b/.test(text)) {
    return "Goed geisoleerd";
  }

  if (/\bredelijk\b/.test(text)) {
    return "Redelijk";
  }
  if (/\b(slecht geisoleerd|matig geisoleerd|enkel glas|nauwelijks geisoleerd)\b/.test(text)) {
    return "Beperkt geïsoleerd";
  }

  if (/\b(goed geisoleerd|redelijk geisoleerd|hr glas|hr\+\+|triple glas|dakisolatie|vloerisolatie|spouwmuurisolatie)\b/.test(text)) {
    return "Redelijk tot goed geïsoleerd";
  }

  return "";
}

function detectWarmtepompGoal(text) {
  if (/\b(van het gas af|gasloos|all electric)\b/.test(text)) {
    return "Van het gas af";
  }

  if (/\blagere energiekosten\b/.test(text)) {
    return "Energiekosten verlagen";
  }

  if (/\b(energiekosten verlagen|kosten verlagen|besparen|zuiniger)\b/.test(text)) {
    return "Energiekosten verlagen";
  }

  if (/\b(cv ketel vervangen|ketel vervangen|oude ketel eruit)\b/.test(text)) {
    return "Cv-ketel vervangen";
  }

  return "";
}

async function enrichAddressFromOfficialSources(addressContext) {
  if (!addressContext.street || !addressContext.houseNumber) {
    return { ...emptyLookupResult };
  }

  try {
    const locationDocs = await findAddressCandidates(addressContext);
    const candidateDecision = chooseBestAddressCandidate(locationDocs, addressContext);

    if (candidateDecision.status === "needs_confirmation") {
      return {
        ...emptyLookupResult,
        status: "needs_confirmation",
        suggestion: candidateDecision.suggestion,
      };
    }

    if (!candidateDecision.match) {
      return { ...emptyLookupResult, status: "no_match" };
    }

    const officialProfile = await hydrateBagAndHeritageData(candidateDecision.match);
    return {
      foundFields: Object.entries(officialProfile)
        .filter(([key, value]) => key !== "notes" && Boolean(value))
        .map(([key]) => key),
      profile: officialProfile,
      resolvedAddress: candidateDecision.match.weergavenaam || "",
      sources: ["PDOK Locatieserver", "Kadaster BAG", "RCE Beschermde Gebieden"],
      status: "matched",
      suggestion: null,
    };
  } catch (error) {
    console.error(error);
    return {
      ...emptyLookupResult,
      status: "error",
    };
  }
}

async function findAddressCandidates(addressContext) {
  const url = new URL(locationSearchUrl);
  const queryParts = [
    addressContext.street,
    addressContext.houseNumber,
    addressContext.postcode,
    addressContext.city,
  ].filter(Boolean);

  url.searchParams.set("q", queryParts.join(" "));
  url.searchParams.set("rows", "10");

  const fqParts = ["type:adres"];
  if (addressContext.city) {
    fqParts.push(`woonplaatsnaam:${escapeLocatieserverValue(addressContext.city)}`);
  }
  if (addressContext.postcode) {
    fqParts.push(`postcode:${normalizePostcode(addressContext.postcode).replace(/\s+/g, "")}`);
  }
  url.searchParams.set("fq", fqParts.join(" AND "));

  const payload = await fetchJson(url);
  return Array.isArray(payload?.response?.docs) ? payload.response.docs : [];
}

function chooseBestAddressCandidate(candidates, addressContext) {
  if (!Array.isArray(candidates) || !candidates.length) {
    return { match: null, status: "no_match", suggestion: null };
  }

  const assessments = candidates
    .map((candidate) => assessAddressCandidate(candidate, addressContext))
    .sort((left, right) => right.score - left.score);

  const exactMatches = assessments.filter(
    (item) =>
      item.houseMatches &&
      item.streetExact &&
      (!addressContext.city || item.cityMatches) &&
      (!addressContext.postcode || item.postcodeMatches),
  );

  if (exactMatches.length === 1) {
    return { match: exactMatches[0].candidate, status: "matched", suggestion: null };
  }

  const suggestion = assessments.find(
    (item) =>
      item.houseMatches &&
      item.streetStemMatches &&
      !item.streetTypeMatches &&
      (!addressContext.city || item.cityMatches),
  );

  if (suggestion) {
    return {
      match: null,
      status: "needs_confirmation",
      suggestion: {
        city: suggestion.candidate.woonplaatsnaam || "",
        houseNumber: suggestion.candidate.huis_nlt || String(suggestion.candidate.huisnummer || ""),
        postcode: normalizePostcode(suggestion.candidate.postcode || ""),
        street: suggestion.candidate.straatnaam || "",
        weergavenaam: suggestion.candidate.weergavenaam || "",
      },
    };
  }

  if (exactMatches.length > 1) {
    return { match: null, status: "no_match", suggestion: null };
  }

  return { match: null, status: "no_match", suggestion: null };
}

function assessAddressCandidate(candidate, addressContext) {
  const inputStreet = normalizeStreetName(addressContext.street);
  const candidateStreet = normalizeStreetName(candidate.straatnaam || candidate.straatnaam_verkort || "");
  const inputStreetParts = splitStreetType(inputStreet);
  const candidateStreetParts = splitStreetType(candidateStreet);
  const inputHouseNumber = normalizeHouseNumber(addressContext.houseNumber);
  const candidateHouseNumber = normalizeHouseNumber(
    candidate.huis_nlt ||
      `${candidate.huisnummer || ""}${candidate.huisletter || ""}${candidate.huisnummertoevoeging || ""}`,
  );
  const inputCity = normalizeLookupText(addressContext.city);
  const candidateCity = normalizeLookupText(candidate.woonplaatsnaam || "");
  const inputPostcode = normalizePostcode(addressContext.postcode || "").replace(/\s+/g, "");
  const candidatePostcode = normalizePostcode(candidate.postcode || "").replace(/\s+/g, "");

  const houseMatches = Boolean(inputHouseNumber) && inputHouseNumber === candidateHouseNumber;
  const streetExact = Boolean(inputStreet) && inputStreet === candidateStreet;
  const streetStemMatches =
    Boolean(inputStreetParts.stem) &&
    Boolean(candidateStreetParts.stem) &&
    inputStreetParts.stem === candidateStreetParts.stem;
  const streetTypeMatches =
    Boolean(inputStreetParts.type) &&
    Boolean(candidateStreetParts.type) &&
    inputStreetParts.type === candidateStreetParts.type;
  const cityMatches = !inputCity || inputCity === candidateCity;
  const postcodeMatches = !inputPostcode || inputPostcode === candidatePostcode;

  let score = 0;
  if (houseMatches) score += 5;
  if (streetExact) score += 8;
  if (!streetExact && streetStemMatches) score += 4;
  if (streetTypeMatches) score += 2;
  if (cityMatches && inputCity) score += 4;
  if (postcodeMatches && inputPostcode) score += 6;
  if (inputStreetParts.type && candidateStreetParts.type && !streetTypeMatches) score -= 3;

  return {
    candidate,
    cityMatches,
    houseMatches,
    postcodeMatches,
    score,
    streetExact,
    streetStemMatches,
    streetTypeMatches,
  };
}

async function hydrateBagAndHeritageData(candidate) {
  const resolvedProfile = {
    street: candidate.straatnaam || "",
    houseNumber: candidate.huis_nlt || String(candidate.huisnummer || ""),
    postcode: normalizePostcode(candidate.postcode || ""),
    city: candidate.woonplaatsnaam || "",
    municipality: candidate.gemeentenaam || candidate.gemeente_naam || "",
    buildingAge: "",
    buildingType: "",
    currentUse: "",
    ownershipRole: "",
    monumentStatus: "",
    protectedView: "",
    protectedValues: "",
    measureDescription: "",
    measureLocation: "",
    measureGoal: "",
    documentsAvailable: "",
    notes: "",
  };
  const centroid = parsePointWkt(candidate.centroide_ll || "");

  if (!centroid) {
    return resolvedProfile;
  }

  const verblijfsobject = await findVerblijfsobjectForAddress(candidate, centroid);
  if (verblijfsobject) {
    const pandHref = Array.isArray(verblijfsobject.properties?.["pand.href"])
      ? verblijfsobject.properties["pand.href"][0]
      : "";

    if (pandHref) {
      const pand = await fetchJson(withJsonFormat(pandHref));
      const bouwjaar = pand?.properties?.bouwjaar;
      if (Number.isFinite(bouwjaar)) {
        resolvedProfile.buildingAge = `Gebouwd in ${bouwjaar}`;
      }
    }
  }

  const monumentStatus = await findHeritageStatus(centroid);
  if (monumentStatus) {
    resolvedProfile.monumentStatus = monumentStatus;
    if (monumentStatus === "Beschermd stadsgezicht" || monumentStatus === "Beschermd dorpsgezicht") {
      resolvedProfile.protectedView = monumentStatus;
    }
  }

  return resolvedProfile;
}

async function findVerblijfsobjectForAddress(candidate, centroid) {
  const bbox = buildBboxAroundPoint(centroid, 0.00015);
  const url = new URL(`${bagApiBase}/collections/verblijfsobject/items`);
  url.searchParams.set("f", "json");
  url.searchParams.set("limit", "20");
  url.searchParams.set("bbox-crs", "http://www.opengis.net/def/crs/OGC/1.3/CRS84");
  url.searchParams.set("bbox", bbox.join(","));

  const payload = await fetchJson(url);
  const features = Array.isArray(payload?.features) ? payload.features : [];

  return (
    features.find((feature) => feature?.properties?.identificatie === candidate.adresseerbaarobject_id) ||
    features.find(
      (feature) =>
        normalizePostcode(feature?.properties?.postcode || "") === normalizePostcode(candidate.postcode || "") &&
        normalizeStreetName(feature?.properties?.openbare_ruimte_naam || "") ===
          normalizeStreetName(candidate.straatnaam || "") &&
        normalizeHouseNumber(feature?.properties?.huisnummer || "") ===
          normalizeHouseNumber(candidate.huisnummer || ""),
    ) ||
    null
  );
}

async function findHeritageStatus(centroid) {
  const pointBbox = buildBboxAroundPoint(centroid, 0.00025);
  const pointsUrl = new URL(`${heritageApiBase}/collections/rce_inspire_points/items`);
  pointsUrl.searchParams.set("f", "json");
  pointsUrl.searchParams.set("limit", "20");
  pointsUrl.searchParams.set("bbox-crs", "http://www.opengis.net/def/crs/OGC/1.3/CRS84");
  pointsUrl.searchParams.set("bbox", pointBbox.join(","));

  const pointPayload = await fetchJson(pointsUrl);
  const pointFeatures = Array.isArray(pointPayload?.features) ? pointPayload.features : [];
  const matchingPoint = pointFeatures.find((feature) => {
    const coordinates = feature?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return false;
    }
    return calculateDistanceMeters(centroid, { lon: coordinates[0], lat: coordinates[1] }) <= 35;
  });

  const pointStatus = mapHeritageNamespaceToStatus(matchingPoint?.properties?.namespace || "");
  if (pointStatus === "Rijksmonument") {
    return pointStatus;
  }

  const polygonsUrl = new URL(`${heritageApiBase}/collections/rce_inspire_polygons/items`);
  polygonsUrl.searchParams.set("f", "json");
  polygonsUrl.searchParams.set("limit", "20");
  polygonsUrl.searchParams.set("bbox-crs", "http://www.opengis.net/def/crs/OGC/1.3/CRS84");
  polygonsUrl.searchParams.set("bbox", pointBbox.join(","));

  const polygonPayload = await fetchJson(polygonsUrl);
  const polygonFeatures = Array.isArray(polygonPayload?.features) ? polygonPayload.features : [];
  const containingPolygon = polygonFeatures.find((feature) => pointInsideGeometry(centroid, feature?.geometry));

  return mapHeritageNamespaceToStatus(containingPolygon?.properties?.namespace || "");
}

function mapHeritageNamespaceToStatus(namespace) {
  const value = String(namespace || "").toLowerCase();
  if (value.includes("rijksmonumenten")) {
    return "Rijksmonument";
  }
  if (value.includes("stadsendorpsgezichten")) {
    return "Beschermd stadsgezicht";
  }
  return "";
}

function buildOfficialLookupContext(addressLookup) {
  if (!addressLookup || addressLookup.status === "not_attempted") {
    return "Officiële lookup: nog geen adresverrijking geprobeerd.";
  }

  if (addressLookup.status === "needs_confirmation" && addressLookup.suggestion) {
    return (
      "Officiële lookup: geen exacte adresmatch gevonden. " +
      `Beste suggestie: ${addressLookup.suggestion.weergavenaam}. ` +
      "Vraag de gebruiker om dit volledige adres te bevestigen of opnieuw te sturen."
    );
  }

  if (addressLookup.status === "matched") {
    return (
      "Officiële lookup bevestigd via PDOK/BAG/RCE. " +
      `Adres: ${addressLookup.resolvedAddress || "onbekend"}. ` +
      `Gevonden velden: ${addressLookup.foundFields.join(", ") || "geen extra velden"}.`
    );
  }

  if (addressLookup.status === "no_match") {
    return "Officiële lookup: nog geen eenduidige BAG-match gevonden voor dit adres.";
  }

  return "Officiële lookup: tijdelijk niet beschikbaar.";
}

function findNextMissingField(profile, measures) {
  const normalizedProfile = normalizeProfile(profile);
  const activeMeasures = normalizeMeasures(measures);
  const hasMeasure = Boolean(activeMeasures.length || normalizedProfile.measureDescription);

  const order = [
    ["street", !normalizedProfile.street],
    ["houseNumber", !normalizedProfile.houseNumber],
    ["postcode", !normalizedProfile.postcode],
    ["municipality", !(normalizedProfile.city || normalizedProfile.municipality)],
    ["monumentStatus", !normalizedProfile.monumentStatus],
    ["protectedValues", !normalizedProfile.protectedValues],
    ["currentUse", !normalizedProfile.currentUse],
    ["measureDescription", !hasMeasure],
    ["measureLocation", hasMeasure && !normalizedProfile.measureLocation],
    ["measureGoal", hasMeasure && !normalizedProfile.measureGoal],
    ["documentsAvailable", !normalizedProfile.documentsAvailable],
  ];

  return order.find(([, isMissing]) => isMissing)?.[0] || "none";
}

function resolveNextMissingField(profile, measures, chatMode, conversationState) {
  if (normalizeChatMode(chatMode) === "guided-free") {
    return chooseGuidedFreeField(profile, measures, conversationState);
  }

  const fallbackField = findNextMissingField(profile, measures);

  if (
    !conversationState?.userIsUncertain ||
    !conversationState?.lastAskedField ||
    fallbackField !== conversationState.lastAskedField
  ) {
    return fallbackField;
  }

  const normalizedProfile = normalizeProfile(profile);
  const activeMeasures = normalizeMeasures(measures);
  const hasMeasure = Boolean(activeMeasures.length || normalizedProfile.measureDescription);
  const order = [
    ["street", !normalizedProfile.street],
    ["houseNumber", !normalizedProfile.houseNumber],
    ["postcode", !normalizedProfile.postcode],
    ["municipality", !(normalizedProfile.city || normalizedProfile.municipality)],
    ["monumentStatus", !normalizedProfile.monumentStatus],
    ["protectedValues", !normalizedProfile.protectedValues],
    ["currentUse", !normalizedProfile.currentUse],
    ["measureDescription", !hasMeasure],
    ["measureLocation", hasMeasure && !normalizedProfile.measureLocation],
    ["measureGoal", hasMeasure && !normalizedProfile.measureGoal],
    ["documentsAvailable", !normalizedProfile.documentsAvailable],
  ];

  return order.find(([field, isMissing]) => isMissing && field !== conversationState.lastAskedField)?.[0] || fallbackField;
}

function chooseGuidedFreeField(profile, measures, conversationState) {
  const normalizedProfile = normalizeProfile(profile);
  const activeMeasures = normalizeMeasures(measures);
  const hasMeasure = Boolean(activeMeasures.length || normalizedProfile.measureDescription);
  const priorities = [
    ["street", !normalizedProfile.street],
    ["houseNumber", !normalizedProfile.houseNumber],
    ["postcode", !normalizedProfile.postcode],
    ["municipality", !(normalizedProfile.city || normalizedProfile.municipality)],
    ["measureDescription", !hasMeasure],
    ["measureGoal", hasMeasure && !normalizedProfile.measureGoal],
    ["measureLocation", hasMeasure && !normalizedProfile.measureLocation],
    ["currentUse", !normalizedProfile.currentUse],
    ["documentsAvailable", !normalizedProfile.documentsAvailable],
    ["monumentStatus", !normalizedProfile.monumentStatus],
    ["protectedValues", !normalizedProfile.protectedValues],
  ];

  const blockedField =
    conversationState?.userIsUncertain && conversationState?.lastAskedField
      ? conversationState.lastAskedField
      : "";

  return priorities.find(([field, isMissing]) => isMissing && field !== blockedField)?.[0] || "none";
}

function buildGuidance(profile, measures, measureContext) {
  const normalizedProfile = normalizeProfile(profile);
  const activeMeasures = normalizeMeasures(measures);

  return {
    actionChecklist: buildActionChecklist(normalizedProfile, activeMeasures),
    documentChecklist: buildDocumentChecklist(normalizedProfile, activeMeasures),
    missingItems: buildMissingItems(normalizedProfile, activeMeasures),
    nextStep: buildNextStepLabel(normalizedProfile, activeMeasures, measureContext),
    permitRisk: estimatePermitRisk(normalizedProfile, activeMeasures),
    stage: determineDossierStage(normalizedProfile, activeMeasures),
  };
}

function alignGuidanceWithNextField(guidance, nextMissingField, measureContext) {
  return {
    ...guidance,
    nextStep: buildNextStepLabelFromField(nextMissingField, measureContext),
    stage: determineStageFromField(nextMissingField),
  };
}

function buildSummary(profile, measures, guidance) {
  const normalizedProfile = normalizeProfile(profile);
  const activeGuidance = guidance || buildGuidance(normalizedProfile, measures, emptyMeasureContext);
  const parts = [`Fase: ${activeGuidance.stage}`];

  if (normalizedProfile.street || normalizedProfile.houseNumber) {
    parts.push(`Adres: ${[normalizedProfile.street, normalizedProfile.houseNumber].filter(Boolean).join(" ")}`.trim());
  }
  if (normalizedProfile.city || normalizedProfile.municipality) {
    parts.push(`Gemeente: ${normalizedProfile.municipality || normalizedProfile.city}`);
  }
  if (normalizedProfile.monumentStatus) {
    parts.push(`Status: ${normalizedProfile.monumentStatus}`);
  }
  if (measures.length) {
    parts.push(`Maatregel: ${measures.join(", ")}`);
  }
  if (activeGuidance.nextStep) {
    parts.push(`Volgende stap: ${activeGuidance.nextStep}`);
  }

  return parts.join(" | ");
}

function buildFallbackReply(
  profile,
  measures,
  nextMissingField,
  addressLookup,
  lookupAnnouncementFields,
  measureContext,
  guidance,
  chatMode,
  conversationState,
) {
  if (addressLookup?.status === "needs_confirmation") {
    return buildAddressConfirmationReply(addressLookup);
  }

  if (normalizeChatMode(chatMode) === "guided-free") {
    return buildGuidedFreeReply(
      profile,
      measures,
      nextMissingField,
      addressLookup,
      lookupAnnouncementFields,
      measureContext,
      guidance,
      conversationState,
    );
  }

  const normalizedProfile = normalizeProfile(profile);
  const lookupIntro = buildLookupIntro(addressLookup, lookupAnnouncementFields);
  const isGuidedFree = false;
  const freePrefix = lookupIntro;
  const guidedPrefix = lookupIntro;

  switch (nextMissingField) {
    case "street":
    case "houseNumber":
      return isGuidedFree
        ? `${guidedPrefix}Om het dossier stevig te maken heb ik wel het adres nodig. Wat zijn de straat en het huisnummer van het pand?`.trim()
        : `${lookupIntro}Om goed te beginnen: wat is de straat en het huisnummer van het pand?`.trim();
    case "postcode":
      return isGuidedFree
        ? `${guidedPrefix}Dat helpt al. Welke postcode hoort erbij?`.trim()
        : `${lookupIntro}Dank je. Wat is de postcode van het pand?`.trim();
    case "municipality":
      return isGuidedFree
        ? `${guidedPrefix}In welke plaats of gemeente staat het pand precies?`.trim()
        : `${lookupIntro}In welke plaats of gemeente staat het pand?`.trim();
    case "monumentStatus":
      return isGuidedFree
        ? `${guidedPrefix}Ik mis nog vooral de monumentstatus. Weet je of dit een rijksmonument, gemeentelijk monument of beschermd stads- of dorpsgezicht is?`.trim()
        : `${lookupIntro}Weet je of dit een rijksmonument, gemeentelijk monument of beschermd stads- of dorpsgezicht is?`.trim();
    case "protectedValues":
      return isGuidedFree
        ? `${guidedPrefix}Welke onderdelen zijn hier volgens jou beeldbepalend of beschermd, bijvoorbeeld gevel, kozijnen, dak of interieur? Als je het niet weet is dat ook prima.`.trim()
        : `${lookupIntro}Welke onderdelen zijn volgens jou beeldbepalend of beschermd, bijvoorbeeld gevel, kozijnen, dak of interieur? Als je het niet weet, zeg dat gerust.`.trim();
    case "currentUse":
      return isGuidedFree
        ? `${guidedPrefix}Hoe wordt het pand nu gebruikt, bijvoorbeeld als woning, winkel, praktijk of gemengd?`.trim()
        : `${lookupIntro}Hoe wordt het pand nu gebruikt, bijvoorbeeld als woning, winkel, praktijk of gemengd?`.trim();
    case "measureDescription":
      return isGuidedFree
        ? `${guidedPrefix}Welke maatregel of ingreep wil je als eerste onderzoeken? Je kunt het gewoon in je eigen woorden beschrijven.`.trim()
        : `${lookupIntro}Welke maatregel wil je als eerste onderzoeken? Je kunt ook links op een maatregel klikken.`.trim();
    case "measureLocation":
      return isGuidedFree
        ? `${guidedPrefix}Waar in of aan het pand zit deze ingreep precies, bijvoorbeeld dak, voorgevel, achterzijde of interieur?`.trim()
        : `${lookupIntro}Waar in of aan het pand wil je deze ingreep uitvoeren, bijvoorbeeld dak, voorgevel, achterzijde of interieur?`.trim();
    case "measureGoal":
      return isGuidedFree
        ? `${guidedPrefix}Wat wil je met deze maatregel vooral bereiken: lagere energiekosten, meer comfort, onderhoud of iets anders?`.trim()
        : `${lookupIntro}Wat is het hoofddoel van deze maatregel: lagere energiekosten, meer comfort, onderhoud of iets anders?`.trim();
    case "documentsAvailable":
      return isGuidedFree
        ? `${guidedPrefix}Welke stukken heb je al, zoals foto's, tekeningen, offertes of technische info? Een grove opsomming is genoeg.`.trim()
        : `${lookupIntro}Heb je al iets beschikbaar zoals foto's, tekeningen, offertes of technische informatie?`.trim();
    default: {
      const measureFollowUp = buildMeasureFollowUp(normalizedProfile, measureContext, guidedPrefix);
      if (measureFollowUp) {
        return measureFollowUp;
      }

      if (normalizedProfile.supportFocus) {
        return buildSupportFocusReply(normalizedProfile, measureContext, guidedPrefix);
      }

      const permitSnippet = guidance?.permitRisk ? ` Vergunningbeeld: ${guidance.permitRisk}.` : "";
      return (
        `${guidedPrefix}Ik heb nu genoeg basis om het dossier gericht verder te brengen.${permitSnippet} ` +
        "Wil je dat ik hierna vooral meekijk naar vergunning, documenten of subsidie?"
      )
        .replace(/\s+/g, " ")
        .trim();
    }
  }
}

function buildGuidedFreeReply(
  profile,
  measures,
  nextMissingField,
  addressLookup,
  lookupAnnouncementFields,
  measureContext,
  guidance,
  conversationState,
) {
  const normalizedProfile = normalizeProfile(profile);
  const intro = buildConversationalPrefix(normalizedProfile, measures, buildLookupIntro(addressLookup, lookupAnnouncementFields));
  const acknowledgement = buildGuidedFreeAcknowledgement(conversationState);
  const lead = intro ? `${intro}` : "";
  const preface = [acknowledgement, lead].filter(Boolean).join(" ").trim();
  const textLead = preface ? `${preface} ` : "";
  const hasMeasure = Boolean(normalizeMeasures(measures).length || normalizedProfile.measureDescription);

  switch (nextMissingField) {
    case "street":
    case "houseNumber":
      return `${textLead}Om je echt goed te kunnen helpen heb ik wel het adres nodig. Wat zijn de straat en het huisnummer?`.trim();
    case "postcode":
      return `${textLead}Heb je ook de postcode erbij? Dan kan ik het pand beter plaatsen.`.trim();
    case "municipality":
      return `${textLead}In welke plaats of gemeente staat het pand precies?`.trim();
    case "measureDescription":
      return `${textLead}Waar wil je precies naartoe met dit pand of deze aanvraag? Je mag het gewoon in je eigen woorden schetsen.`.trim();
    case "measureGoal":
      return `${textLead}Wat hoop je hiermee vooral te bereiken: comfort, energiebesparing, onderhoud, vergunningruimte of iets anders?`.trim();
    case "measureLocation":
      return `${textLead}Op welk deel van het pand speelt dit vooral, bijvoorbeeld dak, gevel, ramen of juist binnen?`.trim();
    case "currentUse":
      return `${textLead}Om het goed te plaatsen: is dit vooral een woning, gemengd gebruik of iets anders?`.trim();
    case "documentsAvailable":
      return `${textLead}Heb je hier al iets van materiaal bij, zoals foto's, tekeningen of een offerte? Hoeft nog niet compleet te zijn.`.trim();
    case "monumentStatus":
      return `${textLead}Weet je toevallig al wat de monumentstatus is, of wil je dat ik voorlopig werk met wat we nu weten?`.trim();
    case "protectedValues":
      return `${textLead}Later wil ik nog scherp krijgen welke onderdelen echt gevoelig of beeldbepalend zijn. Weet je daar nu al iets van, of zullen we dat zo laten voor later?`.trim();
    default: {
      const measureFollowUp = buildMeasureFollowUp(normalizedProfile, measureContext, textLead);
      if (measureFollowUp) {
        return measureFollowUp;
      }

      if (normalizedProfile.supportFocus) {
        return buildSupportFocusReply(normalizedProfile, measureContext, textLead);
      }

      if (hasMeasure) {
        return `${textLead}Ik heb genoeg context om hier inhoudelijk mee verder te denken. Wil je dat ik nu vooral meekijk naar haalbaarheid, vergunningkans, benodigde stukken of een logische aanpak?`.trim();
      }

      return `${textLead}Vertel gerust wat meer over wat je wilt veranderen of waar je op vastloopt, dan denk ik met je mee vanuit daar.`.trim();
    }
  }
}

function buildMeasureFollowUp(profile, measureContext, lookupIntro) {
  const normalizedProfile = normalizeProfile(profile);
  const normalizedContext = normalizeMeasureContext(measureContext);

  if (normalizedContext.primaryMeasure === "Warmtepomp") {
    return buildWarmtepompFollowUp(normalizedProfile, normalizedContext, lookupIntro);
  }

  return "";
}

function buildWarmtepompFollowUp(profile, measureContext, lookupIntro) {
  const intentSnippet = measureContext.measureIntent
    ? ` ${measureContext.measureIntent.toLowerCase()}`
    : "";
  const variantSnippet = measureContext.measureVariant
    ? `${measureContext.measureVariant.toLowerCase()} `
    : "";

  if (!measureContext.currentHeatingSystem) {
    return (
      `${lookupIntro}Helder. Je wilt een ${variantSnippet}warmtepomp${intentSnippet}. ` +
      "Heb je nu een cv-ketel, stadsverwarming of iets anders voor verwarming en warm water?"
    )
      .replace(/\s+/g, " ")
      .trim();
  }

  if (!measureContext.insulationLevel && measureContext.measureVariant === "Fully electric") {
    return `${lookupIntro}Goed om te weten. Hoe goed is het pand nu geïsoleerd, bijvoorbeeld glas, dak en vloer?`.trim();
  }

  if (!measureContext.measureGoal && !profile.measureGoal) {
    return `${lookupIntro}Wat is voor jou het belangrijkste doel: van het gas af, lagere energiekosten of je huidige ketel vervangen?`.trim();
  }

  if (!profile.supportFocus) {
    return `${lookupIntro}Helder. Wil je dat ik voor deze warmtepomp vooral meekijk naar haalbaarheid, monumentbeperkingen of kosten en subsidie?`.trim();
  }

  return buildSupportFocusReply(profile, measureContext, lookupIntro, "warmtepomp");
}

function buildSupportFocusReply(profile, measureContext, lookupIntro, topic = "") {
  const focus = normalizeProfile(profile).supportFocus;
  const normalizedContext = normalizeMeasureContext(measureContext);
  const topicSnippet = topic ? ` voor deze ${topic}` : "";

  switch (focus) {
    case "Haalbaarheid":
      return buildHaalbaarheidReply(normalizedContext, lookupIntro, topicSnippet);
    case "Monumentbeperkingen":
      return buildMonumentReply(normalizedContext, lookupIntro, topicSnippet);
    case "Kosten en subsidie":
      return buildKostenReply(normalizedContext, lookupIntro, topicSnippet);
    case "Vergunning":
      return buildVergunningReply(normalizedContext, lookupIntro);
    case "Documenten":
      return buildDocumentenReply(normalizedContext, lookupIntro);
    case "Subsidie":
      return buildSubsidieReply(normalizedContext, lookupIntro);
    default:
      return "";
  }
}

function buildHaalbaarheidReply(measureContext, lookupIntro, topicSnippet) {
  if (!measureContext.heatingEmitters) {
    return `${lookupIntro}Helder. Dan kijk ik vooral naar haalbaarheid${topicSnippet}. Heb je nu radiatoren, vloerverwarming of allebei?`.trim();
  }

  if (!measureContext.insulationLevel) {
    return `${lookupIntro}Helder. Met ${measureContext.heatingEmitters.toLowerCase()} krijg ik al meer gevoel bij de haalbaarheid. Hoe goed is de woning nu ongeveer geïsoleerd, bijvoorbeeld glas, dak en vloer?`.trim();
  }

  if (!measureContext.currentHeatingSystem) {
    return `${lookupIntro}Helder. En wat heb je nu als verwarmingssysteem, bijvoorbeeld een cv-ketel, stadsverwarming of iets anders?`.trim();
  }

  if (!measureContext.exteriorVisibility) {
    return `${lookupIntro}Helder. Weet je al of een buitenunit straks zichtbaar zou zijn vanaf de openbare ruimte, of denk je juist aan een plek uit het zicht?`.trim();
  }

  return `${lookupIntro}Helder. Met ${measureContext.heatingEmitters.toLowerCase()}, ${measureContext.insulationLevel.toLowerCase()} en ${measureContext.currentHeatingSystem.toLowerCase()} kan ik de haalbaarheid nu behoorlijk goed inschatten. Wil je dat ik eerst kijk naar technische risico's, de opstelling of het verwachte comfort?`.trim();
}

function buildMonumentReply(measureContext, lookupIntro, topicSnippet) {
  if (!measureContext.exteriorVisibility) {
    return `${lookupIntro}Helder. Dan kijk ik vooral naar monumentbeperkingen${topicSnippet}. Komt de buitenunit of het leidingwerk zichtbaar in beeld vanaf de openbare ruimte?`.trim();
  }

  if (!measureContext.currentHeatingSystem) {
    return `${lookupIntro}Helder. Omdat dit ${measureContext.exteriorVisibility.toLowerCase()} is, wordt de plek en uitwerking extra belangrijk. Wat heb je nu als verwarmingssysteem?`.trim();
  }

  return `${lookupIntro}Helder. Met ${measureContext.exteriorVisibility.toLowerCase()} zichtbaarheid en ${measureContext.currentHeatingSystem.toLowerCase()} als huidige situatie kan ik de monumentgevoelige punten goed uittekenen. Wil je dat ik eerst kijk naar zichtbaarheid, plaatsing of vergunningsrisico?`.trim();
}

function buildKostenReply(measureContext, lookupIntro, topicSnippet) {
  if (!measureContext.annualGasUsage) {
    return `${lookupIntro}Helder. Dan kijk ik vooral naar kosten en subsidie${topicSnippet}. Weet je ongeveer wat je gasverbruik per jaar is? Een grove schatting in m3 is al genoeg.`.trim();
  }

  if (!measureContext.currentHeatingSystem) {
    return `${lookupIntro}Helder. Met ongeveer ${measureContext.annualGasUsage.toLowerCase()} kan ik de kostenkant beter plaatsen. Wat gebruik je nu als verwarmingssysteem?`.trim();
  }

  return `${lookupIntro}Helder. Met ongeveer ${measureContext.annualGasUsage.toLowerCase()} en ${measureContext.currentHeatingSystem.toLowerCase()} als huidige situatie kan ik nu beter ordenen wat financieel logisch is. Wil je dat ik eerst kijk naar investering, besparing of subsidiemogelijkheden?`.trim();
}

function buildVergunningReply(measureContext, lookupIntro) {
  if (!measureContext.exteriorVisibility) {
    return `${lookupIntro}Helder. Dan richt ik me eerst op vergunning. Komt de buitenunit of het leidingwerk zichtbaar in beeld vanaf de openbare ruimte?`.trim();
  }

  if (!measureContext.currentHeatingSystem) {
    return `${lookupIntro}Helder. Omdat dit ${measureContext.exteriorVisibility.toLowerCase()} is, wil ik ook snappen wat je bestaande situatie is. Wat gebruik je nu als verwarmingssysteem?`.trim();
  }

  return `${lookupIntro}Helder. Met ${measureContext.exteriorVisibility.toLowerCase()} zichtbaarheid en ${measureContext.currentHeatingSystem.toLowerCase()} als uitgangspunt kan ik de vergunningkans veel concreter maken. Wil je dat ik eerst kijk naar kans van slagen, benodigde stukken of gevoelige onderdelen?`.trim();
}

function buildDocumentenReply(measureContext, lookupIntro) {
  if (!measureContext.exteriorVisibility) {
    return `${lookupIntro}Helder. Dan richt ik me eerst op documenten. Heb je al foto's van de beoogde plek buiten en van de technische ruimte binnen?`.trim();
  }

  if (!measureContext.currentHeatingSystem) {
    return `${lookupIntro}Helder. Om de stukkenlijst scherp te maken wil ik ook weten wat er nu al staat. Wat gebruik je op dit moment als verwarmingssysteem?`.trim();
  }

  return `${lookupIntro}Helder. Met deze context kan ik de stukkenlijst nu veel gerichter maken. Wil je dat ik eerst de foto's, de tekeningen of de technische stukken voor je uitsplits?`.trim();
}

function buildSubsidieReply(measureContext, lookupIntro) {
  if (!measureContext.annualGasUsage) {
    return `${lookupIntro}Helder. Dan richt ik me eerst op subsidie. Weet je ongeveer wat je gasverbruik per jaar is? Dat helpt om de regeling en de besparingsrichting beter te duiden.`.trim();
  }

  if (!measureContext.currentHeatingSystem) {
    return `${lookupIntro}Helder. Met ongeveer ${measureContext.annualGasUsage.toLowerCase()} kom ik al verder. Wat gebruik je nu als verwarmingssysteem?`.trim();
  }

  return `${lookupIntro}Helder. Met ongeveer ${measureContext.annualGasUsage.toLowerCase()} en ${measureContext.currentHeatingSystem.toLowerCase()} als uitgangspunt kan ik subsidiemogelijkheden veel beter plaatsen. Wil je dat ik eerst kijk naar landelijke regelingen, verwachte voorwaarden of combinatie met besparing?`.trim();
}

function buildAddressConfirmationReply(addressLookup) {
  const suggestion = addressLookup?.suggestion?.weergavenaam;
  if (!suggestion) {
    return "Ik kon dit adres nog niet eenduidig vinden. Wil je straat, huisnummer en plaats nog één keer exact sturen?";
  }

  return (
    `Ik kon dit adres nog niet exact koppelen in de BAG. Bedoel je ${suggestion}? ` +
    "Stuur dat adres dan even precies zo terug, dan haal ik meteen postcode, bouwjaar en monumentcontext op."
  );
}

function buildLookupIntro(addressLookup, announcementFields) {
  const fieldsToMention = Array.isArray(announcementFields) ? announcementFields : [];

  if (!addressLookup || addressLookup.status !== "matched" || !fieldsToMention.length) {
    return "";
  }

  const snippets = [];
  if (
    fieldsToMention.includes("city") ||
    fieldsToMention.includes("municipality")
  ) {
    snippets.push(`plaats ${addressLookup.profile.city || addressLookup.profile.municipality}`);
  }
  if (fieldsToMention.includes("postcode") && addressLookup.profile.postcode) {
    snippets.push(`postcode ${addressLookup.profile.postcode}`);
  }
  if (fieldsToMention.includes("buildingAge") && addressLookup.profile.buildingAge) {
    snippets.push(addressLookup.profile.buildingAge.toLowerCase());
  }
  if (fieldsToMention.includes("monumentStatus") && addressLookup.profile.monumentStatus) {
    snippets.push(`status ${addressLookup.profile.monumentStatus}`);
  }

  return snippets.length ? `Ik heb alvast officieel gevonden: ${snippets.join(", ")}. ` : "";
}

function buildGuidedFreePrefix(profile, measures, lookupIntro) {
  const parts = [];

  if (lookupIntro) {
    parts.push(lookupIntro.trim());
  }

  return parts.length ? `${parts.join(" ")} ` : "";
}

function buildConversationalPrefix(profile, measures, lookupIntro) {
  const prefix = buildGuidedFreePrefix(profile, measures, lookupIntro).trim();
  return prefix ? `${prefix} ` : "";
}

function buildQuickReplies(addressLookup, nextMissingField, profile, measures, measureContext, chatMode) {
  const normalizedProfile = normalizeProfile(profile);
  const isGuidedFree = normalizeChatMode(chatMode) === "guided-free";

  if (addressLookup?.status === "needs_confirmation") {
    return ["Ja", "Nee"];
  }

  if (isGuidedFree) {
    if (nextMissingField !== "none") {
      return [];
    }

    const supportFocusReplies = buildSupportFocusQuickReplies(normalizedProfile, measureContext);
    const measureReplies = buildMeasureQuickReplies(normalizedProfile, measureContext);

    if (supportFocusReplies.length) {
      return supportFocusReplies;
    }

    if (measureReplies.length) {
      return measureReplies;
    }

    return [];
  }

  switch (nextMissingField) {
    case "monumentStatus":
      return ["Rijksmonument", "Gemeentelijk monument", "Onbekend"];
    case "currentUse":
      return ["Woning", "Gemengd gebruik", "Commercieel"];
    case "measureDescription":
      return measures.length ? [] : ["Warmtepomp", "Glasvervanging", "Zonnepanelen"];
    case "measureGoal":
      return ["Lagere energiekosten", "Meer comfort", "Onderhoud"];
    case "documentsAvailable":
      return ["Ik heb foto's", "Ik heb tekeningen", "Nog niets"];
    case "none": {
      const supportFocusReplies = buildSupportFocusQuickReplies(normalizedProfile, measureContext);
      if (supportFocusReplies.length) {
        return supportFocusReplies;
      }

      const measureReplies = buildMeasureQuickReplies(normalizedProfile, measureContext);
      if (measureReplies.length) {
        return measureReplies;
      }

      return normalizedProfile.supportFocus ? [] : ["Vergunning", "Documenten", "Subsidie"];
    }
    default:
      return [];
  }
}

function buildSupportFocusQuickReplies(profile, measureContext) {
  const normalizedProfile = normalizeProfile(profile);
  const normalizedContext = normalizeMeasureContext(measureContext);

  switch (normalizedProfile.supportFocus) {
    case "Haalbaarheid":
      return normalizedContext.heatingEmitters ? [] : ["Radiatoren", "Vloerverwarming", "Allebei"];
    case "Monumentbeperkingen":
    case "Vergunning":
      return normalizedContext.exteriorVisibility ? [] : ["Ja, zichtbaar", "Beperkt zichtbaar", "Niet zichtbaar"];
    case "Kosten en subsidie":
    case "Subsidie":
      return normalizedContext.annualGasUsage ? [] : [];
    default:
      return [];
  }
}

function buildMeasureQuickReplies(profile, measureContext) {
  const normalizedProfile = normalizeProfile(profile);
  const normalizedContext = normalizeMeasureContext(measureContext);

  if (normalizedContext.primaryMeasure === "Warmtepomp") {
    return buildWarmtepompQuickReplies(normalizedProfile, normalizedContext);
  }

  return [];
}

function buildWarmtepompQuickReplies(profile, measureContext) {
  if (!measureContext.currentHeatingSystem) {
    return ["Cv-ketel", "Stadsverwarming", "Anders"];
  }

  if (!measureContext.insulationLevel && measureContext.measureVariant === "Fully electric") {
    return ["Goed geisoleerd", "Redelijk", "Nog beperkt"];
  }

  if (!measureContext.measureGoal && !profile.measureGoal) {
    return ["Van het gas af", "Lagere energiekosten", "Ketel vervangen"];
  }

  if (profile.supportFocus) {
    return [];
  }

  if (!measureContext.insulationLevel && measureContext.measureVariant === "Fully electric") {
    return ["Goed geïsoleerd", "Redelijk", "Nog beperkt"];
  }

  if (!measureContext.measureGoal && !profile.measureGoal) {
    return ["Van het gas af", "Lagere energiekosten", "Ketel vervangen"];
  }

  return ["Haalbaarheid", "Monumentbeperkingen", "Kosten en subsidie"];
}

function determineDossierStage(profile, measures) {
  const nextMissingField = findNextMissingField(profile, measures);
  return determineStageFromField(nextMissingField);
}

function estimatePermitRisk(profile, measures) {
  const primaryMeasure = measures[0] || "";
  if (!primaryMeasure) {
    return "Nog geen maatregel gekozen";
  }

  if (!profile.monumentStatus) {
    return "Eerst monumentstatus bepalen";
  }

  const status = profile.monumentStatus;

  if (status === "Rijksmonument") {
    if (["Zonnepanelen", "Gevelisolatie", "Dakkapel"].includes(primaryMeasure)) {
      return "Rood - vrijwel zeker vergunningplichtig";
    }
    return "Oranje - waarschijnlijk vergunningplichtig";
  }

  if (status === "Gemeentelijk monument") {
    if (["Zonnepanelen", "Gevelisolatie", "Dakkapel", "Glasvervanging"].includes(primaryMeasure)) {
      return "Oranje - vergunningcheck nodig";
    }
    return "Oranje - vaak afstemming met gemeente nodig";
  }

  if (status === "Beschermd stadsgezicht" || status === "Beschermd dorpsgezicht") {
    if (["Zonnepanelen", "Gevelisolatie", "Dakkapel", "Glasvervanging"].includes(primaryMeasure)) {
      return "Oranje - uiterlijk en zichtbaarheid zijn belangrijk";
    }
    return "Groen - vaak eenvoudiger, maar controle blijft nodig";
  }

  if (status === "Geen monumentstatus") {
    return "Groen - vaak eenvoudiger, controleer het altijd bij de gemeente";
  }

  return "Nog niet bepaald";
}

function buildMissingItems(profile, measures) {
  const nextMissingField = findNextMissingField(profile, measures);
  const items = [];

  if (!profile.street || !profile.houseNumber || !profile.postcode) {
    items.push("Volledig adres bevestigen");
  }
  if (!(profile.city || profile.municipality)) {
    items.push("Plaats of gemeente vastleggen");
  }
  if (!profile.monumentStatus) {
    items.push("Monumentstatus controleren");
  }
  if (!profile.protectedValues) {
    items.push("Beschermde waarden benoemen");
  }
  if (!profile.currentUse) {
    items.push("Huidig gebruik van het pand beschrijven");
  }
  if (!measures.length && !profile.measureDescription) {
    items.push("Maatregel kiezen");
  }
  if ((measures.length || profile.measureDescription) && !profile.measureLocation) {
    items.push("Locatie van de ingreep aangeven");
  }
  if ((measures.length || profile.measureDescription) && !profile.measureGoal) {
    items.push("Doel van de maatregel benoemen");
  }
  if (!profile.documentsAvailable) {
    items.push("Beschikbare stukken inventariseren");
  }

  if (!items.length && nextMissingField === "none") {
    items.push("Dossier is klaar voor verdiepende vergunning- en documentcheck");
  }

  return items;
}

function buildActionChecklist(profile, measures) {
  const hasMeasure = Boolean(measures.length || profile.measureDescription);

  return [
    buildChecklistItem(
      "Adres en pandbasis bevestigd",
      Boolean(profile.street && profile.houseNumber && profile.postcode && (profile.city || profile.municipality)),
    ),
    buildChecklistItem("Monumentstatus vastgelegd", Boolean(profile.monumentStatus)),
    buildChecklistItem("Beschermde waarden beschreven", Boolean(profile.protectedValues)),
    buildChecklistItem("Huidig gebruik vastgelegd", Boolean(profile.currentUse)),
    buildChecklistItem("Maatregel en locatie uitgewerkt", Boolean(hasMeasure && profile.measureLocation)),
    buildChecklistItem("Doel van de maatregel benoemd", Boolean(profile.measureGoal)),
    buildChecklistItem("Beschikbare stukken geïnventariseerd", Boolean(profile.documentsAvailable)),
  ];
}

function buildDocumentChecklist(profile, measures) {
  const docsText = normalizeIntentText(profile.documentsAvailable);
  const hasPhotos = docsText.includes("foto");
  const hasDrawings = /tekening|plattegrond|detail|gevelaanzicht/.test(docsText);
  const hasQuote = /offerte|prijsopgave|aannemer|installateur/.test(docsText);
  const hasTech = /specificatie|datasheet|u waarde|vermogen|technisch/.test(docsText);
  const primaryMeasure = measures[0] || "";
  const checklist = [
    buildChecklistItem("Overzichtsfoto's van pand en ingreep", hasPhotos),
    buildChecklistItem("Korte beschrijving van de bestaande situatie", Boolean(profile.measureDescription)),
    buildChecklistItem("Bestaande tekeningen of plattegronden", hasDrawings),
  ];

  if (primaryMeasure === "Glasvervanging") {
    checklist.push(buildChecklistItem("Detailfoto's van kozijnen en glas", hasPhotos));
    checklist.push(buildChecklistItem("Kozijndetail of doorsnede", hasDrawings));
    checklist.push(buildChecklistItem("Glas-specificatie of offerte", hasQuote || hasTech));
  } else if (primaryMeasure === "Warmtepomp") {
    checklist.push(buildChecklistItem("Opstelplaats en huidige installatie in beeld", hasPhotos));
    checklist.push(buildChecklistItem("Technische gegevens of indicatieve offerte", hasQuote || hasTech));
    checklist.push(buildChecklistItem("Schets van binnen- en buitenunit", hasDrawings));
  } else if (primaryMeasure === "Zonnepanelen") {
    checklist.push(buildChecklistItem("Dakfoto's en zicht vanaf openbare ruimte", hasPhotos));
    checklist.push(buildChecklistItem("Legplan of schets op het dak", hasDrawings));
    checklist.push(buildChecklistItem("Paneelspecificaties of offerte", hasQuote || hasTech));
  } else if (primaryMeasure === "Dakisolatie") {
    checklist.push(buildChecklistItem("Dakopbouw en foto's binnen/buiten", hasPhotos));
    checklist.push(buildChecklistItem("Detail van dakrand of aansluiting", hasDrawings));
    checklist.push(buildChecklistItem("Isolatiespecificatie of offerte", hasQuote || hasTech));
  } else if (primaryMeasure === "Gevelisolatie") {
    checklist.push(buildChecklistItem("Foto's van de betrokken gevel", hasPhotos));
    checklist.push(buildChecklistItem("Gevelaanzicht en detailtekening", hasDrawings));
    checklist.push(buildChecklistItem("Materiaal- of productinformatie", hasQuote || hasTech));
  } else if (primaryMeasure === "Vloerisolatie") {
    checklist.push(buildChecklistItem("Foto's van kruipruimte of vloeropbouw", hasPhotos));
    checklist.push(buildChecklistItem("Schets van vloerpakket of detail", hasDrawings));
    checklist.push(buildChecklistItem("Isolatieproduct of offerte", hasQuote || hasTech));
  } else if (primaryMeasure === "Ventilatie") {
    checklist.push(buildChecklistItem("Foto's van huidige roosters of kanalen", hasPhotos));
    checklist.push(buildChecklistItem("Schets van luchttoevoer en afvoer", hasDrawings));
    checklist.push(buildChecklistItem("Technische gegevens of offerte", hasQuote || hasTech));
  } else if (primaryMeasure === "Dakkapel") {
    checklist.push(buildChecklistItem("Foto's van het dakvlak", hasPhotos));
    checklist.push(buildChecklistItem("Gevel- en dakaanzicht met maatvoering", hasDrawings));
    checklist.push(buildChecklistItem("Materiaalstaat of offerte", hasQuote || hasTech));
  }

  return checklist;
}

function buildChecklistItem(label, done) {
  return {
    done: Boolean(done),
    label,
  };
}

function buildNextStepLabel(profile, measures, measureContext) {
  const nextMissingField = findNextMissingField(profile, measures);
  return buildNextStepLabelFromField(nextMissingField, measureContext);
}

function buildNextStepLabelFromField(nextMissingField, measureContext) {
  switch (nextMissingField) {
    case "street":
    case "houseNumber":
      return "Volledig adres bevestigen";
    case "postcode":
      return "Postcode vastleggen";
    case "municipality":
      return "Plaats of gemeente toevoegen";
    case "monumentStatus":
      return "Monumentstatus controleren";
    case "protectedValues":
      return "Beschermde waarden beschrijven";
    case "currentUse":
      return "Huidig gebruik van het pand vastleggen";
    case "measureDescription":
      return "Eerste maatregel kiezen";
    case "measureLocation":
      return "Locatie van de ingreep bepalen";
    case "measureGoal":
      return "Doel van de maatregel benoemen";
    case "documentsAvailable":
      return "Beschikbare foto's, tekeningen en offertes inventariseren";
    default: {
      const normalizedContext = normalizeMeasureContext(measureContext);
      if (normalizedContext.primaryMeasure === "Warmtepomp" && !normalizedContext.currentHeatingSystem) {
        return "Huidige verwarmingssysteem vastleggen";
      }

      return "Vergunningkans, documenten en subsidie verder uitwerken";
    }
  }
}

function determineStageFromField(nextMissingField) {
  if (["street", "houseNumber", "postcode", "municipality"].includes(nextMissingField)) {
    return "Basischeck";
  }
  if (["monumentStatus", "protectedValues", "currentUse"].includes(nextMissingField)) {
    return "Monumentanalyse";
  }
  if (["measureDescription", "measureLocation", "measureGoal"].includes(nextMissingField)) {
    return "Maatregel uitwerken";
  }
  if (nextMissingField === "documentsAvailable") {
    return "Stukken inventariseren";
  }

  return "Dossier bijna compleet";
}

function buildEffectiveUserMessage(messages, lastUserMessage) {
  const confirmedAddress = getConfirmedSuggestedAddress(messages, lastUserMessage);
  if (!confirmedAddress) {
    return lastUserMessage;
  }

  return `${confirmedAddress}. ${lastUserMessage}`.trim();
}

function getConfirmedSuggestedAddress(messages, lastUserMessage) {
  if (!isAffirmativeAddressConfirmation(lastUserMessage)) {
    return "";
  }

  const previousAssistantMessage = getAssistantMessageBeforeLastUser(messages);
  return extractSuggestedAddressFromAssistantMessage(previousAssistantMessage);
}

function getAssistantMessageBeforeLastUser(messages) {
  const items = Array.isArray(messages) ? messages : [];

  for (let index = items.length - 1; index >= 0; index -= 1) {
    const message = items[index];
    const messageText = getMessageText(message);
    if (message?.role === "assistant" || !messageText.trim()) {
      continue;
    }

    for (let assistantIndex = index - 1; assistantIndex >= 0; assistantIndex -= 1) {
      const assistantMessage = items[assistantIndex];
      const assistantText = getMessageText(assistantMessage);
      if (assistantMessage?.role === "assistant" && assistantText.trim()) {
        return assistantMessage;
      }
    }

    break;
  }

  return null;
}

function extractSuggestedAddressFromAssistantMessage(message) {
  const text = getMessageText(message);
  const suggestionMatch = text.match(/\bBedoel je\s+(.+?)\?(?:\s|$)/i);
  return suggestionMatch ? suggestionMatch[1].trim() : "";
}

function isAffirmativeAddressConfirmation(text) {
  const normalized = normalizeIntentText(text);
  if (!normalized) {
    return false;
  }

  const wordCount = normalized.split(" ").filter(Boolean).length;
  if (wordCount > 8 || /\d/.test(normalized)) {
    return false;
  }

  if (/\b(nee|niet|maar|alleen|behalve|echter|toch|anders|ander|fout)\b/.test(normalized)) {
    return false;
  }

  const exactMatches = new Set([
    "ja",
    "ja hoor",
    "ja graag",
    "ja klopt",
    "ja dat klopt",
    "jazeker",
    "zeker",
    "zeker weten",
    "klopt",
    "dat klopt",
    "klopt helemaal",
    "inderdaad",
    "precies",
    "juist",
    "correct",
    "helemaal goed",
    "is goed",
    "helemaal",
    "yes",
    "yep",
    "jep",
    "dat bedoel ik",
    "die bedoel ik",
    "dat is hem",
    "dat is m",
    "die is hem",
    "die is m",
  ]);

  if (exactMatches.has(normalized)) {
    return true;
  }

  return ["ja", "klopt", "inderdaad", "precies", "zeker", "jazeker"].some((phrase) =>
    normalized.startsWith(`${phrase} `),
  );
}

function getLastUserMessage(messages) {
  return (
    getMessageText(
      [...messages].reverse().find((message) => {
        const messageText = getMessageText(message);
        return message?.role !== "assistant" && typeof messageText === "string" && messageText.trim();
      }),
    ) || ""
  );
}

function analyzeConversationState(messages, lastUserMessage) {
  const previousAssistantMessage = getAssistantMessageBeforeLastUser(messages);
  const normalizedLastUserMessage = normalizeIntentText(lastUserMessage);

  return {
    genericContinue: isGenericContinueResponse(normalizedLastUserMessage),
    lastAskedField: inferAskedFieldFromAssistantMessage(previousAssistantMessage),
    userFeelsStuck: isStuckResponse(normalizedLastUserMessage),
    userIsUncertain: isUncertainResponse(lastUserMessage),
    userNeedsReassurance: isReassuranceSignal(normalizedLastUserMessage),
  };
}

function inferAskedFieldFromAssistantMessage(message) {
  const normalized = normalizeIntentText(getMessageText(message));

  if (!normalized) {
    return "";
  }

  if (normalized.includes("straat en het huisnummer")) {
    return "street";
  }
  if (normalized.includes("postcode")) {
    return "postcode";
  }
  if (normalized.includes("plaats of gemeente")) {
    return "municipality";
  }
  if (normalized.includes("rijksmonument") || normalized.includes("gemeentelijk monument")) {
    return "monumentStatus";
  }
  if (normalized.includes("beeldbepalend") || normalized.includes("beschermd")) {
    return "protectedValues";
  }
  if (normalized.includes("hoe wordt het pand nu gebruikt")) {
    return "currentUse";
  }
  if (normalized.includes("welke maatregel") || normalized.includes("welke ingreep")) {
    return "measureDescription";
  }
  if (normalized.includes("waar in of aan het pand")) {
    return "measureLocation";
  }
  if (normalized.includes("wat wil je met deze maatregel") || normalized.includes("hoofddoel van deze maatregel")) {
    return "measureGoal";
  }
  if (normalized.includes("welke stukken heb je al") || normalized.includes("heb je al iets beschikbaar")) {
    return "documentsAvailable";
  }

  return "";
}

function isUncertainResponse(text) {
  const normalized = normalizeIntentText(text);

  if (!normalized) {
    return false;
  }

  const uncertainPhrases = [
    "geen idee",
    "weet ik niet",
    "ik weet het niet",
    "geen flauw idee",
    "onbekend",
    "geen verstand van",
    "durf ik niet te zeggen",
    "lastig te zeggen",
    "niet zeker",
    "zou ik niet weten",
  ];

  return uncertainPhrases.some((phrase) => normalized === phrase || normalized.includes(phrase));
}

function isGenericContinueResponse(normalizedText) {
  if (!normalizedText) {
    return false;
  }

  const phrases = [
    "oke en nu",
    "ok en nu",
    "graag laat maar komen",
    "laat maar komen",
    "ga door",
    "vertel maar",
    "oke",
    "ok",
    "prima",
  ];

  return phrases.some((phrase) => normalizedText === phrase || normalizedText.includes(phrase));
}

function isStuckResponse(normalizedText) {
  if (!normalizedText) {
    return false;
  }

  return [
    "ik kom er niet uit",
    "ik loop vast",
    "dit is lastig",
    "best lastig",
    "ik vind dit moeilijk",
    "ik zie er tegenop",
  ].some((phrase) => normalizedText.includes(phrase));
}

function isReassuranceSignal(normalizedText) {
  if (!normalizedText) {
    return false;
  }

  return isStuckResponse(normalizedText) || [
    "ik twijfel",
    "spannend",
    "ingewikkeld",
    "geen idee",
    "weet ik niet",
  ].some((phrase) => normalizedText.includes(phrase));
}

function buildGuidedFreeAcknowledgement(conversationState) {
  if (conversationState?.userFeelsStuck) {
    return "Dat is heel begrijpelijk. We pakken het samen rustig stap voor stap.";
  }

  if (conversationState?.userIsUncertain) {
    return "Geen probleem, dan pakken we gewoon even een ander haakje.";
  }

  if (conversationState?.genericContinue) {
    return "Helemaal goed, dan bouwen we vanaf hier rustig verder.";
  }

  if (conversationState?.userNeedsReassurance) {
    return "Dat is logisch, dit soort trajecten kunnen best veel voelen.";
  }

  return "";
}

function buildConversationStatePrompt(conversationState) {
  if (!conversationState) {
    return "Gespreksstatus: geen extra gesprekssignalen gedetecteerd.";
  }

  const notes = [];
  if (conversationState.userIsUncertain && conversationState.lastAskedField) {
    notes.push(
      `de gebruiker wist het antwoord niet op ${conversationState.lastAskedField}; herhaal die vraag niet letterlijk maar kies een buuronderwerp`,
    );
  }
  if (conversationState.userFeelsStuck) {
    notes.push("de gebruiker lijkt vast te lopen; reageer eerst geruststellend en structureer daarna");
  }
  if (conversationState.genericContinue) {
    notes.push("de gebruiker geeft groen licht om verder te gaan; geef dus een echte volgende stap en geen herhaling of statuszin");
  }
  if (conversationState.userNeedsReassurance) {
    notes.push("de toon mag expliciet warm, geruststellend en ontwapenend zijn");
  }

  if (!notes.length) {
    return "Gespreksstatus: de gebruiker gaf geen expliciet onzeker antwoord op de laatste vraag.";
  }

  return `Gespreksstatus: ${notes.join(". ")}.`;
}

function getMessageText(message) {
  if (!message || typeof message !== "object") {
    return "";
  }

  if (typeof message.text === "string") {
    return message.text;
  }

  if (typeof message.content === "string") {
    return message.content;
  }

  return "";
}

function normalizeIntentText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLookupText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStreetName(value) {
  return normalizeLookupText(value)
    .replace(/\bpr\b/g, "prins")
    .replace(/\bstr\b/g, "straat")
    .replace(/\bln\b/g, "laan")
    .replace(/\s+/g, " ")
    .trim();
}

function splitStreetType(value) {
  const normalized = normalizeStreetName(value);

  for (const roadType of roadTypes) {
    if (normalized === roadType) {
      return { stem: "", type: roadType };
    }

    if (normalized.endsWith(` ${roadType}`)) {
      return {
        stem: normalized.slice(0, -roadType.length).trim(),
        type: roadType,
      };
    }

    if (normalized.endsWith(roadType)) {
      return {
        stem: normalized.slice(0, -roadType.length).trim(),
        type: roadType,
      };
    }
  }

  return { stem: normalized, type: "" };
}

function normalizePostcode(value) {
  const compact = String(value || "").replace(/\s+/g, "").toUpperCase();
  if (/^[1-9][0-9]{3}[A-Z]{2}$/.test(compact)) {
    return `${compact.slice(0, 4)} ${compact.slice(4)}`;
  }
  return compact;
}

function normalizeStreetCandidate(value) {
  const candidate = String(value || "").trim().replace(/^(aan|op)\s+/i, "");
  const stripped = candidate.match(
    new RegExp(`(?:.*?\\b(?:op|aan|bij)\\s+(?:de|het)?\\s*)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' .-]*?(?:${roadTypePattern}))$`, "i"),
  );

  return (stripped ? stripped[1] : candidate).trim();
}

function extractLooseCityFromText(text) {
  const match = String(text || "").match(
    /\b(?:in|te)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,}?)(?=(?:[,.!?]|(?:\s+(?:en|maar|want|omdat|voor)\b)|$))/i,
  );

  return match ? normalizePlaceName(match[1]) : "";
}

function normalizePlaceName(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function cleanPlaceCandidate(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const stopWords = new Set([
    "verduurzamen",
    "verbouwen",
    "renoveren",
    "isoleren",
    "plaatsen",
    "nemen",
    "willen",
    "wil",
    "gaan",
    "laten",
    "onderzoeken",
    "bekijken",
    "checken",
    "doen",
  ]);
  const cutIndex = parts.findIndex((part) => stopWords.has(part.toLowerCase()));
  const cleaned = (cutIndex === -1 ? parts : parts.slice(0, cutIndex)).join(" ");

  return normalizePlaceName(cleaned);
}

function normalizeChatMode(value) {
  return value === "strict" ? "strict" : "guided-free";
}

function getModePrompt(chatMode) {
  return modePrompts[normalizeChatMode(chatMode)];
}

function normalizeHouseNumber(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function escapeLocatieserverValue(value) {
  return String(value || "").replace(/[^\p{L}\p{N}-]/gu, " ").replace(/\s+/g, " ").trim();
}

function parsePointWkt(value) {
  const match = String(value || "").match(/POINT\(([-0-9.]+)\s+([-0-9.]+)\)/i);
  if (!match) {
    return null;
  }

  return {
    lon: Number(match[1]),
    lat: Number(match[2]),
  };
}

function buildBboxAroundPoint(point, delta) {
  return [point.lon - delta, point.lat - delta, point.lon + delta, point.lat + delta];
}

function withJsonFormat(url) {
  const value = new URL(String(url));
  if (!value.searchParams.has("f")) {
    value.searchParams.set("f", "json");
  }
  return value;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Lookup mislukt (${response.status}) voor ${response.url}`);
  }

  return response.json();
}

function calculateDistanceMeters(left, right) {
  const earthRadius = 6_371_000;
  const lat1 = degreesToRadians(left.lat);
  const lat2 = degreesToRadians(right.lat);
  const deltaLat = degreesToRadians(right.lat - left.lat);
  const deltaLon = degreesToRadians(right.lon - left.lon);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function pointInsideGeometry(point, geometry) {
  if (!geometry || !geometry.type || !Array.isArray(geometry.coordinates)) {
    return false;
  }

  if (geometry.type === "Polygon") {
    return pointInsidePolygon(point, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => pointInsidePolygon(point, polygon));
  }

  return false;
}

function pointInsidePolygon(point, polygon) {
  if (!Array.isArray(polygon) || !polygon.length) {
    return false;
  }

  const outerRing = polygon[0];
  return pointInsideRing(point, outerRing);
}

function pointInsideRing(point, ring) {
  let inside = false;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [currentLon, currentLat] = ring[index];
    const [previousLon, previousLat] = ring[previous];
    const intersects =
      currentLat > point.lat !== previousLat > point.lat &&
      point.lon <
        ((previousLon - currentLon) * (point.lat - currentLat)) / (previousLat - currentLat) + currentLon;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function tryReadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    const result = {};

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
      result[key] = value;
    }

    return result;
  } catch {
    return {};
  }
}
