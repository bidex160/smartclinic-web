import type { Dictionary } from '../types';

/** Play: the daily Health Word, challenges with friends, sharing. Nigerian Pidgin. */
const play: Dictionary = {
  'play.loading': 'E dey load…',
  'play.error': 'Something don go wrong. Abeg try again.',
  'play.points': 'points',

  // Page
  'play.page.eyebrow': 'Play',
  'play.page.title': 'Play and challenge your friends',
  'play.page.intro': 'One quick health word every day, and friendly challenges wey go keep you and your friends dey move.',
  'play.page.fairPlay': 'Fair play: points dey come only from healthy things wey you do for SmartClinic, one time every day for each. Nobody dey see your health details.',

  // Dashboard tile
  'play.tile.title': 'Today Health Word',
  'play.tile.body': 'Guess di word in six tries, then challenge one friend.',
  'play.tile.cta': 'Play',

  // Health Word
  'play.word.eyebrow': 'Daily puzzle',
  'play.word.title': 'Health Word #{n}',
  'play.word.hint': 'Hint: e be about {category}',
  'play.word.rules': 'Guess one health word wey get five letters for English in {tries} tries. Di clock go start wen you press Play.',
  'play.word.legend': 'Green: di letter correct and e dey di right place. Yellow: di letter dey inside di word, but no be di right place. Grey: di letter no dey inside di word.',
  'play.word.start': 'Play',
  'play.word.boardLabel': 'Your guesses',
  'play.word.keyboard': 'Keyboard',
  'play.word.enter': 'Enter',
  'play.word.delete': 'Delete letter',
  'play.word.timeLabel': 'Time: {time}',
  'play.word.tooShort': 'Type {n} letters',
  'play.word.feedback': '{hit} dey di right place, {near} dey inside di word',
  'play.word.solved': 'You solve am in {tries} tries, {time}!',
  'play.word.solvedShort': 'You solve am!',
  'play.word.notSolved': 'No be dis time. Di word na {word}.',
  'play.word.answerWas': 'Di word na {word}.',
  'play.word.shareAsk': 'Share your result make you see if your friends fit beat am:',
  'play.word.tomorrow': 'New Health Word go come tomorrow.',

  // How to play
  'play.how.title': 'How to play',
  'play.how.step1': 'Guess today health word wey get five letters. You get {tries} tries.',
  'play.how.step2': 'Type one word wey get five letters, then press Enter.',
  'play.how.step3': 'Di colours dey show how close you be. Use dem for your next guess.',
  'play.how.examples': 'Examples',
  'play.how.exHit': 'Green: {letter} dey inside di word, and e dey di right place.',
  'play.how.exNear': 'Yellow: {letter} dey inside di word, but e dey another place.',
  'play.how.exMiss': 'Grey: {letter} no dey inside di word.',
  'play.how.clock': 'Di clock go start wen you press Play. For challenges, di faster you be, di better.',
  'play.how.daily': 'One new word every day, di same one for everybody. Share your result make you compare.',
  'play.how.english': 'Di word na always English. Di hint go tell you di topic.',
  'play.how.points': 'Finish am, you go get 5 points. Solve am, you go get 5 more.',
  'play.how.gotIt': 'I don get am',

  'play.category.body': 'di body',
  'play.category.food': 'food and drink',
  'play.category.move': 'how to move your body',
  'play.category.care': 'how to take care of your health',
  'play.category.mind': 'mind and mood',

  'play.mark.hit': 'right place',
  'play.mark.near': 'dey inside di word, but no be di right place',
  'play.mark.miss': 'no dey inside di word',

  'play.stats.played': 'Played',
  'play.stats.solved': 'Solved',
  'play.stats.streak': 'Streak',

  // Sharing
  'play.share.whatsapp': 'WhatsApp',
  'play.share.more': 'Share',
  'play.share.copy': 'Copy link',
  'play.share.copied': 'E don copy ✓',
  'play.share.wordLine': 'SmartClinic Health Word #{n} {score} ⏱ {time}',
  'play.share.wordInvite': 'You fit beat me? Play am free:',
  'play.share.duel': 'I dey challenge you! {theme}, {days} days for SmartClinic. Join me make we see who go win:',
  'play.share.group': 'Join my {days}-day health challenge for SmartClinic: {theme}. Make we dey push each other:',

  // Challenges
  'play.challenges.title': 'Challenges',
  'play.challenges.intro': 'Challenge one friend or whole group. Person wey do di most healthy things go win.',
  'play.challenges.none': 'No challenge yet. Start one and send am give one friend or your WhatsApp group.',
  'play.challenges.start': 'Start challenge',

  'play.theme.ALL_ROUND': 'All-round',
  'play.theme.WORD': 'Health Word battle',
  'play.theme.QUIZ': 'Quiz champions',
  'play.theme.ACTIVE_DAYS': 'Active days',
  'play.themeHint.ALL_ROUND': 'Everything dey count',
  'play.themeHint.WORD': 'Fewest tries, fastest time',
  'play.themeHint.QUIZ': 'Daily question',
  'play.themeHint.ACTIVE_DAYS': 'Check-ins and routines',
  'play.rules.ALL_ROUND': 'Every day: 10 for check-in or routine, 5 for di daily question and 5 more if you get am right, 5 for di Health Word and 5 more if you solve am.',
  'play.rules.WORD': 'Every day: solve di Health Word for 10, plus 2 for every try wey remain you. If you play but no solve am, you get 2. If score tie, di faster time win.',
  'play.rules.QUIZ': 'Every day: 5 for answering di daily question and 10 more if you get am right.',
  'play.rules.ACTIVE_DAYS': 'Every day: 5 for your check-in and 5 for ticking one routine.',

  'play.mode.duel': 'One-on-one',
  'play.mode.group': 'Group (up to 30)',
  'play.mode.duelShort': '1-on-1',
  'play.mode.groupShort': 'Group',

  'play.form.what': 'Wetin una go compete for?',
  'play.form.who': 'Who you dey challenge?',
  'play.form.howLong': 'How long?',
  'play.form.days': '{n} days',
  'play.form.tomorrow': 'Start tomorrow, no be today',
  'play.form.privacy': 'Your friends go see your first name, one initial, your score and active days. Dem no go ever see your health details.',
  'play.form.create': 'Create and invite',
  'play.form.cancel': 'Cancel',

  'play.status.upcoming': 'E go start {date}',
  'play.status.daysLeft': '{n} days remain',
  'play.status.lastDay': 'Last day!',
  'play.status.ended': 'E don finish',
  'play.status.doneToday': 'don do today ✓',

  // One challenge
  'play.challenge.back': 'Play',
  'play.challenge.by': '{name} start am',
  'play.challenge.players': '{n} out of {max} players',
  'play.challenge.board': 'Leaderboard',
  'play.challenge.final': 'Final results',
  'play.challenge.scoreNow': 'Score today',
  'play.challenge.waiting': 'We dey wait make friends join. Send di invite!',
  'play.challenge.howScored': 'How dem dey count points',
  'play.challenge.again': 'Start another challenge',
  'play.challenge.leave': 'Leave dis challenge',
  'play.challenge.leaveConfirm': 'You wan leave dis challenge? Dem go comot your score from di board.',
  'play.challenge.notFound': 'We no see dat challenge. Check di link.',

  'play.invite.titleDuel': 'Invite who you dey challenge',
  'play.invite.titleGroup': 'Invite your friends',
  'play.invite.body': 'Send di link for WhatsApp, for text, or give any group. Friends wey be new for SmartClinic fit join free.',

  'play.join.title': '{name} challenge you!',
  'play.join.cta': 'Accept di challenge',
  'play.join.full': 'Dis challenge don full already.',
  'play.join.ended': 'Dis challenge don finish.',

  'play.board.place': 'Place {n}',
  'play.board.you': 'you',
  'play.board.activeDays': '{n} active days',
  'play.board.today': 'today',

  // Friends this week
  'play.week.title': 'Dis week with friends',
  'play.week.intro': 'You and everybody wey you don challenge. E dey start again every Monday.',
  'play.week.noFriends': 'Start one challenge make you see your friends here.',

  // Shared-link landing (before sign-in)
  'play.landing.eyebrow': 'SmartClinic',
  'play.landing.challengeTitle': '{name} challenge you!',
  'play.landing.challengeBody': '{theme}, for {days} days. Do small healthy things every day and see who go carry first.',
  'play.landing.wordTitle': 'You fit guess today Health Word?',
  'play.landing.wordBody': 'One health word wey get five letters for English every day, six tries. Learn something new, collect points, and beat your friends.',
  'play.landing.join': 'Join free and play',
  'play.landing.signIn': 'I don get account already',
  'play.landing.open': 'Open di challenge',
  'play.landing.play': 'Play now',
  'play.landing.free': 'Free to join. Points wey you collect fit go toward Health Check.',
};

export default play;
