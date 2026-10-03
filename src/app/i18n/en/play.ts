import type { Dictionary } from '../types';

/** Play: the daily Health Word, challenges with friends, sharing. Friendly, short, never about anyone's health results. */
const play: Dictionary = {
  'play.loading': 'Loading…',
  'play.error': 'Something went wrong. Please try again.',
  'play.points': 'points',

  // Page
  'play.page.eyebrow': 'Play',
  'play.page.title': 'Play and challenge friends',
  'play.page.intro': 'A quick health word every day, and friendly challenges that keep you and your friends moving.',
  'play.page.fairPlay': 'Fair play: scores come only from healthy things you do in SmartClinic, once a day each. Nobody sees your health details.',

  // Dashboard tile
  'play.tile.title': 'Today’s Health Word',
  'play.tile.body': 'Guess the word in six tries, then challenge a friend.',
  'play.tile.cta': 'Play',

  // Health Word
  'play.word.eyebrow': 'Daily puzzle',
  'play.word.title': 'Health Word #{n}',
  'play.word.hint': 'Hint: it’s about {category}',
  'play.word.rules': 'Guess the five-letter health word in {tries} tries. The clock starts when you press Play.',
  'play.word.legend': 'Green: right letter, right place. Yellow: in the word, wrong place. Grey: not in the word.',
  'play.word.start': 'Play',
  'play.word.boardLabel': 'Your guesses',
  'play.word.keyboard': 'Keyboard',
  'play.word.enter': 'Enter',
  'play.word.delete': 'Delete letter',
  'play.word.timeLabel': 'Time: {time}',
  'play.word.tooShort': 'Type {n} letters',
  'play.word.feedback': '{hit} in the right place, {near} in the word',
  'play.word.solved': 'Solved: {tries}/6 in {time}!',
  'play.word.solvedShort': 'Solved!',
  'play.word.notSolved': 'Not this time. The word was {word}.',
  'play.word.answerWas': 'The word was {word}.',
  'play.word.shareAsk': 'Share your result and see if your friends can beat it:',
  'play.word.tomorrow': 'A new Health Word comes tomorrow.',

  'play.category.body': 'the body',
  'play.category.food': 'food and drink',
  'play.category.move': 'moving your body',
  'play.category.care': 'looking after your health',
  'play.category.mind': 'mind and mood',

  'play.mark.hit': 'right place',
  'play.mark.near': 'in the word, wrong place',
  'play.mark.miss': 'not in the word',

  'play.stats.played': 'Played',
  'play.stats.solved': 'Solved',
  'play.stats.streak': 'Streak',

  // Sharing
  'play.share.whatsapp': 'WhatsApp',
  'play.share.more': 'Share',
  'play.share.copy': 'Copy link',
  'play.share.copied': 'Copied ✓',
  'play.share.wordLine': 'SmartClinic Health Word #{n} {score} ⏱ {time}',
  'play.share.wordInvite': 'Can you beat me? Play free:',
  'play.share.duel': 'I challenge you! {theme}, {days} days on SmartClinic. Join me and let’s see who wins:',
  'play.share.group': 'Join my {days}-day health challenge on SmartClinic: {theme}. Let’s keep each other going:',

  // Challenges
  'play.challenges.title': 'Challenges',
  'play.challenges.intro': 'Challenge one friend or a whole group. Whoever does the most healthy things wins.',
  'play.challenges.none': 'No challenges yet. Start one and send it to a friend or your WhatsApp group.',
  'play.challenges.start': 'Start a challenge',

  'play.theme.ALL_ROUND': 'All-round',
  'play.theme.WORD': 'Health Word battle',
  'play.theme.QUIZ': 'Quiz champions',
  'play.theme.ACTIVE_DAYS': 'Active days',
  'play.themeHint.ALL_ROUND': 'Everything counts',
  'play.themeHint.WORD': 'Fewest tries, fastest time',
  'play.themeHint.QUIZ': 'Daily question',
  'play.themeHint.ACTIVE_DAYS': 'Check-ins and routines',
  'play.rules.ALL_ROUND': 'Each day: 10 for a check-in or routine, 5 for the daily question and 5 more if right, 5 for the Health Word and 5 more if solved.',
  'play.rules.WORD': 'Each day: solve the Health Word for 10, plus 2 for every try you have left. Playing without solving gives 2. Ties go to the faster time.',
  'play.rules.QUIZ': 'Each day: 5 for answering the daily question and 10 more if you get it right.',
  'play.rules.ACTIVE_DAYS': 'Each day: 5 for your check-in and 5 for ticking a routine.',

  'play.mode.duel': 'One-on-one',
  'play.mode.group': 'Group (up to 30)',
  'play.mode.duelShort': '1-on-1',
  'play.mode.groupShort': 'Group',

  'play.form.what': 'What will you compete on?',
  'play.form.who': 'Who are you challenging?',
  'play.form.howLong': 'How long?',
  'play.form.days': '{n} days',
  'play.form.tomorrow': 'Start tomorrow instead of today',
  'play.form.privacy': 'Friends see your first name, an initial, your score and active days. Never your health details.',
  'play.form.create': 'Create and invite',
  'play.form.cancel': 'Cancel',

  'play.status.upcoming': 'Starts {date}',
  'play.status.daysLeft': '{n} days left',
  'play.status.lastDay': 'Last day!',
  'play.status.ended': 'Finished',
  'play.status.doneToday': 'done today ✓',

  // One challenge
  'play.challenge.back': 'Play',
  'play.challenge.by': 'Started by {name}',
  'play.challenge.players': '{n} of {max} players',
  'play.challenge.board': 'Leaderboard',
  'play.challenge.final': 'Final results',
  'play.challenge.scoreNow': 'Score today',
  'play.challenge.waiting': 'Waiting for friends to join. Send the invite!',
  'play.challenge.howScored': 'How points are scored',
  'play.challenge.again': 'Start another challenge',
  'play.challenge.leave': 'Leave this challenge',
  'play.challenge.leaveConfirm': 'Leave this challenge? Your score will be removed from the board.',
  'play.challenge.notFound': 'We couldn’t find that challenge. Check the link.',

  'play.invite.titleDuel': 'Invite your opponent',
  'play.invite.titleGroup': 'Invite your friends',
  'play.invite.body': 'Send the link on WhatsApp, by text, or to any group. Friends new to SmartClinic can join free.',

  'play.join.title': '{name} challenged you!',
  'play.join.cta': 'Accept the challenge',
  'play.join.full': 'This challenge is already full.',
  'play.join.ended': 'This challenge has finished.',

  'play.board.place': 'Place {n}',
  'play.board.you': 'you',
  'play.board.activeDays': 'Active days: {n}',
  'play.board.today': 'today',

  // Friends this week
  'play.week.title': 'This week with friends',
  'play.week.intro': 'You and everyone you’ve challenged. Resets every Monday.',
  'play.week.noFriends': 'Start a challenge to see your friends here.',

  // Shared-link landing (before sign-in)
  'play.landing.eyebrow': 'SmartClinic',
  'play.landing.challengeTitle': '{name} challenged you!',
  'play.landing.challengeBody': '{theme}, for {days} days. Do small healthy things each day and see who comes out on top.',
  'play.landing.wordTitle': 'Can you guess today’s Health Word?',
  'play.landing.wordBody': 'One five-letter health word a day, six tries. Learn something new, earn points, and beat your friends.',
  'play.landing.join': 'Join free and play',
  'play.landing.signIn': 'I already have an account',
  'play.landing.open': 'Open the challenge',
  'play.landing.play': 'Play now',
  'play.landing.free': 'Free to join. Points you earn can go toward a Health Check.',
};

export default play;
