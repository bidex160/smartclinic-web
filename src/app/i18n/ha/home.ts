import type { Dictionary } from '../types';

/** home screens — ha. */
const home: Dictionary = {
  // Hero
  'home.hero.eyebrow': 'Abokin lafiyarku na kanku',
  'home.hero.titleStart': 'Ku zauna lafiya. Ku sami kulawa.',
  'home.hero.titleHighlight': 'Ku ajiye labarin lafiyarku',
  'home.hero.titleEnd': 'a wuri ɗaya.',
  'home.hero.intro':
    'SmartClinic tana tare da ku kowace rana — ƙananan ɗabi’u da ke kiyaye lafiyarku, da aboki amintacce idan kuna buƙatar likita, gwaji, magani ko asibiti.',
  'home.hero.openMySmartClinic': 'Buɗe My SmartClinic',
  'home.hero.bookHealthCheck': 'Yi rajistar Smart Health Check',
  'home.hero.whyLabel': 'Dalilin da marasa lafiya ke zaɓar SmartClinic',
  'home.hero.clearPricing': 'Farashi a fili',
  'home.hero.verifiedProviders': 'Masu kula da aka tantance',
  'home.hero.careNearYou': 'Kulawa kusa da ku',
  'home.hero.photoAlt': 'Dr Valerie ta SmartClinic a asibitinta',
  'home.hero.photoCaption': 'Tana kawo canji a harkar lafiya',
  'home.hero.todayLabel': 'Abubuwan yau: sha kofin ruwa ɗaya, yi tafiya na minti 20. Buɗe My SmartClinic',
  'home.hero.today': 'Yau',
  'home.hero.drinkWater': 'Sha kofin ruwa ɗaya',
  'home.hero.walk': 'Tafiya na minti 20',
  'home.hero.passportText': 'Bayanan lafiyarku — sai kun yarda ne wani zai gani.',
  // Everyday actions
  'home.actions.title': 'Me kuke buƙata yau?',
  'home.actions.subtitle': 'Kula da lafiya cikin sauƙi. Ku zaɓi ɗaya, SmartClinic za ta jagorance ku.',
  'home.actions.navLabel': 'Ayyukan lafiya',
  'home.actions.bookCheckup': 'Yi rajistar duba',
  'home.actions.seeDoctor': 'Ga likita',
  'home.actions.visitHospital': 'Je asibiti',
  'home.actions.getMedicine': 'Sami magani',
  'home.actions.getTest': 'Yi gwaji',
  'home.actions.payBill': 'Biya kuɗi',
  'home.actions.comingSoon': 'Yana zuwa nan ba da daɗewa ba',
  // Companion
  'home.companion.eyebrow': 'Aboki ɗaya, a kowane lokaci na rayuwa',
  'home.companion.title': 'Kulawar da ke tafiya tare da ku.',
  'home.companion.intro':
    'Mara lafiya ɗaya. Tafiyar lafiya ɗaya. Ganawa da likita, takardar magani, gwaje-gwaje da bayanai suna tare a gare ku — ba cikin tarin takardu ba.',
  'home.companion.stayWellTitle': 'Ku zauna lafiya',
  'home.companion.stayWellText':
    'Ɗabi’un kowace rana na shan ruwa, motsa jiki, hutu da magani. Guided Self-Checks da Smart Health Checks don ku riga ku sani.',
  'home.companion.getCareTitle': 'Ku sami kulawa',
  'home.companion.getCareText':
    'Ku ga likita, ku yi gwaji, ku sami magani, kuma ku yi amfani da SmartClinic a matsayin abokinku a cikin asibitocin da suka shiga.',
  'home.companion.storyTitle': 'Ku ajiye labarinku',
  'home.companion.storyText':
    'Smart Health Passport ɗinku yana ajiye bayanai, sakamakon gwaji da takardun magani tare — kuma ku ne ke yanke shawarar wanda zai gani.',
  // Portal
  'home.portal.photoAlt': 'Ma’aikatan SmartClinic',
  'home.portal.title': 'Duk kulawarku, a wuri ɗaya.',
  'home.portal.text':
    'Ganawa da likita, sakamako, takardun magani, asibitoci da Smart Health Passport ɗinku — tare da jagora mai kirki a duk lokacin da kuke buƙatar taimako.',
  'home.portal.appointments': 'Ganawa da likita',
  'home.portal.resultsRecords': 'Sakamako da bayanai',
  'home.portal.prescriptions': 'Takardun magani',
  'home.portal.team': 'Ƙungiyar SmartClinic',
  'home.portal.teamCaption': 'Muna nan don jagorantar ku',
  // Healthy Families
  'home.families.eyebrow': 'Iyalai masu lafiya',
  'home.families.title': 'Lafiyar da ke girma tare da iyalinku.',
  'home.families.text':
    'Ku ƙara ’ya’yanku da masoyanku a asusun SmartClinic ɗaya, ku ajiye dubawa da bayanansu tare, kuma ku shiga shirye-shiryen makaranta, wurin aiki da iyali idan an gayyace ku.',
  'home.families.cta': 'Duba Iyalai masu lafiya',
  'home.families.childAlt': 'Yaro yana murmushi',
  'home.families.girlAlt': 'Ƙaramar yarinya tana murna da kyauta',
  // WhatsApp
  'home.whatsapp.continue': 'Ci gaba a WhatsApp',
  'home.whatsapp.text': 'Kuna son taimako? Ku ci gaba da SmartClinic a WhatsApp.',
  // Smart Health Checks
  'home.services.eyebrow': 'Ku saka jari a kanku',
  'home.services.intro':
    'Muna kashe kuɗi a kan abubuwan da muke amfani da su kowace rana. Duba lafiya mai sauƙi yana ɗaya daga cikin mafi muhimmancin abin da za ku yi wa kanku — ku zaɓi ɗaya, za mu taimaka muku ku tsara wuri da lokaci.',
  'home.services.loading': 'Ana loda Health Checks da ake da su…',
  'home.services.error': 'Babu Health Checks a yanzu na ɗan lokaci.',
  'home.services.retry': 'Sake gwadawa',
  'home.services.empty':
    'Babu Health Check a yanzu. Sababbi za su bayyana a nan idan masu kula suka saka su.',
  'home.services.startSelfCheck': 'Fara da Guided Self-Check',
  'home.services.from': 'Daga',
  'home.services.priceAfterProvider': 'Za a nuna farashi bayan kun zaɓi mai kula',
  'home.services.startCheck': 'Fara Health Check ɗina',
  'home.services.seeAll': 'Duba duk Health Checks',
  // How it works
  'home.how.eyebrow': 'Mai sauƙi ne',
  'home.how.title': 'Kula da lafiya ba tare da wahala ba.',
  'home.how.step1Title': 'Ku faɗa mana abin da kuke buƙata',
  'home.how.step1Text': 'Ku zaɓi aikin lafiya — ko ku fara da Guided Self-Check.',
  'home.how.step2Title': 'Ku ga zaɓinku',
  'home.how.step2Text': 'Ku sami kulawar da ta dace, masu kula da aka tantance da farashi a fili.',
  'home.how.step3Title': 'SmartClinic tana tare da ku',
  'home.how.step3Text':
    'Ganawa, gwaji, magani da bayanai suna tare — kuma kuna dawowa kowace rana don ku zauna lafiya.',
  // Impact
  'home.impact.eyebrow': 'Tasiri a cikin al’umma',
  'home.impact.title': 'Kula da lafiya na ƙaruwa idan al’umma suka haɗu.',
  'home.impact.text': 'Ku ga yadda mutane da al’ummomi ke taimaka wa ƙarin marasa lafiya su sami kulawa.',
  'home.impact.cta': 'Duba tasiri',
  // Providers
  'home.providers.eyebrow': 'Don masu kula da lafiya',
  'home.providers.title': 'Ku kawo ayyukanku zuwa SmartClinic.',
  'home.providers.join': 'Shiga cibiyar',
  'home.providers.signIn': 'Shigar mai kula',
  // FAQ
  'home.faq.title': 'Tambayoyi da taimako',
  'home.faq.intro': 'Amsoshi masu amfani kafin ku ci gaba.',
  'home.faq.whatIsQuestion': 'Menene SmartClinic?',
  'home.faq.whatIsAnswer':
    'SmartClinic abokin lafiya ne na kanku. Tana taimaka muku ku zauna lafiya kowace rana, ku sami kulawa idan kuna buƙata, ku haɗu da masu kula da suka shiga, kuma ku ajiye bayanan lafiyarku tare.',
  'home.faq.healthChecksQuestion': 'Yaya Health Checks ke aiki?',
  'home.faq.healthChecksAnswer':
    'Ku zaɓi kunshin da ake da shi, ku duba masu kula da hanyoyin da za a yi muku, sannan ku tabbatar da rajistarku da farashin da aka faɗa yanzu.',
  'home.faq.fromHomeQuestion': 'Zan iya amfani da SmartClinic daga gida?',
  'home.faq.fromHomeAnswer':
    'Kuna iya farawa da Guided Self-Check daga gida. Ziyarar gida ma za ta bayyana idan mai kulan da kuka zaɓa yana yi.',
  'home.faq.providersQuestion': 'Yaya ake zaɓar masu kula?',
  'home.faq.providersAnswer':
    'Masu kula suna neman shiga SmartClinic Network, kuma ana tantance su kafin a nuna ayyukansu a nan.',
  'home.faq.accessQuestion': 'Yaya zan shiga My SmartClinic?',
  'home.faq.accessAnswer':
    'Ku danna Buɗe My SmartClinic don shiga da imel ko lambar waya da ke da alaƙa da asusunku.',
  'home.faq.helpQuestion': 'Yaya zan sami taimako?',
  'home.faq.helpAnswer':
    'Ku shiga don ganin kulawar da kuke samu yanzu. Taimakon WhatsApp zai bayyana a nan idan an saka lambar taimako ta gaskiya.',
};

export default home;
