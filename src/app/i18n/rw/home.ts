import type { Dictionary } from '../types';

/** home screens — rw. */
const home: Dictionary = {
  // Hero
  'home.hero.eyebrow': 'Inshuti yawe y’ubuzima',
  'home.hero.titleStart': 'Gira ubuzima bwiza. Bona ubuvuzi.',
  'home.hero.titleHighlight': 'Bika amakuru y’ubuzima bwawe',
  'home.hero.titleEnd': 'hamwe.',
  'home.hero.intro':
    'SmartClinic iri kumwe nawe buri munsi — utuntu duto tugufasha kugira ubuzima bwiza, n’inshuti wizera igihe ukeneye muganga, ikizamini, imiti cyangwa ibitaro.',
  'home.hero.openMySmartClinic': 'Fungura My SmartClinic',
  'home.hero.bookHealthCheck': 'Saba Smart Health Check',
  'home.hero.whyLabel': 'Impamvu abarwayi bahitamo SmartClinic',
  'home.hero.clearPricing': 'Ibiciro bigaragara',
  'home.hero.verifiedProviders': 'Abavuzi bagenzuwe',
  'home.hero.careNearYou': 'Ubuvuzi hafi yawe',
  'home.hero.photoAlt': 'Dr Valerie wa SmartClinic mu ivuriro rye',
  'home.hero.photoCaption': 'Azana impinduka mu buvuzi',
  'home.hero.todayLabel': 'Ibyo gukora uyu munsi: nywa ikirahure cy’amazi, genda n’amaguru iminota 20. Fungura My SmartClinic',
  'home.hero.today': 'Uyu munsi',
  'home.hero.drinkWater': 'Nywa ikirahure cy’amazi',
  'home.hero.walk': 'Genda iminota 20',
  'home.hero.passportText': 'Amakuru yawe, abonwa gusa igihe ubyemeye.',
  // Everyday actions
  'home.actions.title': 'Ukeneye iki uyu munsi?',
  'home.actions.subtitle': 'Ubuvuzi bworoshye. Hitamo kimwe, SmartClinic iragufasha.',
  'home.actions.navLabel': 'Serivisi z’ubuzima',
  'home.actions.bookCheckup': 'Saba isuzuma',
  'home.actions.seeDoctor': 'Bonana na muganga',
  'home.actions.visitHospital': 'Jya ku bitaro',
  'home.actions.getMedicine': 'Bona imiti',
  'home.actions.getTest': 'Kora ikizamini',
  'home.actions.payBill': 'Ishyura',
  'home.actions.comingSoon': 'Biraza vuba',
  // Companion
  'home.companion.eyebrow': 'Inshuti imwe, mu bihe byose by’ubuzima',
  'home.companion.title': 'Ubuvuzi bugendana nawe.',
  'home.companion.intro':
    'Umurwayi umwe. Urugendo rumwe rw’ubuzima. Gahunda kwa muganga, impapuro z’imiti, ibizamini n’amakuru biguma hamwe kuri wowe — atari mu mpapuro nyinshi.',
  'home.companion.stayWellTitle': 'Gira ubuzima bwiza',
  'home.companion.stayWellText':
    'Ibikorwa bya buri munsi: amazi, imyitozo, kuruhuka n’imiti. Guided Self-Checks na Smart Health Checks kugira ngo umenye hakiri kare.',
  'home.companion.getCareTitle': 'Bona ubuvuzi',
  'home.companion.getCareText':
    'Bonana na muganga, kora ibizamini, bona imiti, kandi ukoreshe SmartClinic nk’inshuti yawe mu bitaro bikorana natwe.',
  'home.companion.storyTitle': 'Bika amateka yawe',
  'home.companion.storyText':
    'Smart Health Passport yawe ibika amakuru, ibisubizo by’ibizamini n’impapuro z’imiti hamwe — kandi ni wowe uhitamo uzabibona.',
  // Portal
  'home.portal.photoAlt': 'Abagize itsinda rya SmartClinic',
  'home.portal.title': 'Ubuvuzi bwawe bwose, ahantu hamwe.',
  'home.portal.text':
    'Gahunda kwa muganga, ibisubizo, impapuro z’imiti, ibitaro na Smart Health Passport yawe — hamwe n’umuyobozi mwiza igihe cyose ukeneye ubufasha.',
  'home.portal.appointments': 'Gahunda kwa muganga',
  'home.portal.resultsRecords': 'Ibisubizo n’amakuru',
  'home.portal.prescriptions': 'Impapuro z’imiti',
  'home.portal.team': 'Itsinda rya SmartClinic',
  'home.portal.teamCaption': 'Turi hano kukuyobora',
  // Healthy Families
  'home.families.eyebrow': 'Imiryango ifite ubuzima bwiza',
  'home.families.title': 'Ubuzima bukurana n’umuryango wawe.',
  'home.families.text':
    'Ongeraho abana bawe n’abo ukunda kuri konti imwe ya SmartClinic, bika isuzuma n’amakuru yabo hamwe, kandi winjire muri gahunda z’ishuri, z’umukoresha n’iz’umuryango igihe utumiwe.',
  'home.families.cta': 'Reba Imiryango ifite ubuzima bwiza',
  'home.families.childAlt': 'Umwana umwenyura',
  'home.families.girlAlt': 'Umukobwa muto wishimira impano',
  // WhatsApp
  'home.whatsapp.continue': 'Komeza kuri WhatsApp',
  'home.whatsapp.text': 'Ukeneye ubufasha? Komeza na SmartClinic kuri WhatsApp.',
  // Smart Health Checks
  'home.services.eyebrow': 'Shora imari muri wowe',
  'home.services.intro':
    'Dushora imari mu bintu dukoresha buri munsi. Isuzuma ryoroheje ni kimwe mu bintu by’ingenzi wakwikorera — hitamo rimwe tugufashe gutegura aho n’igihe.',
  'home.services.loading': 'Turimo gushaka Health Checks zihari…',
  'home.services.error': 'Health Checks ntiziboneka muri iki gihe.',
  'home.services.retry': 'Ongera ugerageze',
  'home.services.empty':
    'Nta Health Check ihari ubu. Inshya zizagaragara hano igihe abavuzi bazishyizeho.',
  'home.services.startSelfCheck': 'Tangira na Guided Self-Check',
  'home.services.from': 'Guhera kuri',
  'home.services.priceAfterProvider': 'Igiciro kigaragara umaze guhitamo umuvuzi',
  'home.services.startCheck': 'Tangira Health Check yanjye',
  'home.services.seeAll': 'Reba Health Checks zose',
  // How it works
  'home.how.eyebrow': 'Biroroshye',
  'home.how.title': 'Ubuvuzi butagusiragiza.',
  'home.how.step1Title': 'Tubwire icyo ukeneye',
  'home.how.step1Text': 'Hitamo serivisi y’ubuzima — cyangwa utangire na Guided Self-Check.',
  'home.how.step2Title': 'Reba amahitamo yawe',
  'home.how.step2Text': 'Bona ubuvuzi bukubereye, abavuzi bagenzuwe n’ibiciro bigaragara.',
  'home.how.step3Title': 'SmartClinic iguma nawe',
  'home.how.step3Text':
    'Gahunda kwa muganga, ibizamini, imiti n’amakuru biguma hamwe — kandi ugaruka buri munsi kugira ngo ugire ubuzima bwiza.',
  // Impact
  'home.impact.eyebrow': 'Uruhare rw’abaturage',
  'home.impact.title': 'Ubuvuzi bukura iyo abaturage bafatanyije.',
  'home.impact.text': 'Menya uko abantu n’abaturage bafasha abarwayi benshi kubona ubuvuzi.',
  'home.impact.cta': 'Reba uruhare',
  // Providers
  'home.providers.eyebrow': 'Ku bavuzi',
  'home.providers.title': 'Zana serivisi zawe kuri SmartClinic.',
  'home.providers.join': 'Injira mu rusobe',
  'home.providers.signIn': 'Kwinjira k’umuvuzi',
  // FAQ
  'home.faq.title': 'Ibibazo n’ubufasha',
  'home.faq.intro': 'Ibisubizo bigufasha mbere yo gukomeza.',
  'home.faq.whatIsQuestion': 'SmartClinic ni iki?',
  'home.faq.whatIsAnswer':
    'SmartClinic ni inshuti yawe y’ubuzima. Igufasha kugira ubuzima bwiza buri munsi, kubona ubuvuzi igihe ubukeneye, guhura n’abavuzi bakorana natwe no kubika amakuru y’ubuzima bwawe hamwe.',
  'home.faq.healthChecksQuestion': 'Health Checks zikora gute?',
  'home.faq.healthChecksAnswer':
    'Hitamo ipaki ihari, reba abavuzi n’uburyo bwo kuguha serivisi, hanyuma wemeze gahunda yawe ku giciro cyatanzwe ubu.',
  'home.faq.fromHomeQuestion': 'Nshobora gukoresha SmartClinic ndi mu rugo?',
  'home.faq.fromHomeAnswer':
    'Ushobora gutangira na Guided Self-Check uri mu rugo. Gusurwa mu rugo nabyo bigaragara iyo umuvuzi wahisemo abikora.',
  'home.faq.providersQuestion': 'Abavuzi batoranywa gute?',
  'home.faq.providersAnswer':
    'Abavuzi basaba kwinjira muri SmartClinic Network, bakagenzurwa mbere y’uko serivisi zabo zigaragara hano.',
  'home.faq.accessQuestion': 'Ninjira nte muri My SmartClinic?',
  'home.faq.accessAnswer':
    'Kanda Fungura My SmartClinic winjire ukoresheje imeyili cyangwa nimero ya telefoni ihuye na konti yawe.',
  'home.faq.helpQuestion': 'Nabona nte ubufasha?',
  'home.faq.helpAnswer':
    'Injira urebe ubuvuzi uhabwa ubu. Ubufasha bwa WhatsApp buzagaragara hano igihe nimero yemewe y’ubufasha izaba yashyizweho.',
};

export default home;
