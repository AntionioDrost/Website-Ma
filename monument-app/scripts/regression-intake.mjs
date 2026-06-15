import assert from "node:assert/strict";

const baseUrl = process.env.MONUMENT_BASE_URL || "http://127.0.0.1:4173";
const directMode = process.env.MONUMENT_DIRECT === "1";

const completeProfile = {
  street: "Utrechtseweg",
  houseNumber: "47",
  postcode: "3701 CP",
  city: "Zeist",
  municipality: "Zeist",
  buildingAge: "Gebouwd in 1902",
  buildingType: "Woonhuis",
  currentUse: "Woning",
  ownershipRole: "Eigenaar",
  monumentStatus: "Beschermd stadsgezicht",
  protectedView: "Beschermd stadsgezicht",
  protectedValues: "Gevel",
  measureDescription: "Ik wil graag een volledig elektrische warmtepomp installeren.",
  measureLocation: "Achterzijde",
  measureGoal: "",
  supportFocus: "",
  documentsAvailable: "",
  notes: "",
};

let directHandleChatRequest = null;

if (directMode) {
  ({ handleChatRequest: directHandleChatRequest } = await import("../server.mjs"));
}

async function postChat({ chatMode = "guided-free", messages, profile, selectedMeasures }) {
  if (directMode && directHandleChatRequest) {
    return directHandleChatRequest({
      chatMode,
      messages,
      profile,
      selectedMeasures,
    });
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chatMode,
      messages,
      profile,
      selectedMeasures,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API call failed (${response.status}): ${text}`);
  }

  return response.json();
}

async function runScenario(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await runScenario("Monumentstatus quick reply 'Onbekend' is accepted", async () => {
  const result = await postChat({
    chatMode: "strict",
    messages: [
      { role: "assistant", text: "Weet je of dit een rijksmonument, gemeentelijk monument of beschermd stads- of dorpsgezicht is?" },
      { role: "user", text: "Onbekend" },
    ],
    profile: {
      ...completeProfile,
      monumentStatus: "",
      protectedView: "",
      protectedValues: "",
    },
    selectedMeasures: [],
  });

  assert.equal(result.profile.monumentStatus, "Onbekend");
  assert.ok(!/rijksmonument|gemeentelijk monument|beschermd stads/i.test(result.reply));
});

await runScenario("Location check asks for woningtype before the rest of onboarding", async () => {
  const result = await postChat({
    chatMode: "strict",
    messages: [
      { role: "assistant", text: "Welkom. Ik help je dit monumentdossier stap voor stap opbouwen. Om te beginnen: wat is het adres van het pand?" },
      { role: "user", text: "Prins Hendriklaan 26 in Zeist" },
    ],
    profile: {
      ...completeProfile,
      street: "",
      houseNumber: "",
      postcode: "",
      city: "",
      municipality: "",
      buildingAge: "",
      buildingType: "",
      monumentStatus: "",
      protectedView: "",
      protectedValues: "",
      currentUse: "",
      measureDescription: "",
      measureLocation: "",
      measureGoal: "",
      documentsAvailable: "",
    },
    selectedMeasures: [],
  });

  assert.equal(result.profile.buildingType, "");
  assert.match(result.reply, /type woning/i);
  assert.deepEqual(result.quickReplies, [
    "Villa",
    "Hallenhuisboerderij",
    "Bungalow",
    "Grachtenpand",
    "Rijtjeshuis interbellum",
    "Anders",
  ]);
});

await runScenario("Building type quick reply is stored before onboarding continues", async () => {
  const result = await postChat({
    chatMode: "strict",
    messages: [
      { role: "assistant", text: "Ik heb het adres gevonden. Kies nu eerst welk type woning dit is." },
      { role: "user", text: "Villa" },
    ],
    profile: {
      ...completeProfile,
      buildingType: "",
      monumentStatus: "",
      protectedView: "",
      protectedValues: "",
      currentUse: "",
      measureDescription: "",
      measureLocation: "",
      measureGoal: "",
      documentsAvailable: "",
    },
    selectedMeasures: [],
  });

  assert.equal(result.profile.buildingType, "Villa");
  assert.ok(!/type woning/i.test(result.reply));
  assert.match(result.reply, /rijksmonument|gemeentelijk monument|stads- of dorpsgezicht/i);
});

await runScenario("Warmtepomp docs quick reply 'Nog niets' advances the flow", async () => {
  const result = await postChat({
    chatMode: "strict",
    messages: [
      { role: "assistant", text: "Heb je al iets beschikbaar zoals foto's, tekeningen, offertes of technische informatie?" },
      { role: "user", text: "Nog niets" },
    ],
    profile: {
      ...completeProfile,
      measureGoal: "Meer comfort",
      documentsAvailable: "",
    },
    selectedMeasures: ["Warmtepomp"],
  });

  assert.equal(result.profile.documentsAvailable, "Nog niets beschikbaar");
  assert.match(result.reply, /cv-ketel|stadsverwarming/i);
  assert.deepEqual(result.quickReplies, ["Cv-ketel", "Stadsverwarming", "Anders"]);
});

await runScenario("Quick reply 'Lagere energiekosten' does not repeat the same goal question", async () => {
  const result = await postChat({
    chatMode: "strict",
    messages: [
      { role: "assistant", text: "Wat is het hoofddoel van deze maatregel: lagere energiekosten, meer comfort, onderhoud of iets anders?" },
      { role: "user", text: "Lagere energiekosten" },
    ],
    profile: {
      ...completeProfile,
      measureGoal: "",
      documentsAvailable: "Nog niets beschikbaar",
    },
    selectedMeasures: ["Warmtepomp"],
  });

  assert.equal(result.profile.measureGoal, "Energiekosten verlagen");
  assert.ok(!/hoofddoel van deze maatregel/i.test(result.reply));
  assert.deepEqual(result.quickReplies, ["Cv-ketel", "Stadsverwarming", "Anders"]);
});

await runScenario("Quick reply 'Cv-ketel' leads to the insulation question", async () => {
  const result = await postChat({
    chatMode: "strict",
    messages: [
      { role: "user", text: "Ik wil graag een volledig elektrische warmtepomp installeren." },
      { role: "assistant", text: "Heb je nu een cv-ketel, stadsverwarming of iets anders voor verwarming en warm water?" },
      { role: "user", text: "Cv-ketel" },
    ],
    profile: {
      ...completeProfile,
      measureGoal: "Energiekosten verlagen",
      documentsAvailable: "Nog niets beschikbaar",
    },
    selectedMeasures: ["Warmtepomp"],
  });

  assert.match(result.reply, /geisoleerd|glas, dak en vloer/i);
  assert.deepEqual(result.quickReplies, ["Goed geisoleerd", "Redelijk", "Nog beperkt"]);
});

await runScenario("Quick reply 'Redelijk' moves from insulation to the focus question", async () => {
  const result = await postChat({
    chatMode: "strict",
    messages: [
      { role: "user", text: "Ik wil graag een volledig elektrische warmtepomp installeren." },
      { role: "user", text: "Cv-ketel" },
      { role: "assistant", text: "Goed om te weten. Hoe goed is het pand nu geisoleerd, bijvoorbeeld glas, dak en vloer?" },
      { role: "user", text: "Redelijk" },
    ],
    profile: {
      ...completeProfile,
      measureGoal: "Energiekosten verlagen",
      documentsAvailable: "Nog niets beschikbaar",
    },
    selectedMeasures: ["Warmtepomp"],
  });

  assert.ok(!/hoe goed is het pand nu geisoleerd/i.test(result.reply));
  assert.match(result.reply, /haalbaarheid|monumentbeperkingen|kosten en subsidie/i);
  assert.deepEqual(result.quickReplies, ["Haalbaarheid", "Monumentbeperkingen", "Kosten en subsidie"]);
});

await runScenario("Quick reply 'Haalbaarheid' does not repeat the focus question", async () => {
  const result = await postChat({
    chatMode: "strict",
    messages: [
      { role: "user", text: "Ik wil graag een volledig elektrische warmtepomp installeren." },
      { role: "user", text: "Cv-ketel" },
      { role: "user", text: "Redelijk" },
      { role: "assistant", text: "Wil je dat ik voor deze warmtepomp vooral meekijk naar haalbaarheid, monumentbeperkingen of kosten en subsidie?" },
      { role: "user", text: "Haalbaarheid" },
    ],
    profile: {
      ...completeProfile,
      measureGoal: "Energiekosten verlagen",
      documentsAvailable: "Nog niets beschikbaar",
    },
    selectedMeasures: ["Warmtepomp"],
  });

  assert.equal(result.profile.supportFocus, "Haalbaarheid");
  assert.ok(!/voor deze warmtepomp vooral meekijk/i.test(result.reply));
  assert.match(result.reply, /radiatoren|vloerverwarming|allebei/i);
  assert.deepEqual(result.quickReplies, ["Radiatoren", "Vloerverwarming", "Allebei"]);
});

await runScenario("Haalbaarheid flow keeps moving after heating emitters are known", async () => {
  const result = await postChat({
    chatMode: "guided-free",
    messages: [
      { role: "user", text: "Ik wil graag een volledig elektrische warmtepomp installeren." },
      { role: "user", text: "Haalbaarheid" },
      { role: "assistant", text: "Heb je nu radiatoren, vloerverwarming of allebei?" },
      { role: "user", text: "Radiatoren" },
    ],
    profile: {
      ...completeProfile,
      measureGoal: "Energiekosten verlagen",
      supportFocus: "Haalbaarheid",
      documentsAvailable: "Nog niets beschikbaar",
    },
    selectedMeasures: ["Warmtepomp"],
  });

  assert.ok(!/ik kan nu de belangrijkste aandachtspunten voor afgiftesysteem en opstelling verder uitwerken/i.test(result.reply));
  assert.match(result.reply, /cv-ketel|stadsverwarming|geisoleerd|glas, dak en vloer/i);
});

await runScenario("Guided-free mode acknowledges stuck users before steering further", async () => {
  const result = await postChat({
    chatMode: "guided-free",
    messages: [
      { role: "assistant", text: "Welkom." },
      { role: "user", text: "Ik zie er eigenlijk best tegenop en ik kom er niet uit." },
    ],
    profile: {
      ...completeProfile,
      measureDescription: "",
      measureLocation: "",
      measureGoal: "",
      supportFocus: "",
      documentsAvailable: "",
    },
    selectedMeasures: [],
  });

  assert.match(result.reply, /begrijpelijk|samen rustig stap voor stap/i);
});

await runScenario("Generic focus quick reply 'Vergunning' is accepted without repetition", async () => {
  const result = await postChat({
    chatMode: "strict",
    messages: [
      { role: "assistant", text: "Wil je dat ik hierna vooral meekijk naar vergunning, documenten of subsidie?" },
      { role: "user", text: "Vergunning" },
    ],
    profile: {
      ...completeProfile,
      measureDescription: "Ik wil glas vervangen aan de achterzijde.",
      measureGoal: "Meer comfort",
      documentsAvailable: "Nog niets beschikbaar",
    },
    selectedMeasures: ["Glasvervanging"],
  });

  assert.equal(result.profile.supportFocus, "Vergunning");
  assert.ok(!/hierna vooral meekijk naar vergunning, documenten of subsidie/i.test(result.reply));
  assert.match(result.reply, /vergunning/i);
});

await runScenario("Follow-up after 'Kosten en subsidie' does not repeat the same confirmation", async () => {
  const result = await postChat({
    chatMode: "strict",
    messages: [
      { role: "user", text: "Ik wil graag een volledig elektrische warmtepomp installeren." },
      { role: "user", text: "Cv-ketel" },
      { role: "user", text: "Redelijk" },
      { role: "user", text: "Lagere energiekosten" },
      { role: "user", text: "Kosten en subsidie" },
      { role: "assistant", text: "Helder. Dan kijk ik vooral naar kosten en subsidie voor deze warmtepomp. Ik kan nu de kostenkant en mogelijke regelingen voor je structureren." },
      { role: "user", text: "Oke en nu?" },
    ],
    profile: {
      ...completeProfile,
      measureDescription: "Ik wil graag een volledig elektrische warmtepomp installeren.",
      measureGoal: "Energiekosten verlagen",
      supportFocus: "Kosten en subsidie",
      documentsAvailable: "Nog niets beschikbaar",
    },
    selectedMeasures: ["Warmtepomp"],
  });

  assert.ok(!/ik kan nu de kostenkant en mogelijke regelingen voor je structureren/i.test(result.reply));
  assert.match(result.reply, /gasverbruik|m3/i);
});

await runScenario("Generic continue message gets a real next step instead of repeated summary", async () => {
  const result = await postChat({
    chatMode: "guided-free",
    messages: [
      { role: "user", text: "Ik wil graag een volledig elektrische warmtepomp installeren." },
      { role: "user", text: "Haalbaarheid" },
      { role: "assistant", text: "Heb je nu radiatoren, vloerverwarming of allebei?" },
      { role: "user", text: "Radiatoren" },
      { role: "assistant", text: "En wat heb je nu als verwarmingssysteem, bijvoorbeeld een cv-ketel, stadsverwarming of iets anders?" },
      { role: "user", text: "Cv-ketel" },
      { role: "assistant", text: "Wil je dat ik eerst kijk naar technische risico's, de opstelling of het verwachte comfort?" },
      { role: "user", text: "Graag, laat maar komen!" },
    ],
    profile: {
      ...completeProfile,
      measureDescription: "Ik wil graag een volledig elektrische warmtepomp installeren.",
      measureGoal: "Energiekosten verlagen",
      supportFocus: "Haalbaarheid",
      documentsAvailable: "Nog niets beschikbaar",
    },
    selectedMeasures: ["Warmtepomp"],
  });

  assert.ok(!/wil je dat ik eerst kijk naar technische risico's, de opstelling of het verwachte comfort/i.test(result.reply));
  assert.match(result.reply, /technische risico|opstelling|comfort|geisoleerd|geïsoleerd|zichtbaar/i);
  assert.ok(!/ik snap nu beter dat het vooral om warmtepomp gaat/i.test(result.reply));
});

await runScenario("Guided-free mode moves on after 'geen idee' instead of repeating the same question", async () => {
  const result = await postChat({
    chatMode: "guided-free",
    messages: [
      { role: "assistant", text: "Welke onderdelen zijn hier volgens jou beeldbepalend of beschermd, bijvoorbeeld gevel, kozijnen, dak of interieur? Als je het niet weet is dat ook prima." },
      { role: "user", text: "geen idee" },
    ],
    profile: {
      ...completeProfile,
      protectedValues: "",
      currentUse: "",
    },
    selectedMeasures: ["Glasvervanging"],
  });

  assert.ok(!/beeldbepalend|beschermd/i.test(result.reply));
  assert.match(result.reply, /wat hoop je hiermee vooral te bereiken|hoe wordt het pand nu gebruikt/i);
  assert.deepEqual(result.quickReplies, []);
});

await runScenario("Guided-free mode asks about plan before monument details", async () => {
  const result = await postChat({
    chatMode: "guided-free",
    messages: [
      { role: "assistant", text: "Welkom." },
      { role: "user", text: "Ik wil bij mijn monumentale woning kijken naar glasvervanging aan de achterzijde." },
    ],
    profile: {
      street: "Utrechtseweg",
      houseNumber: "47",
      postcode: "3701 CP",
      city: "Zeist",
      municipality: "Zeist",
      buildingAge: "Gebouwd in 1902",
      buildingType: "Woonhuis",
      currentUse: "",
      ownershipRole: "Eigenaar",
      monumentStatus: "Beschermd stadsgezicht",
      protectedView: "Beschermd stadsgezicht",
      protectedValues: "",
      measureDescription: "",
      measureLocation: "",
      measureGoal: "",
      supportFocus: "",
      documentsAvailable: "",
      notes: "",
    },
    selectedMeasures: [],
  });

  assert.ok(!/beeldbepalend|beschermd/i.test(result.reply));
  assert.match(result.reply, /wat hoop je hiermee vooral te bereiken|op welk deel van het pand/i);
  assert.deepEqual(result.quickReplies, []);
});

await runScenario("Guided-free mode does not show warmtepomp quick replies during postcode question", async () => {
  const result = await postChat({
    chatMode: "guided-free",
    messages: [
      { role: "assistant", text: "Welkom." },
      { role: "user", text: "Ik wil graag mijn woning op de Prins Hendriklaan 26 in Zeist verduurzamen. Ik wil graag een all electric warmtepomp nemen" },
    ],
    profile: {},
    selectedMeasures: [],
  });

  assert.match(result.reply, /postcode/i);
  assert.deepEqual(result.quickReplies, []);
});

await runScenario("Guided-free mode auto-finds postcode from street, house number and city", async () => {
  const result = await postChat({
    chatMode: "guided-free",
    messages: [
      { role: "assistant", text: "Welkom." },
      { role: "user", text: "Ik wil graag mijn woning op de Prins hendriklaan 26 in zeist verduurzamen. Ik wil graag een all electric warmtepomp nemen" },
    ],
    profile: {},
    selectedMeasures: [],
  });

  assert.equal(result.profile.postcode, "3701 CP");
  assert.ok(!/heb je ook de postcode/i.test(result.reply));
  assert.match(result.reply, /op welk deel van het pand/i);
  assert.ok(!/ik snap nu beter dat het vooral om warmtepomp gaat/i.test(result.reply));
});

console.log("All intake regressions passed.");
