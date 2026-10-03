import type { Dictionary } from '../types';

/** Play: the daily Health Word, challenges with friends, sharing. Friendly, short, never about anyone's health results. */
const play: Dictionary = {
  'play.loading': 'Inapakia…',
  'play.error': 'Kuna tatizo limetokea. Tafadhali jaribu tena.',
  'play.points': 'pointi',

  // Page
  'play.page.eyebrow': 'Cheza',
  'play.page.title': 'Cheza na uwape changamoto marafiki',
  'play.page.intro': 'Neno la afya la haraka kila siku, na changamoto za kirafiki zinazokufanya wewe na marafiki zako muendelee kusonga.',
  'play.page.fairPlay': 'Mchezo wa haki: pointi hutokana tu na mambo ya afya unayofanya kwenye SmartClinic, mara moja kwa siku kwa kila jambo. Hakuna anayeona taarifa zako za afya.',

  // Dashboard tile
  'play.tile.title': 'Health Word ya leo',
  'play.tile.body': 'Kisie neno kwa majaribio sita, kisha mpe rafiki changamoto.',
  'play.tile.cta': 'Cheza',

  // Health Word
  'play.word.eyebrow': 'Fumbo la kila siku',
  'play.word.title': 'Health Word #{n}',
  'play.word.hint': 'Kidokezo: linahusu {category}',
  'play.word.rules': 'Kisie neno la afya la herufi tano, ambalo ni neno la Kiingereza, kwa majaribio {tries}. Saa huanza kuhesabu unapobonyeza Cheza.',
  'play.word.legend': 'Kijani: herufi sahihi, mahali sahihi. Njano: ipo kwenye neno, mahali pasipo sahihi. Kijivu: haipo kwenye neno.',
  'play.word.start': 'Cheza',
  'play.word.boardLabel': 'Makisio yako',
  'play.word.keyboard': 'Kibodi',
  'play.word.enter': 'Ingiza',
  'play.word.delete': 'Futa herufi',
  'play.word.timeLabel': 'Muda: {time}',
  'play.word.tooShort': 'Andika herufi {n}',
  'play.word.feedback': '{hit} mahali sahihi, {near} zipo kwenye neno',
  'play.word.solved': 'Umelitatua: majaribio {tries}/6 kwa muda wa {time}!',
  'play.word.solvedShort': 'Umelitatua!',
  'play.word.notSolved': 'Si leo. Neno lilikuwa {word}.',
  'play.word.answerWas': 'Neno lilikuwa {word}.',
  'play.word.shareAsk': 'Shiriki matokeo yako uone kama marafiki zako wanaweza kukushinda:',
  'play.word.tomorrow': 'Health Word mpya inakuja kesho.',

  // How to play
  'play.how.title': 'Jinsi ya kucheza',
  'play.how.step1': 'Kisie Health Word ya leo yenye herufi tano. Una majaribio {tries}.',
  'play.how.step2': 'Andika neno la herufi tano kisha bonyeza Ingiza.',
  'play.how.step3': 'Rangi zinaonyesha umekaribia kiasi gani. Zitumie kwa jaribio lako lijalo.',
  'play.how.examples': 'Mifano',
  'play.how.exHit': 'Kijani: {letter} ipo kwenye neno, mahali sahihi.',
  'play.how.exNear': 'Njano: {letter} ipo kwenye neno, lakini mahali pengine.',
  'play.how.exMiss': 'Kijivu: {letter} haipo kwenye neno.',
  'play.how.clock': 'Saa huanza kuhesabu unapobonyeza Cheza. Kuwa haraka ni bora kwenye changamoto.',
  'play.how.daily': 'Neno jipya moja kila siku, lilelile kwa kila mtu. Shiriki matokeo yako na ulinganishe.',
  'play.how.english': 'Neno huwa la Kiingereza kila wakati. Kidokezo kinakuambia mada.',
  'play.how.points': 'Maliza upate pointi 5, litatue upate pointi 5 zaidi.',
  'play.how.gotIt': 'Nimeelewa',

  'play.category.body': 'mwili',
  'play.category.food': 'chakula na vinywaji',
  'play.category.move': 'kuusogeza mwili wako',
  'play.category.care': 'kutunza afya yako',
  'play.category.mind': 'akili na hisia',

  'play.mark.hit': 'mahali sahihi',
  'play.mark.near': 'ipo kwenye neno, mahali pasipo sahihi',
  'play.mark.miss': 'haipo kwenye neno',

  'play.stats.played': 'Umecheza',
  'play.stats.solved': 'Umetatua',
  'play.stats.streak': 'Mfululizo',

  // Sharing
  'play.share.whatsapp': 'WhatsApp',
  'play.share.more': 'Shiriki',
  'play.share.copy': 'Nakili kiungo',
  'play.share.copied': 'Imenakiliwa ✓',
  'play.share.wordLine': 'SmartClinic Health Word #{n} {score} ⏱ {time}',
  'play.share.wordInvite': 'Unaweza kunishinda? Cheza bure:',
  'play.share.duel': 'Nakupa changamoto! {theme}, siku {days} kwenye SmartClinic. Jiunge nami tuone nani atashinda:',
  'play.share.group': 'Jiunge na changamoto yangu ya afya ya siku {days} kwenye SmartClinic: {theme}. Tusaidiane kuendelea:',

  // Challenges
  'play.challenges.title': 'Changamoto',
  'play.challenges.intro': 'Mpe changamoto rafiki mmoja au kikundi kizima. Atakayefanya mambo mengi zaidi ya afya ndiye mshindi.',
  'play.challenges.none': 'Bado hakuna changamoto. Anzisha moja kisha umtumie rafiki au kikundi chako cha WhatsApp.',
  'play.challenges.start': 'Anzisha changamoto',

  'play.theme.ALL_ROUND': 'Kila kitu',
  'play.theme.WORD': 'Vita vya Health Word',
  'play.theme.QUIZ': 'Mabingwa wa maswali',
  'play.theme.ACTIVE_DAYS': 'Siku za bidii',
  'play.themeHint.ALL_ROUND': 'Kila jambo linahesabiwa',
  'play.themeHint.WORD': 'Majaribio machache, muda mfupi',
  'play.themeHint.QUIZ': 'Swali la kila siku',
  'play.themeHint.ACTIVE_DAYS': 'Ukaguzi na mazoea ya kila siku',
  'play.rules.ALL_ROUND': 'Kila siku: 10 kwa ukaguzi au zoea la kila siku, 5 kwa swali la siku na 5 zaidi ukijibu sawa, 5 kwa Health Word na 5 zaidi ukilitatua.',
  'play.rules.WORD': 'Kila siku: tatua Health Word upate 10, pamoja na 2 kwa kila jaribio lililobaki. Kucheza bila kutatua ni 2. Sare ikitokea, aliye na muda mfupi zaidi ndiye mshindi.',
  'play.rules.QUIZ': 'Kila siku: 5 kwa kujibu swali la siku na 10 zaidi ukijibu sawa.',
  'play.rules.ACTIVE_DAYS': 'Kila siku: 5 kwa ukaguzi wako na 5 kwa kuweka alama kwenye zoea la kila siku.',

  'play.mode.duel': 'Mmoja kwa mmoja',
  'play.mode.group': 'Kikundi (hadi 30)',
  'play.mode.duelShort': '1 kwa 1',
  'play.mode.groupShort': 'Kikundi',

  'play.form.what': 'Mtashindana kwa nini?',
  'play.form.who': 'Unampa changamoto nani?',
  'play.form.howLong': 'Kwa muda gani?',
  'play.form.days': 'Siku {n}',
  'play.form.tomorrow': 'Anza kesho badala ya leo',
  'play.form.privacy': 'Marafiki wanaona jina lako la kwanza, herufi ya kwanza ya jina lingine, pointi zako na siku ulizoshiriki. Kamwe si taarifa zako za afya.',
  'play.form.create': 'Unda na ualike',
  'play.form.cancel': 'Ghairi',

  'play.status.upcoming': 'Inaanza {date}',
  'play.status.daysLeft': 'Zimebaki siku {n}',
  'play.status.lastDay': 'Siku ya mwisho!',
  'play.status.ended': 'Imeisha',
  'play.status.doneToday': 'imefanyika leo ✓',

  // One challenge
  'play.challenge.back': 'Cheza',
  'play.challenge.by': 'Imeanzishwa na {name}',
  'play.challenge.players': 'Wachezaji {n} kati ya {max}',
  'play.challenge.board': 'Msimamo',
  'play.challenge.final': 'Matokeo ya mwisho',
  'play.challenge.scoreNow': 'Pointi za leo',
  'play.challenge.waiting': 'Tunasubiri marafiki wajiunge. Tuma mwaliko!',
  'play.challenge.howScored': 'Pointi zinavyopatikana',
  'play.challenge.again': 'Anzisha changamoto nyingine',
  'play.challenge.leave': 'Toka kwenye changamoto hii',
  'play.challenge.leaveConfirm': 'Unataka kutoka kwenye changamoto hii? Pointi zako zitaondolewa kwenye orodha.',
  'play.challenge.notFound': 'Hatukuweza kupata changamoto hiyo. Angalia kiungo.',

  'play.invite.titleDuel': 'Mwalike mpinzani wako',
  'play.invite.titleGroup': 'Waalike marafiki zako',
  'play.invite.body': 'Tuma kiungo kwa WhatsApp, kwa ujumbe mfupi, au kwenye kikundi chochote. Marafiki wapya kwenye SmartClinic wanaweza kujiunga bila malipo.',

  'play.join.title': '{name} amekupa changamoto!',
  'play.join.cta': 'Kubali changamoto',
  'play.join.full': 'Changamoto hii imejaa tayari.',
  'play.join.ended': 'Changamoto hii imeisha.',

  'play.board.place': 'Nafasi ya {n}',
  'play.board.you': 'wewe',
  'play.board.activeDays': 'Siku {n} za bidii',
  'play.board.today': 'leo',

  // Friends this week
  'play.week.title': 'Wiki hii na marafiki',
  'play.week.intro': 'Wewe na wote uliowapa changamoto. Huanza upya kila Jumatatu.',
  'play.week.noFriends': 'Anzisha changamoto uwaone marafiki zako hapa.',

  // Shared-link landing (before sign-in)
  'play.landing.eyebrow': 'SmartClinic',
  'play.landing.challengeTitle': '{name} amekupa changamoto!',
  'play.landing.challengeBody': '{theme}, kwa siku {days}. Fanya mambo madogo ya afya kila siku uone nani atakuwa wa kwanza.',
  'play.landing.wordTitle': 'Unaweza kukisia Health Word ya leo?',
  'play.landing.wordBody': 'Neno moja la afya la Kiingereza lenye herufi tano kila siku, majaribio sita. Jifunze jambo jipya, pata pointi, na uwashinde marafiki zako.',
  'play.landing.join': 'Jiunge bila malipo ucheze',
  'play.landing.signIn': 'Tayari nina akaunti',
  'play.landing.open': 'Fungua changamoto',
  'play.landing.play': 'Cheza sasa',
  'play.landing.free': 'Kujiunga ni bure. Pointi unazopata zinaweza kuchangia Health Check.',
};

export default play;
