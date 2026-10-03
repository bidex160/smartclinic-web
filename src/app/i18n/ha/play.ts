import type { Dictionary } from '../types';

/** play — ha. */
const play: Dictionary = {
  'play.loading': 'Ana buɗewa…',
  'play.error': 'Wani abu ya faru. Sake gwadawa, don Allah.',
  'play.points': 'maki',

  // Page
  'play.page.eyebrow': 'Wasa',
  'play.page.title': 'Yi wasa, ka ƙalubalanci abokai',
  'play.page.intro': 'Kalmar lafiya ɗaya a kullum, da ƙalubale masu daɗi da ke sa kai da abokanka ku ci gaba.',
  'play.page.fairPlay': 'Gaskiya a wasa: maki suna zuwa ne kawai daga abubuwan lafiya da ka yi a SmartClinic, sau ɗaya a rana kowanne. Babu wanda yake ganin bayanan lafiyarka.',

  // Dashboard tile
  'play.tile.title': 'Health Word na yau',
  'play.tile.body': 'Yi hasashen kalmar cikin gwaji shida, sannan ka ƙalubalanci aboki.',
  'play.tile.cta': 'Yi wasa',

  // Health Word
  'play.word.eyebrow': 'Wasan yau da kullum',
  'play.word.title': 'Health Word #{n}',
  'play.word.hint': 'Manuniya: tana da alaƙa da {category}',
  'play.word.rules': 'Yi hasashen kalmar lafiya ta Turanci, mai haruffa biyar, cikin gwaji {tries}. Agogo zai fara aiki idan ka danna Yi wasa.',
  'play.word.legend': 'Kore: harafin daidai, wurin daidai. Rawaya: yana cikin kalmar, amma ba a wurinsa ba. Toka-toka: ba ya cikin kalmar.',
  'play.word.start': 'Yi wasa',
  'play.word.boardLabel': 'Hasashenka',
  'play.word.keyboard': 'Allon rubutu',
  'play.word.enter': 'Aika',
  'play.word.delete': 'Share harafi',
  'play.word.timeLabel': 'Lokaci: {time}',
  'play.word.tooShort': 'Rubuta haruffa {n}',
  'play.word.feedback': '{hit} a wurin da ya dace, {near} suna cikin kalmar',
  'play.word.solved': 'An warware cikin gwaji {tries}, {time}!',
  'play.word.solvedShort': 'An warware!',
  'play.word.notSolved': 'Ba wannan karon ba. Kalmar ita ce {word}.',
  'play.word.answerWas': 'Kalmar ita ce {word}.',
  'play.word.shareAsk': 'Aika sakamakonka, ka ga ko abokanka za su iya doke shi:',
  'play.word.tomorrow': 'Sabuwar Health Word za ta zo gobe.',

  // How to play
  'play.how.title': 'Yadda ake wasa',
  'play.how.step1': 'Yi hasashen kalmar lafiya ta yau mai haruffa biyar. Kana da gwaji {tries}.',
  'play.how.step2': 'Rubuta kalma mai haruffa biyar, sannan ka danna Aika.',
  'play.how.step3': 'Launuka suna nuna yadda ka kusa. Ka yi amfani da su wajen hasashenka na gaba.',
  'play.how.examples': 'Misalai',
  'play.how.exHit': 'Kore: {letter} yana cikin kalmar, a wurinsa daidai.',
  'play.how.exNear': 'Rawaya: {letter} yana cikin kalmar, amma a wani wuri.',
  'play.how.exMiss': 'Toka-toka: {letter} ba ya cikin kalmar.',
  'play.how.clock': 'Agogo zai fara aiki idan ka danna Yi wasa. Gaggawa ta fi kyau a ƙalubale.',
  'play.how.daily': 'Sabuwar kalma ɗaya a rana, iri ɗaya ga kowa. Aika sakamakonka ka kwatanta.',
  'play.how.english': 'Kalmar tana kasancewa da Turanci a koyaushe. Manuniya za ta gaya maka batun.',
  'play.how.points': 'Ka kammala don samun maki 5, ka warware ta don samun wasu 5.',
  'play.how.gotIt': 'Na gane',

  'play.category.body': 'jiki',
  'play.category.food': 'abinci da abin sha',
  'play.category.move': 'motsa jiki',
  'play.category.care': 'kula da lafiyarka',
  'play.category.mind': 'hankali da yanayin rai',

  'play.mark.hit': 'wurin daidai',
  'play.mark.near': 'yana cikin kalmar, wurin ba daidai ba',
  'play.mark.miss': 'ba ya cikin kalmar',

  'play.stats.played': 'An yi wasa',
  'play.stats.solved': 'An warware',
  'play.stats.streak': 'Jere',

  // Sharing
  'play.share.whatsapp': 'WhatsApp',
  'play.share.more': 'Aika',
  'play.share.copy': 'Kwafi mahaɗar',
  'play.share.copied': 'An kwafa ✓',
  'play.share.wordLine': 'SmartClinic Health Word #{n} {score} ⏱ {time}',
  'play.share.wordInvite': 'Za ka iya doke ni? Yi wasa kyauta:',
  'play.share.duel': 'Na ƙalubalance ka! {theme}, kwana {days} a SmartClinic. Zo mu ga wanda zai yi nasara:',
  'play.share.group': 'Ka shiga ƙalubalen lafiyata na kwana {days} a SmartClinic: {theme}. Mu ƙarfafa juna:',

  // Challenges
  'play.challenges.title': 'Ƙalubale',
  'play.challenges.intro': 'Ka ƙalubalanci aboki ɗaya ko ƙungiya gaba ɗaya. Wanda ya fi yin abubuwan lafiya shi ne ya yi nasara.',
  'play.challenges.none': 'Babu ƙalubale tukuna. Fara ɗaya ka aika wa aboki ko ƙungiyarka ta WhatsApp.',
  'play.challenges.start': 'Fara ƙalubale',

  'play.theme.ALL_ROUND': 'Komai da komai',
  'play.theme.WORD': 'Gasar Health Word',
  'play.theme.QUIZ': 'Zakarun tambaya',
  'play.theme.ACTIVE_DAYS': 'Kwanakin ƙwazo',
  'play.themeHint.ALL_ROUND': 'Komai yana ƙirguwa',
  'play.themeHint.WORD': 'Gwaji mafi kaɗan, lokaci mafi sauri',
  'play.themeHint.QUIZ': 'Tambayar yau da kullum',
  'play.themeHint.ACTIVE_DAYS': 'Check-in da ayyukan yau da kullum',
  'play.rules.ALL_ROUND': 'Kowace rana: 10 don check-in ko aikin yau da kullum, 5 don tambayar yau da wasu 5 idan ka amsa daidai, 5 don Health Word da wasu 5 idan ka warware.',
  'play.rules.WORD': 'Kowace rana: warware Health Word don samun 10, da 2 ga kowane gwajin da ya rage maka. Yin wasa ba tare da warwarewa ba yana ba da 2. Idan maki sun yi daidai, wanda ya fi sauri shi ne ya yi nasara.',
  'play.rules.QUIZ': 'Kowace rana: 5 don amsa tambayar yau da wasu 10 idan ka amsa daidai.',
  'play.rules.ACTIVE_DAYS': 'Kowace rana: 5 don check-in ɗinka da 5 don yin alamar aikin yau da kullum.',

  'play.mode.duel': 'Mutum da mutum',
  'play.mode.group': 'Ƙungiya (har 30)',
  'play.mode.duelShort': '1-da-1',
  'play.mode.groupShort': 'Ƙungiya',

  'play.form.what': 'Me za ku yi gasa a kai?',
  'play.form.who': 'Wa kake ƙalubalanta?',
  'play.form.howLong': 'Har tsawon wane lokaci?',
  'play.form.days': 'Kwana {n}',
  'play.form.tomorrow': 'Fara gobe ba yau ba',
  'play.form.privacy': 'Abokai suna ganin sunanka na farko, harafin farko na sunan iyalinka, makinka da kwanakin ƙwazonka. Ba sa ganin bayanan lafiyarka ko kaɗan.',
  'play.form.create': 'Ƙirƙira ka gayyata',
  'play.form.cancel': 'Soke',

  'play.status.upcoming': 'Zai fara {date}',
  'play.status.daysLeft': 'Saura kwana {n}',
  'play.status.lastDay': 'Rana ta ƙarshe!',
  'play.status.ended': 'An gama',
  'play.status.doneToday': 'an yi yau ✓',

  // One challenge
  'play.challenge.back': 'Wasa',
  'play.challenge.by': '{name} ne ya fara',
  'play.challenge.players': 'Masu wasa {n} cikin {max}',
  'play.challenge.board': 'Jadawalin nasara',
  'play.challenge.final': 'Sakamako na ƙarshe',
  'play.challenge.scoreNow': 'Maki na yau',
  'play.challenge.waiting': 'Ana jiran abokai su shiga. Aika gayyata!',
  'play.challenge.howScored': 'Yadda ake samun maki',
  'play.challenge.again': 'Fara wani ƙalubale',
  'play.challenge.leave': 'Fita daga ƙalubalen',
  'play.challenge.leaveConfirm': 'Za ka fita daga wannan ƙalubale? Za a cire makinka daga jadawalin.',
  'play.challenge.notFound': 'Ba mu sami wannan ƙalubale ba. Duba mahaɗar.',

  'play.invite.titleDuel': 'Gayyaci abokin gasarka',
  'play.invite.titleGroup': 'Gayyaci abokanka',
  'play.invite.body': 'Aika mahaɗar ta WhatsApp, ta saƙon rubutu, ko zuwa kowace ƙungiya. Abokan da ba su taɓa shiga SmartClinic ba za su iya shiga kyauta.',

  'play.join.title': '{name} ya ƙalubalance ka!',
  'play.join.cta': 'Karɓi ƙalubalen',
  'play.join.full': 'Wannan ƙalubale ya cika.',
  'play.join.ended': 'An gama wannan ƙalubale.',

  'play.board.place': 'Matsayi na {n}',
  'play.board.you': 'kai',
  'play.board.activeDays': 'Kwanakin ƙwazo {n}',
  'play.board.today': 'yau',

  // Friends this week
  'play.week.title': 'Wannan makon tare da abokai',
  'play.week.intro': 'Kai da duk wanda ka ƙalubalanta. Ana sake farawa kowace Litinin.',
  'play.week.noFriends': 'Fara ƙalubale don ganin abokanka a nan.',

  // Shared-link landing (before sign-in)
  'play.landing.eyebrow': 'SmartClinic',
  'play.landing.challengeTitle': '{name} ya ƙalubalance ka!',
  'play.landing.challengeBody': '{theme}, na kwana {days}. Yi ƙananan abubuwan lafiya kowace rana ka ga wanda zai fi kowa.',
  'play.landing.wordTitle': 'Za ka iya hasashen Health Word na yau?',
  'play.landing.wordBody': 'Kalmar lafiya ɗaya a rana, ta Turanci, mai haruffa biyar, cikin gwaji shida. Koyi sabon abu, samu maki, ka doke abokanka.',
  'play.landing.join': 'Shiga kyauta ka yi wasa',
  'play.landing.signIn': 'Ina da asusu',
  'play.landing.open': 'Buɗe ƙalubalen',
  'play.landing.play': 'Yi wasa yanzu',
  'play.landing.free': 'Shiga kyauta ne. Makin da ka samu za su iya taimaka maka wajen Health Check.',
};

export default play;
