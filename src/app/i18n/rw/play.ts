import type { Dictionary } from '../types';

/** Play — rw. */
const play: Dictionary = {
  'play.loading': 'Biraje…',
  'play.error': 'Hari ikitagenze neza. Ongera ugerageze.',
  'play.points': 'amanota',

  // Page
  'play.page.eyebrow': 'Gukina',
  'play.page.title': 'Kina ushishikarize inshuti',
  'play.page.intro': 'Ijambo rimwe ry’ubuzima buri munsi, n’amarushanwa y’urukundo atuma wowe n’inshuti zawe mukomeza gukora.',
  'play.page.fairPlay': 'Gukina neza: amanota aturuka gusa ku bintu byiza ku buzima ukora muri SmartClinic, rimwe ku munsi kuri buri kimwe. Nta muntu urebwa amakuru yawe y’ubuzima.',

  // Dashboard tile
  'play.tile.title': 'Health Word y’uyu munsi',
  'play.tile.body': 'Gerageza kuvumbura ijambo mu nshuro esheshatu, hanyuma ushishikarize inshuti.',
  'play.tile.cta': 'Kina',

  // Health Word
  'play.word.eyebrow': 'Umukino wa buri munsi',
  'play.word.title': 'Health Word #{n}',
  'play.word.hint': 'Inama: rishingiye kuri {category}',
  'play.word.rules': 'Vumbura ijambo ry’ubuzima mu Cyongereza, rigizwe n’inyuguti eshanu, mu nshuro {tries}. Igihe gitangira ukanze Kina.',
  'play.word.legend': 'Icyatsi: inyuguti ikwiye, mu mwanya ukwiye. Umuhondo: iri mu ijambo, ariko ntiri mu mwanya wayo. Ibara ry’ivu: ntiri mu ijambo.',
  'play.word.start': 'Kina',
  'play.word.boardLabel': 'Ibyo wagerageje',
  'play.word.keyboard': 'Ikibaho cy’inyuguti',
  'play.word.enter': 'Emeza',
  'play.word.delete': 'Siba inyuguti',
  'play.word.timeLabel': 'Igihe: {time}',
  'play.word.tooShort': 'Andika inyuguti {n}',
  'play.word.feedback': '{hit} ziri mu mwanya ukwiye, {near} ziri mu ijambo',
  'play.word.solved': 'Warivumbuye mu nshuro {tries}, {time}!',
  'play.word.solvedShort': 'Warivumbuye!',
  'play.word.notSolved': 'Si ubu. Ijambo ryari {word}.',
  'play.word.answerWas': 'Ijambo ryari {word}.',
  'play.word.shareAsk': 'Sangiza abandi ibyavuye mu mukino urebe ko inshuti zawe zakurusha:',
  'play.word.tomorrow': 'Health Word nshya iraza ejo.',

  'play.category.body': 'umubiri',
  'play.category.food': 'ibiryo n’ibinyobwa',
  'play.category.move': 'kunyeganyeza umubiri',
  'play.category.care': 'kwita ku buzima bwawe',
  'play.category.mind': 'ubwenge n’imitekerereze',

  'play.mark.hit': 'mu mwanya ukwiye',
  'play.mark.near': 'riri mu ijambo, ariko ntiri mu mwanya wayo',
  'play.mark.miss': 'ntiri mu ijambo',

  'play.stats.played': 'Wakinnye',
  'play.stats.solved': 'Warivumbuye',
  'play.stats.streak': 'Ikurikiranya',

  // Sharing
  'play.share.whatsapp': 'WhatsApp',
  'play.share.more': 'Sangiza',
  'play.share.copy': 'Koporora link',
  'play.share.copied': 'Byakoporowe ✓',
  'play.share.wordLine': 'SmartClinic Health Word #{n} {score} ⏱ {time}',
  'play.share.wordInvite': 'Wankurusha? Kina ku buntu:',
  'play.share.duel': 'Ndagutumiye mu irushanwa! {theme}, iminsi {days} kuri SmartClinic. Dufatanye turebe uzatsinda:',
  'play.share.group': 'Injira mu irushanwa ryanjye ry’ubuzima ry’iminsi {days} kuri SmartClinic: {theme}. Dushishikarizanye:',

  // Challenges
  'play.challenges.title': 'Amarushanwa',
  'play.challenges.intro': 'Tumira inshuti imwe cyangwa itsinda ryose mu irushanwa. Ukora ibintu byiza ku buzima byinshi aratsinda.',
  'play.challenges.none': 'Nta marushanwa arabaho. Tangiza irushanwa urohereze inshuti cyangwa itsinda ryawe rya WhatsApp.',
  'play.challenges.start': 'Tangiza irushanwa',

  'play.theme.ALL_ROUND': 'Byose',
  'play.theme.WORD': 'Irushanwa rya Health Word',
  'play.theme.QUIZ': 'Intwari z’ibibazo',
  'play.theme.ACTIVE_DAYS': 'Iminsi y’imyitozo',
  'play.themeHint.ALL_ROUND': 'Byose bibarwa',
  'play.themeHint.WORD': 'Inshuro nke, igihe gito',
  'play.themeHint.QUIZ': 'Ikibazo cya buri munsi',
  'play.themeHint.ACTIVE_DAYS': 'Isuzuma n’imirimo ya buri munsi',
  'play.rules.ALL_ROUND': 'Buri munsi: 10 ku isuzuma cyangwa umurimo wa buri munsi, 5 ku kibazo cy’umunsi na 5 bundi iyo wacyishuye neza, 5 kuri Health Word na 5 bundi iyo warivumbuye.',
  'play.rules.WORD': 'Buri munsi: kuvumbura Health Word bikuhesha 10, wongereweho 2 kuri buri nshuro isigaye. Gukina utarivumbuye bihesha 2. Iyo mungana, utwara igihe gito aratsinda.',
  'play.rules.QUIZ': 'Buri munsi: 5 ku gusubiza ikibazo cy’umunsi na 10 bundi iyo wacyishuye neza.',
  'play.rules.ACTIVE_DAYS': 'Buri munsi: 5 ku isuzuma ryawe na 5 ku kuranga umurimo wa buri munsi wakoze.',

  'play.mode.duel': 'Umwe ku wundi',
  'play.mode.group': 'Itsinda (kugeza ku bantu 30)',
  'play.mode.duelShort': '1 ku 1',
  'play.mode.groupShort': 'Itsinda',

  'play.form.what': 'Murushanwa ku ki?',
  'play.form.who': 'Urashaka guhatana na nde?',
  'play.form.howLong': 'Igihe kingana iki?',
  'play.form.days': 'Iminsi {n}',
  'play.form.tomorrow': 'Tangira ejo aho gutangira uyu munsi',
  'play.form.privacy': 'Inshuti zibona izina ryawe rya mbere, inyuguti imwe, amanota yawe n’iminsi wakoze. Ntizibona amakuru yawe y’ubuzima.',
  'play.form.create': 'Tangiza utumire',
  'play.form.cancel': 'Bireke',

  'play.status.upcoming': 'Itangira {date}',
  'play.status.daysLeft': 'Hasigaye iminsi {n}',
  'play.status.lastDay': 'Umunsi wa nyuma!',
  'play.status.ended': 'Ryarangiye',
  'play.status.doneToday': 'byakozwe uyu munsi ✓',

  // One challenge
  'play.challenge.back': 'Kina',
  'play.challenge.by': 'Ryatangijwe na {name}',
  'play.challenge.players': 'Abakinnyi {n} kuri {max}',
  'play.challenge.board': 'Urutonde',
  'play.challenge.final': 'Ibyavuye mu irushanwa',
  'play.challenge.scoreNow': 'Amanota y’uyu munsi',
  'play.challenge.waiting': 'Dutegereje ko inshuti zinjira. Ohereza ubutumire!',
  'play.challenge.howScored': 'Uko amanota abarwa',
  'play.challenge.again': 'Tangiza irindi rushanwa',
  'play.challenge.leave': 'Va muri iri rushanwa',
  'play.challenge.leaveConfirm': 'Uvuye muri iri rushanwa? Amanota yawe azakurwa ku rutonde.',
  'play.challenge.notFound': 'Ntitwabonye iryo rushanwa. Ongera urebe link.',

  'play.invite.titleDuel': 'Tumira uwo muhatanye',
  'play.invite.titleGroup': 'Tumira inshuti zawe',
  'play.invite.body': 'Ohereza link kuri WhatsApp, mu butumwa bugufi, cyangwa mu itsinda iryo ariryo ryose. Inshuti nshya kuri SmartClinic zijyamo ku buntu.',

  'play.join.title': '{name} yagutumiye mu irushanwa!',
  'play.join.cta': 'Emera irushanwa',
  'play.join.full': 'Iri rushanwa ryamaze kuzura.',
  'play.join.ended': 'Iri rushanwa ryarangiye.',

  'play.board.place': 'Umwanya wa {n}',
  'play.board.you': 'wowe',
  'play.board.activeDays': 'Iminsi {n} yakozwe',
  'play.board.today': 'uyu munsi',

  // Friends this week
  'play.week.title': 'Iki cyumweru n’inshuti',
  'play.week.intro': 'Wowe na bose watumiye mu marushanwa. Bitangira bundi bushya buri wa mbere.',
  'play.week.noFriends': 'Tangiza irushanwa ubone inshuti zawe hano.',

  // Shared-link landing (before sign-in)
  'play.landing.eyebrow': 'SmartClinic',
  'play.landing.challengeTitle': '{name} yagutumiye mu irushanwa!',
  'play.landing.challengeBody': '{theme}, mu minsi {days}. Kora utuntu twiza ku buzima buri munsi urebe uzatsinda.',
  'play.landing.wordTitle': 'Wavumbura Health Word y’uyu munsi?',
  'play.landing.wordBody': 'Ijambo rimwe ry’ubuzima mu Cyongereza, rigizwe n’inyuguti eshanu, buri munsi, mu nshuro esheshatu. Wiga ikintu gishya, ugakusanya amanota, ugatsinda inshuti zawe.',
  'play.landing.join': 'Injira ku buntu ukine',
  'play.landing.signIn': 'Mfite konti',
  'play.landing.open': 'Fungura irushanwa',
  'play.landing.play': 'Kina nonaha',
  'play.landing.free': 'Kwinjira ni ubuntu. Amanota ukuye ashobora gufasha kubona Health Check.',
};

export default play;
