import type { Dictionary } from '../types';

/** Play — yo. */
const play: Dictionary = {
  'play.loading': 'Ó ń gbé jáde…',
  'play.error': 'Ohun kan ṣẹlẹ̀ tí kò dára. Ẹ jọ̀wọ́ ẹ tún gbìyànjú.',
  'play.points': 'àmì',

  // Page
  'play.page.eyebrow': 'Eré',
  'play.page.title': 'Ẹ ṣeré, ẹ sì pe àwọn ọ̀rẹ́ yín níjà',
  'play.page.intro': 'Ọ̀rọ̀ ìlera kan lójoojúmọ́, àti àwọn ìpèníjà ọlọ́rẹ̀ẹ́ tó ń jẹ́ kí ẹ̀yin àti àwọn ọ̀rẹ́ yín máa lo ara.',
  'play.page.fairPlay': 'Eré òdodo: àmì yín ń wá láti inú àwọn ohun ìlera tí ẹ bá ṣe nínú SmartClinic nìkan, ẹ̀ẹ̀kan lójúmọ́ fún ọ̀kọ̀ọ̀kan. Kò sí ẹni tó ń rí àlàyé ìlera yín.',

  // Dashboard tile
  'play.tile.title': 'Health Word òní',
  'play.tile.body': 'Ẹ dá ọ̀rọ̀ náà mọ̀ ní ìgbìyànjú mẹ́fà, lẹ́yìn náà ẹ pe ọ̀rẹ́ kan níjà.',
  'play.tile.cta': 'Ṣeré',

  // Health Word
  'play.word.eyebrow': 'Ìdánwò ojoojúmọ́',
  'play.word.title': 'Health Word #{n}',
  'play.word.hint': 'Àmọ̀ràn: ó jẹ mọ́ {category}',
  'play.word.rules': 'Ẹ dá ọ̀rọ̀ ìlera tó ní lẹ́tà márùn-ún ní èdè Gẹ̀ẹ́sì (English) mọ̀ ní ìgbìyànjú {tries}. Àkókò yóò bẹ̀rẹ̀ nígbà tí ẹ bá tẹ Ṣeré.',
  'play.word.legend': 'Àwọ̀ ewé: lẹ́tà tó tọ́, ibi tó tọ́. Àwọ̀ ofeefee: wà nínú ọ̀rọ̀ náà, ṣùgbọ́n kì í ṣe ibẹ̀. Àwọ̀ eérú: kò sí nínú ọ̀rọ̀ náà.',
  'play.word.start': 'Ṣeré',
  'play.word.boardLabel': 'Àwọn ìgbìyànjú yín',
  'play.word.keyboard': 'Bọ́tìnnì lẹ́tà',
  'play.word.enter': 'Fi ránṣẹ́',
  'play.word.delete': 'Pa lẹ́tà rẹ́',
  'play.word.timeLabel': 'Àkókò: {time}',
  'play.word.tooShort': 'Ẹ tẹ lẹ́tà {n}',
  'play.word.feedback': '{hit} ní ibi tó tọ́, {near} wà nínú ọ̀rọ̀ náà',
  'play.word.solved': 'Ẹ yanjú rẹ̀: {tries}/6 ní {time}!',
  'play.word.solvedShort': 'Ẹ yanjú rẹ̀!',
  'play.word.notSolved': 'Kì í ṣe lọ́tẹ̀ yìí. Ọ̀rọ̀ náà ni {word}.',
  'play.word.answerWas': 'Ọ̀rọ̀ náà ni {word}.',
  'play.word.shareAsk': 'Ẹ pín èsì yín, kí ẹ sì wò ó bóyá àwọn ọ̀rẹ́ yín lè borí rẹ̀:',
  'play.word.tomorrow': 'Health Word tuntun ń bọ̀ ní ọ̀la.',

  // How to play
  'play.how.title': 'Bí a ṣe ń ṣeré',
  'play.how.step1': 'Ẹ dá ọ̀rọ̀ ìlera òní tó ní lẹ́tà márùn-ún mọ̀. Ẹ ní ìgbìyànjú {tries}.',
  'play.how.step2': 'Ẹ tẹ ọ̀rọ̀ oní lẹ́tà márùn-ún, kí ẹ sì tẹ Fi ránṣẹ́.',
  'play.how.step3': 'Àwọn àwọ̀ náà fi bí ẹ ti sún mọ́ tó hàn. Ẹ lò wọ́n fún ìgbìyànjú tó kàn.',
  'play.how.examples': 'Àpẹẹrẹ',
  'play.how.exHit': 'Àwọ̀ ewé: {letter} wà nínú ọ̀rọ̀ náà, ní ibi tó tọ́.',
  'play.how.exNear': 'Àwọ̀ ofeefee: {letter} wà nínú ọ̀rọ̀ náà, ṣùgbọ́n ní ibòmíràn.',
  'play.how.exMiss': 'Àwọ̀ eérú: {letter} kò sí nínú ọ̀rọ̀ náà.',
  'play.how.clock': 'Àkókò bẹ̀rẹ̀ nígbà tí ẹ bá tẹ Ṣeré. Bí ẹ bá yára, ó dára jù nínú àwọn ìpèníjà.',
  'play.how.daily': 'Ọ̀rọ̀ tuntun kan lójoojúmọ́, bákan náà fún gbogbo ènìyàn. Ẹ pín èsì yín, kí ẹ sì fi wé ti àwọn ẹlòmíràn.',
  'play.how.english': 'Ọ̀rọ̀ náà máa ń jẹ́ èdè Gẹ̀ẹ́sì nígbà gbogbo. Àmọ̀ràn yóò sọ ohun tó jẹ mọ́ fún yín.',
  'play.how.points': 'Ẹ parí rẹ̀, kí ẹ gba àmì márùn-ún; ẹ yanjú rẹ̀, kí ẹ gba márùn-ún sí i.',
  'play.how.gotIt': 'Ó yé mi',

  'play.category.body': 'ara',
  'play.category.food': 'oúnjẹ àti ohun mímu',
  'play.category.move': 'lílo ara',
  'play.category.care': 'ìtọ́jú ìlera',
  'play.category.mind': 'ọkàn àti ìmọ̀lára',

  'play.mark.hit': 'ibi tó tọ́',
  'play.mark.near': 'wà nínú ọ̀rọ̀ náà, ibi tí kò tọ́',
  'play.mark.miss': 'kò sí nínú ọ̀rọ̀ náà',

  'play.stats.played': 'Tí a ti ṣeré',
  'play.stats.solved': 'Tí a ti yanjú',
  'play.stats.streak': 'Ọjọ́ ìtẹ̀léra',

  // Sharing
  'play.share.whatsapp': 'WhatsApp',
  'play.share.more': 'Pín',
  'play.share.copy': 'Ṣàdàkọ ìsopọ̀',
  'play.share.copied': 'A ti ṣàdàkọ ✓',
  'play.share.wordLine': 'SmartClinic Health Word #{n} {score} ⏱ {time}',
  'play.share.wordInvite': 'Ṣé ẹ lè borí mi? Ẹ ṣeré lọ́fẹ̀ẹ́:',
  'play.share.duel': 'Mo pè yín níjà! {theme}, ọjọ́ {days} lórí SmartClinic. Ẹ darapọ̀ mọ́ mi kí a rí ẹni tó borí:',
  'play.share.group': 'Ẹ darapọ̀ mọ́ ìpèníjà ìlera ọjọ́ {days} mi lórí SmartClinic: {theme}. Ẹ jẹ́ kí a máa gba ara wa níyànjú:',

  // Challenges
  'play.challenges.title': 'Àwọn ìpèníjà',
  'play.challenges.intro': 'Ẹ pe ọ̀rẹ́ kan níjà tàbí ẹgbẹ́ kan lódindi. Ẹni tó bá ṣe àwọn ohun ìlera jù ló borí.',
  'play.challenges.none': 'Kò tíì sí ìpèníjà kankan. Ẹ bẹ̀rẹ̀ ọ̀kan, kí ẹ sì fi ránṣẹ́ sí ọ̀rẹ́ kan tàbí ẹgbẹ́ WhatsApp yín.',
  'play.challenges.start': 'Bẹ̀rẹ̀ ìpèníjà',

  'play.theme.ALL_ROUND': 'Gbogbo nǹkan',
  'play.theme.WORD': 'Ìjà Health Word',
  'play.theme.QUIZ': 'Àwọn akọni ìbéèrè',
  'play.theme.ACTIVE_DAYS': 'Ọjọ́ ìkópa',
  'play.themeHint.ALL_ROUND': 'Gbogbo nǹkan ní iye',
  'play.themeHint.WORD': 'Ìgbìyànjú tó kéré jù, àkókò tó yára jù',
  'play.themeHint.QUIZ': 'Ìbéèrè ojoojúmọ́',
  'play.themeHint.ACTIVE_DAYS': 'Sísọ bí ara yín ṣe rí àti àwọn iṣẹ́ ojoojúmọ́',
  'play.rules.ALL_ROUND': 'Ní ọjọ́ kọ̀ọ̀kan: 10 fún sísọ bí ara yín ṣe rí tàbí iṣẹ́ ojoojúmọ́, 5 fún ìbéèrè ojoojúmọ́ àti 5 sí i tí ẹ bá dáhùn dáadáa, 5 fún Health Word àti 5 sí i tí ẹ bá yanjú rẹ̀.',
  'play.rules.WORD': 'Ní ọjọ́ kọ̀ọ̀kan: ẹ yanjú Health Word fún 10, pẹ̀lú 2 fún ìgbìyànjú kọ̀ọ̀kan tó ṣẹ́kù. Ṣíṣeré láì yanjú ń fún yín ní 2. Tí àmì bá dọ́gba, ẹni tó yára jù ló borí.',
  'play.rules.QUIZ': 'Ní ọjọ́ kọ̀ọ̀kan: 5 fún dídáhùn ìbéèrè ojoojúmọ́ àti 10 sí i tí ẹ bá dáhùn dáadáa.',
  'play.rules.ACTIVE_DAYS': 'Ní ọjọ́ kọ̀ọ̀kan: 5 fún sísọ bí ara yín ṣe rí àti 5 fún ṣíṣe iṣẹ́ ojoojúmọ́ kan.',

  'play.mode.duel': 'Ẹni kan sí ẹni kan',
  'play.mode.group': 'Ẹgbẹ́ (tí kò ju 30 lọ)',
  'play.mode.duelShort': '1 sí 1',
  'play.mode.groupShort': 'Ẹgbẹ́',

  'play.form.what': 'Kí ni ẹ máa díje lé lórí?',
  'play.form.who': 'Ta ni ẹ ń pè níjà?',
  'play.form.howLong': 'Fún ìgbà wo?',
  'play.form.days': 'Ọjọ́ {n}',
  'play.form.tomorrow': 'Ẹ bẹ̀rẹ̀ ní ọ̀la dípò òní',
  'play.form.privacy': 'Àwọn ọ̀rẹ́ yín ń rí orúkọ yín àkọ́kọ́, lẹ́tà kan, àmì yín àti àwọn ọjọ́ ìkópa yín. Wọn kì í rí àlàyé ìlera yín.',
  'play.form.create': 'Ṣẹ̀dá kí ẹ sì pè wọ́n',
  'play.form.cancel': 'Fagilé',

  'play.status.upcoming': 'Yóò bẹ̀rẹ̀ {date}',
  'play.status.daysLeft': 'Ọjọ́ {n} ló ṣẹ́kù',
  'play.status.lastDay': 'Ọjọ́ ìkẹyìn!',
  'play.status.ended': 'Ó ti parí',
  'play.status.doneToday': 'a ti ṣe é lónìí ✓',

  // One challenge
  'play.challenge.back': 'Ṣeré',
  'play.challenge.by': '{name} ló bẹ̀rẹ̀ rẹ̀',
  'play.challenge.players': '{n} nínú {max} olùṣeré',
  'play.challenge.board': 'Àtòjọ ipò',
  'play.challenge.final': 'Èsì ìkẹyìn',
  'play.challenge.scoreNow': 'Àmì òní',
  'play.challenge.waiting': 'À ń dúró de àwọn ọ̀rẹ́ láti darapọ̀. Ẹ fi ìpè ránṣẹ́!',
  'play.challenge.howScored': 'Bí a ṣe ń ka àmì',
  'play.challenge.again': 'Bẹ̀rẹ̀ ìpèníjà mìíràn',
  'play.challenge.leave': 'Kúrò nínú ìpèníjà yìí',
  'play.challenge.leaveConfirm': 'Ẹ fẹ́ kúrò nínú ìpèníjà yìí? A ó yọ àmì yín kúrò nínú àtòjọ.',
  'play.challenge.notFound': 'A kò rí ìpèníjà yẹn. Ẹ yẹ ìsopọ̀ náà wò.',

  'play.invite.titleDuel': 'Ẹ pe alátakò yín',
  'play.invite.titleGroup': 'Ẹ pe àwọn ọ̀rẹ́ yín',
  'play.invite.body': 'Ẹ fi ìsopọ̀ náà ránṣẹ́ lórí WhatsApp, nípa ìfiránṣẹ́ kúkúrú, tàbí sí ẹgbẹ́ èyíkéyìí. Àwọn ọ̀rẹ́ tí kò tíì lo SmartClinic lè darapọ̀ lọ́fẹ̀ẹ́.',

  'play.join.title': '{name} pè yín níjà!',
  'play.join.cta': 'Gba ìpèníjà náà',
  'play.join.full': 'Ìpèníjà yìí ti kún tán.',
  'play.join.ended': 'Ìpèníjà yìí ti parí.',

  'play.board.place': 'Ipò {n}',
  'play.board.you': 'ẹ̀yin',
  'play.board.activeDays': 'Ọjọ́ ìkópa: {n}',
  'play.board.today': 'lónìí',

  // Friends this week
  'play.week.title': 'Ọ̀sẹ̀ yìí pẹ̀lú àwọn ọ̀rẹ́',
  'play.week.intro': 'Ẹ̀yin àti gbogbo ẹni tí ẹ ti pè níjà. Ó ń bẹ̀rẹ̀ lẹ́ẹ̀kan sí i ní ọjọ́ Ajé kọ̀ọ̀kan.',
  'play.week.noFriends': 'Ẹ bẹ̀rẹ̀ ìpèníjà kan kí ẹ lè rí àwọn ọ̀rẹ́ yín níbí.',

  // Shared-link landing (before sign-in)
  'play.landing.eyebrow': 'SmartClinic',
  'play.landing.challengeTitle': '{name} pè yín níjà!',
  'play.landing.challengeBody': '{theme}, fún ọjọ́ {days}. Ẹ ṣe àwọn ohun ìlera kékeré lójoojúmọ́, kí ẹ sì wò ó ta ni yóò borí.',
  'play.landing.wordTitle': 'Ṣé ẹ lè dá Health Word òní mọ̀?',
  'play.landing.wordBody': 'Ọ̀rọ̀ ìlera kan lójúmọ́, ní èdè Gẹ̀ẹ́sì (English), tó ní lẹ́tà márùn-ún, ìgbìyànjú mẹ́fà. Ẹ kọ́ nǹkan tuntun, ẹ jèrè àmì, kí ẹ sì borí àwọn ọ̀rẹ́ yín.',
  'play.landing.join': 'Darapọ̀ lọ́fẹ̀ẹ́, kí ẹ ṣeré',
  'play.landing.signIn': 'Mo ti ní àkọọ́lẹ̀',
  'play.landing.open': 'Ṣí ìpèníjà náà',
  'play.landing.play': 'Ṣeré báyìí',
  'play.landing.free': 'Ọ̀fẹ́ ni láti darapọ̀. Àmì tí ẹ bá jèrè lè wúlò fún Health Check.',
};

export default play;
