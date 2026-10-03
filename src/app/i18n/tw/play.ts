import type { Dictionary } from '../types';

/** Play: the daily Health Word, challenges with friends, sharing (Twi, Asante). */
const play: Dictionary = {
  'play.loading': 'Ɛreba…',
  'play.error': 'Biribi akɔ basaa. San bɔ mmɔden.',
  'play.points': 'nsɛnkyerɛnne',

  // Page
  'play.page.eyebrow': 'Agorɔ',
  'play.page.title': 'Di agorɔ na hyɛ wo nnamfo sɔhwɛ',
  'play.page.intro': 'Apɔmuden asɛmfua ketewa da biara, ne sɔhwɛ a ɛyɛ anigye a ɛma wo ne wo nnamfo kɔ so.',
  'play.page.fairPlay': 'Agorɔ pa: nsɛnkyerɛnne no fi nneɛma pa a woyɛ wɔ SmartClinic mu nko ara, baako baako da biara. Obiara nhu wo apɔmuden ho nsɛm.',

  // Dashboard tile
  'play.tile.title': 'Nnɛ Health Word',
  'play.tile.body': 'Hwehwɛ asɛmfua no mpɛn nsia mu, afei hyɛ adamfo sɔhwɛ.',
  'play.tile.cta': 'Di agorɔ',

  // Health Word
  'play.word.eyebrow': 'Da biara agorɔ',
  'play.word.title': 'Health Word #{n}',
  'play.word.hint': 'Nkyerɛkyerɛ: ɛfa {category} ho',
  'play.word.rules': 'Hwehwɛ apɔmuden asɛmfua a ɛyɛ Borɔfo (English) kasa mu na ɛwɔ nkyerɛwee anum no mpɛn {tries} mu. Bere no fi ase sɛ wopia Di agorɔ.',
  'play.word.legend': 'Ahabammono: nkyerɛwee no teɛ, ne baabi nso teɛ. Kɔla: ɛwɔ asɛmfua no mu, nanso baabi nteɛ. Hweam: ɛnni asɛmfua no mu.',
  'play.word.start': 'Di agorɔ',
  'play.word.boardLabel': 'Wo nsɛso',
  'play.word.keyboard': 'Kibobɔd',
  'play.word.enter': 'Fa hyɛ mu',
  'play.word.delete': 'Pepa nkyerɛwee',
  'play.word.timeLabel': 'Bere: {time}',
  'play.word.tooShort': 'Kyerɛw nkyerɛwee {n}',
  'play.word.feedback': '{hit} wɔ baabi pa, {near} wɔ asɛmfua no mu',
  'play.word.solved': 'Woanya no mpɛn {tries} mu, {time}!',
  'play.word.solvedShort': 'Woanya no!',
  'play.word.notSolved': 'Ɛnnɛ da. Asɛmfua no ne {word}.',
  'play.word.answerWas': 'Asɛmfua no ne {word}.',
  'play.word.shareAsk': 'Kyɛ wo nsonsonoeɛ na hwɛ sɛ wo nnamfo bɛtumi atwa mu:',
  'play.word.tomorrow': 'Health Word foforo bɛba ɔkyena.',

  'play.category.body': 'nipadua',
  'play.category.food': 'aduane ne nsa',
  'play.category.move': 'wo nipadua a wotu',
  'play.category.care': 'wo ho ahwɛ',
  'play.category.mind': 'adwene ne enyi',

  'play.mark.hit': 'baabi pa',
  'play.mark.near': 'ɛwɔ asɛmfua no mu, baabi nteɛ',
  'play.mark.miss': 'ɛnni asɛmfua no mu',

  'play.stats.played': 'Wɔadi',
  'play.stats.solved': 'Woanya',
  'play.stats.streak': 'Nna a ɛtoa so',

  // Sharing
  'play.share.whatsapp': 'WhatsApp',
  'play.share.more': 'Kyɛ',
  'play.share.copy': 'Kɔpi link',
  'play.share.copied': 'Wɔakɔpi ✓',
  'play.share.wordLine': 'SmartClinic Health Word #{n} {score} ⏱ {time}',
  'play.share.wordInvite': 'Wobɛtumi atwa me mu? Di agorɔ kwa:',
  'play.share.duel': 'Mehyɛ wo sɔhwɛ! {theme}, nna {days} wɔ SmartClinic. Bra yɛne wo nka ho na yɛnhwɛ hena na ɔbɛdi nkonim:',
  'play.share.group': 'Bra me apɔmuden sɔhwɛ a ɛyɛ nna {days} no ho wɔ SmartClinic: {theme}. Momma yɛmmoa yɛn ho yɛn ho:',

  // Challenges
  'play.challenges.title': 'Sɔhwɛ',
  'play.challenges.intro': 'Hyɛ adamfo baako anaa ɔkuw sɔhwɛ. Nea ɔbɛyɛ nneɛma pa dodow sen biara no na ɔbɛdi nkonim.',
  'play.challenges.none': 'Sɔhwɛ biara nni hɔ mprɛ. Fi baako ase na soma kɔma adamfo anaa wo WhatsApp kuw.',
  'play.challenges.start': 'Fi sɔhwɛ ase',

  'play.theme.ALL_ROUND': 'Ne nyinaa',
  'play.theme.WORD': 'Health Word ntɛmtitiriw',
  'play.theme.QUIZ': 'Asɛmmisa akokodurufo',
  'play.theme.ACTIVE_DAYS': 'Nna a woyɛɛ adwuma',
  'play.themeHint.ALL_ROUND': 'Biribiara ka ho',
  'play.themeHint.WORD': 'Mpɛn kakra, bere tiawa',
  'play.themeHint.QUIZ': 'Da biara asɛmmisa',
  'play.themeHint.ACTIVE_DAYS': 'Nhwehwɛmu ne da biara nneyɛe',
  'play.rules.ALL_ROUND': 'Da biara: 10 ma nhwehwɛmu anaa da biara nneyɛe, 5 ma da biara asɛmmisa na 5 bio sɛ wobua teɛ, 5 ma Health Word na 5 bio sɛ woanya a.',
  'play.rules.WORD': 'Da biara: nya Health Word no a 10, ne 2 ma mpɛn biara a aka ma wo. Sɛ wodi agorɔ nanso woannya a, 2. Sɛ ɛyɛ pɛ a, nea ne bere tia no na odi nkonim.',
  'play.rules.QUIZ': 'Da biara: 5 sɛ wobua da biara asɛmmisa no na 10 bio sɛ wobua teɛ.',
  'play.rules.ACTIVE_DAYS': 'Da biara: 5 ma wo nhwehwɛmu na 5 ma sɛ wopia da biara adeyɛ bi so.',

  'play.mode.duel': 'Baako ne baako',
  'play.mode.group': 'Ɔkuw (kɔsi 30)',
  'play.mode.duelShort': '1-ne-1',
  'play.mode.groupShort': 'Ɔkuw',

  'play.form.what': 'Dɛn na mobɛsiw so?',
  'play.form.who': 'Hena na woresɔ no hwɛ?',
  'play.form.howLong': 'Ɛbɛkyɛ sɛn?',
  'play.form.days': 'Nna {n}',
  'play.form.tomorrow': 'Fi ase ɔkyena sen nnɛ',
  'play.form.privacy': 'Nnamfo bɛhu wo din a ɛdi kan, nkyerɛwee baako, wo nsɛnkyerɛnne ne nna a woyɛɛ adwuma. Wɔnhu wo apɔmuden ho nsɛm da.',
  'play.form.create': 'Yɛ na frɛ',
  'play.form.cancel': 'Gyae',

  'play.status.upcoming': 'Ɛfi ase {date}',
  'play.status.daysLeft': 'Nna {n} aka',
  'play.status.lastDay': 'Da a etwa toɔ!',
  'play.status.ended': 'Ɛawie',
  'play.status.doneToday': 'woayɛ nnɛ ✓',

  // One challenge
  'play.challenge.back': 'Agorɔ',
  'play.challenge.by': '{name} na ofii ase',
  'play.challenge.players': 'Agorɔfo {n} wɔ {max} mu',
  'play.challenge.board': 'Nkonimdifo kyerɛwtohɔ',
  'play.challenge.final': 'Nea ɛtwa toɔ',
  'play.challenge.scoreNow': 'Nnɛ nsɛnkyerɛnne',
  'play.challenge.waiting': 'Yɛretwɛn sɛ nnamfo bɛka ho. Soma frɛ no!',
  'play.challenge.howScored': 'Sɛnea wonya nsɛnkyerɛnne',
  'play.challenge.again': 'Fi sɔhwɛ foforo ase',
  'play.challenge.leave': 'Fi sɔhwɛ yi mu',
  'play.challenge.leaveConfirm': 'Wobɛfi sɔhwɛ yi mu? Wɔbɛyi wo nsɛnkyerɛnne afi kyerɛwtohɔ no mu.',
  'play.challenge.notFound': 'Yɛantumi anhu sɔhwɛ no. Hwɛ link no.',

  'play.invite.titleDuel': 'Frɛ wo ne no bɛsi',
  'play.invite.titleGroup': 'Frɛ wo nnamfo',
  'play.invite.body': 'Soma link no wɔ WhatsApp so, wɔ text so, anaa kɔma kuw biara. Nnamfo a wonnim SmartClinic bɛtumi aka ho kwa.',

  'play.join.title': '{name} ahyɛ wo sɔhwɛ!',
  'play.join.cta': 'Gye sɔhwɛ no tom',
  'play.join.full': 'Sɔhwɛ yi ayɛ ma dedaw.',
  'play.join.ended': 'Sɔhwɛ yi awie.',

  'play.board.place': 'Bea {n}',
  'play.board.you': 'wo',
  'play.board.activeDays': 'Nna {n} a woyɛɛ adwuma',
  'play.board.today': 'nnɛ',

  // Friends this week
  'play.week.title': 'Nnawɔtwe yi ne nnamfo',
  'play.week.intro': 'Wo ne wɔn a woahyɛ wɔn sɔhwɛ nyinaa. Ɛfi ase bio Dwoda biara.',
  'play.week.noFriends': 'Fi sɔhwɛ ase na hu wo nnamfo ha.',

  // Shared-link landing (before sign-in)
  'play.landing.eyebrow': 'SmartClinic',
  'play.landing.challengeTitle': '{name} ahyɛ wo sɔhwɛ!',
  'play.landing.challengeBody': '{theme}, nna {days}. Yɛ nneɛma pa nketewa da biara na hwɛ hena na ɔbɛdi kan.',
  'play.landing.wordTitle': 'Wobɛtumi ahunu nnɛ Health Word no?',
  'play.landing.wordBody': 'Apɔmuden asɛmfua baako da biara a ɛyɛ Borɔfo kasa mu na ɛwɔ nkyerɛwee anum, mpɛn nsia. Sua biribi foforo, nya nsɛnkyerɛnne, na twa wo nnamfo mu.',
  'play.landing.join': 'Ka ho kwa na di agorɔ',
  'play.landing.signIn': 'Mewɔ akawunt dedaw',
  'play.landing.open': 'Bue sɔhwɛ no',
  'play.landing.play': 'Di agorɔ seisei',
  'play.landing.free': 'Wobɛtumi aka ho kwa. Nsɛnkyerɛnne a wonya no bɛtumi aboa wo wɔ Health Check ho.',
};

export default play;
