import { AppLanguage } from '../../../core/services/locale-preferences.service';
import { CompanionTopic } from '../../../core/services/companion-api.service';

export interface GuideAnswer {
  readonly title: string;
  readonly body: string;
  readonly route?: string | null;
  readonly action?: string | null;
  readonly urgent?: boolean;
}

/** Short greetings, written for each language so the first thing people hear is their own language. */
export function welcomeText(language: AppLanguage, name: string): string {
  const lines: Record<AppLanguage, string> = {
    en: `Hello! I’m ${name}, your SmartClinic guide. What would you like to do today?`,
    pcm: `Hello! I be ${name}, your SmartClinic guide. Wetin you wan do today?`,
    yo: `Ẹ n lẹ! Èmi ni ${name}, olùrànlọ́wọ́ SmartClinic yín. Kí lẹ fẹ́ ṣe lónìí?`,
    ha: `Sannu! Ni ne ${name}, mai taimaka maka a SmartClinic. Me kake so ka yi yau?`,
    ig: `Ndewo! Abụ m ${name}, onye ndu gị na SmartClinic. Gịnị ka ị chọrọ ime taa?`,
    rw: `Muraho! Nitwa ${name}, umufasha wawe kuri SmartClinic. Wifuza gukora iki uyu munsi?`,
    fr: `Bonjour ! Je suis ${name}, votre guide SmartClinic. Que souhaitez-vous faire aujourd’hui ?`,
    sw: `Habari! Mimi ni ${name}, msaidizi wako wa SmartClinic. Ungependa kufanya nini leo?`,
    tw: `Akwaaba! Me din de ${name}, wo SmartClinic boafoɔ. Dɛn na wopɛ sɛ woyɛ nnɛ?`,
  };
  return lines[language];
}

/** Said when something sounds like an emergency. Shown instantly, without waiting for the network. */
export const URGENT_TEXT: Readonly<Record<AppLanguage, GuideAnswer>> = {
  en: { title: 'Get urgent help now', body: 'This guide is not an emergency service. Call 112 or go to the nearest hospital emergency unit now. Do not wait for an appointment.', urgent: true },
  pcm: { title: 'Find help now now', body: 'This guide no be emergency service. Call 112 or go the nearest hospital emergency now now. No wait for appointment.', urgent: true },
  yo: { title: 'Wá ìrànlọ́wọ́ báyìí', body: 'Ìtọ́sọ́nà yìí kì í ṣe iṣẹ́ pàjáwìrì. Pe 112 tàbí lọ sí ẹ̀ka pàjáwìrì ilé-ìwòsàn tó súnmọ́ jùlọ báyìí.', urgent: true },
  ha: { title: 'Nemi taimako yanzu', body: 'Wannan jagorar ba sabis na gaggawa ba ce. Kira 112 ko ka je sashen gaggawa na asibiti mafi kusa yanzu.', urgent: true },
  ig: { title: 'Chọọ enyemaka ugbu a', body: 'Onye ndu a abụghị ọrụ mberede. Kpọọ 112 ma ọ bụ gaa ngalaba mberede nke ụlọ ọgwụ kacha nso ugbu a.', urgent: true },
  rw: { title: 'Shaka ubufasha ubu', body: 'Uyu mufasha si serivisi y’ubutabazi. Hamagara 112 cyangwa 912, cyangwa ujye ku bitaro bikwegereye ubu.', urgent: true },
  fr: { title: 'Obtenez de l’aide maintenant', body: 'Ce guide n’est pas un service d’urgence. Appelez le 112 ou allez immédiatement aux urgences de l’hôpital le plus proche.', urgent: true },
  sw: { title: 'Pata msaada sasa', body: 'Mwongozo huu si huduma ya dharura. Piga 112 au nenda kwenye kitengo cha dharura cha hospitali iliyo karibu sasa hivi.', urgent: true },
  tw: { title: 'Hwehwɛ mmoa seesei', body: 'Saa boafoɔ yi nyɛ ntɛmntɛm mmoa adwuma. Frɛ 112 anaa kɔ ayaresabea a ɛbɛn wo no seesei ara.', urgent: true },
};

export const URGENT_PATTERN =
  /(chest pain|can'?t breathe|cannot breathe|not breathing|unconscious|fainted|seizure|convuls|heavy bleeding|bleeding a lot|stroke|suicid|kill myself|overdose|poison|emergency|douleur thoracique|je ne peux pas respirer|kifua kinauma|siwezi kupumua|sindashobora guhumeka)/i;

/** Built-in explanations in English and Pidgin: instant, free, and available offline. */
export function builtInTopic(topic: Exclude<CompanionTopic, 'welcome'>, pcm: boolean): GuideAnswer {
  const answers: Record<Exclude<CompanionTopic, 'welcome'>, GuideAnswer> = {
    'stay-well': {
      title: 'Stay Well',
      body: pcm
        ? 'Stay Well help you check your health before sickness start. Choose Guided Self-Check if you wan answer simple questions yourself, or choose Health Check if you want provider check you, for house or for clinic.'
        : 'Stay Well helps you understand your health before illness starts. Choose Guided Self-Check to answer simple questions yourself, or a Health Check to have a provider check you, at home or at a clinic.',
      route: '/me/health-journey',
      action: pcm ? 'Start am' : 'Explore Stay Well',
    },
    'find-care': {
      title: 'Find Care',
      body: pcm
        ? 'Find Care help you when something dey worry you. Tell us the problem with simple words. Choose online, home visit or clinic. Check the provider, price and time before you confirm. If na emergency, go hospital now.'
        : 'Find Care helps when something is worrying you. Describe the problem in simple words, then choose online, a home visit or in person. Check the provider, price and time before confirming. For an emergency, go to the nearest hospital now.',
      route: '/me/request-care',
      action: pcm ? 'Find care' : 'Find Care',
    },
    hospital: {
      title: 'My Hospital',
      body: pcm
        ? 'My Hospital connect you to hospital wey you dey use. Search the hospital, then choose whether you be new or old patient. After connection, you fit see bills, appointments, receipts and records.'
        : 'My Hospital connects you to a hospital you already use. Search for it and choose whether you are a new or existing patient. Once connected, bills, appointments, receipts and records can appear here.',
      route: '/me/providers/connect',
      action: pcm ? 'Connect hospital' : 'Connect My Hospital',
    },
    appointments: {
      title: pcm ? 'Why book appointment?' : 'Why book an appointment?',
      body: pcm
        ? 'Appointment help provider prepare before you reach. Choose the care, provider, date and time. Check the price, then confirm.'
        : 'An appointment helps the provider prepare before you arrive. Choose the care you need, the provider, date and time. Check the price, then confirm.',
      route: '/me/request-care',
      action: pcm ? 'Book care' : 'Book Care',
    },
    passport: {
      title: 'Health Passport',
      body: pcm
        ? 'Health Passport na one place for your checks, results and care. Each reading get stamp wey show who confirm am. Na you choose wetin to share and for how long.'
        : 'Your Health Passport keeps your checks, results and care in one place. Each reading is stamped to show who confirmed it. You choose what to share, and for how long.',
      route: '/me/health-passport',
      action: pcm ? 'Open passport' : 'Open Health Passport',
    },
    network: {
      title: 'Invite & earn',
      body: pcm
        ? 'Open My Impact, copy your link, share am. When the person join and activate, you go get referral points.'
        : 'Open My Impact, copy your personal link and share it. When the person joins and activates their account, you earn referral points.',
      route: '/me/impact',
      action: pcm ? 'See my impact' : 'View My Impact',
    },
    points: {
      title: pcm ? 'Wellness points' : 'Wellness points',
      body: pcm
        ? 'You dey get points when you answer the daily question, check in, do your routine and complete your passport. Points fit remove up to 20% from Smart Health Check. Dem no be cash.'
        : 'You earn points for the daily health question, check-ins, routines and completing your passport. Points can take up to 20% off a Smart Health Check. They are not cash.',
      route: '/me/progress',
      action: pcm ? 'See my points' : 'See my points',
    },
    'know-numbers': {
      title: pcm ? 'Know your numbers' : 'Know your numbers',
      body: pcm
        ? 'Your blood group and genotype dey important for emergency, surgery and family planning. If you no know am, we fit arrange the test for your house or for lab.'
        : 'Your blood group and genotype matter in an emergency, before surgery and when planning a family. If you don’t know them, we can arrange the test at home or at a lab.',
      route: '/me/profile',
      action: pcm ? 'Find out' : 'Find out',
    },
  };
  return answers[topic];
}

/** When smart answers are off: match simple keywords to a built-in topic. */
export function keywordTopic(text: string): Exclude<CompanionTopic, 'welcome'> | 'tests' | 'bills' | 'specialist' | null {
  const v = text.toLowerCase();
  if (/(pay|payment|bill|invoice|receipt|wallet)/.test(v)) return 'bills';
  if (/(\btests?\b|lab|laboratory|blood test|scan|x-?ray|radiology|imaging|medicine|medication|pharmacy|prescription)/.test(v)) return 'tests';
  if (/(specialist|dermatologist|cardiologist|gyn|pediatric|paediatric|orthop|\bent\b|eye doctor)/.test(v)) return 'specialist';
  if (/(genotype|blood group)/.test(v)) return 'know-numbers';
  if (/(point|badge|level|quiz|streak|reward)/.test(v)) return 'points';
  if (/(well|check|healthy)/.test(v)) return 'stay-well';
  if (/(doctor|care|sick|symptom|help)/.test(v)) return 'find-care';
  if (/(hospital|record)/.test(v)) return 'hospital';
  if (/(appointment|book|visit)/.test(v)) return 'appointments';
  if (/(passport|result)/.test(v)) return 'passport';
  if (/(refer|invite|leader|network)/.test(v)) return 'network';
  return null;
}

export function builtInExtra(kind: 'tests' | 'bills' | 'specialist', pcm: boolean): GuideAnswer {
  if (kind === 'bills')
    return { title: 'Bills & payment', body: pcm ? 'Open My Hospital or Bills. Connect your hospital if needed, check the bills, then pay with the option wey show.' : 'Open My Hospital or Bills. Connect your hospital if needed, review your bills, then pay with the option shown.', route: '/me/pay-bills', action: pcm ? 'See bills' : 'View Bills' };
  if (kind === 'tests')
    return { title: 'Tests & medicines', body: pcm ? 'To request a test, scan or medicine, open Tests & Referrals, choose the item, then check the provider, price and next step. Some need prescription.' : 'To request a test, scan, or medicine, open Tests & Referrals, choose the item, then review the provider, price, and next step. Some requests need a valid prescription.', route: '/me/orders', action: pcm ? 'Open my care' : 'Open Tests & Referrals' };
  return { title: pcm ? 'Find specialist' : 'Find a specialist', body: pcm ? 'Use Find Care talk wetin dey worry you. SmartClinic go show doctor or specialist wey dey available; you fit still choose another one.' : 'Use Find Care and describe what you need. SmartClinic shows suitable available doctors or specialists, and you can still choose another provider.', route: '/me/request-care', action: pcm ? 'Find specialist' : 'Find Care' };
}

/** Speech-recognition locale for each language (browser support varies). */
export const LISTEN_LOCALE: Readonly<Record<AppLanguage, string>> = {
  en: 'en-NG', pcm: 'en-NG', yo: 'yo-NG', ha: 'ha-NG', ig: 'ig-NG', rw: 'rw-RW', fr: 'fr-FR', sw: 'sw-KE', tw: 'ak-GH',
};

/** Browser voices are only used as a last resort, and only the natural-sounding ones. */
export const BROWSER_VOICE_LOCALE: Partial<Record<AppLanguage, string>> = { en: 'en', pcm: 'en-NG', fr: 'fr', sw: 'sw' };
