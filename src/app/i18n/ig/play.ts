import type { Dictionary } from '../types';

/** Play — ig. */
const play: Dictionary = {
  'play.loading': 'Anyị na-ebu…',
  'play.error': 'Nsogbu dapụtara. Biko nwaa ọzọ.',
  'play.points': 'akara',

  // Page
  'play.page.eyebrow': 'Egwuregwu',
  'play.page.title': 'Gwuo egwu, were ndị enyi gị ma aka',
  'play.page.intro': 'Otu okwu ahụike dị mkpụmkpụ kwa ụbọchị, na ịma aka dị mma na-eme ka gị na ndị enyi gị na-agba mbọ.',
  'play.page.fairPlay': 'Egwu ziri ezi: akara na-esite naanị n’ihe ahụike ị na-eme na SmartClinic, otu ugboro kwa ụbọchị maka nke ọ bụla. Ọ dịghị onye na-ahụ nkọwa ahụike gị.',

  // Dashboard tile
  'play.tile.title': 'Health Word nke taa',
  'play.tile.body': 'Chọpụta okwu ahụ n’ọnwụnwa isii, mgbe ahụ were enyi gị ma aka.',
  'play.tile.cta': 'Gwuo',

  // Health Word
  'play.word.eyebrow': 'Ihe ọmụma kwa ụbọchị',
  'play.word.title': 'Health Word #{n}',
  'play.word.hint': 'Aka ntụ: ọ bụ banyere {category}',
  'play.word.rules': 'Chọpụta Health Word, okwu ahụike n’asụsụ Bekee nke nwere mkpụrụedemede ise, n’ọnwụnwa {tries}. Oge na-amalite mgbe ị pịrị Gwuo.',
  'play.word.legend': 'Akwụkwọ ndụ: mkpụrụedemede ziri ezi, n’ebe ziri ezi. Odo odo: ọ nọ n’okwu ahụ, mana ọ bụghị n’ebe ya. Isi awọ: ọ nọghị n’okwu ahụ.',
  'play.word.start': 'Gwuo',
  'play.word.boardLabel': 'Ihe ị chọpụtara',
  'play.word.keyboard': 'Bọọdụ mkpụrụedemede',
  'play.word.enter': 'Tinye',
  'play.word.delete': 'Hichapụ mkpụrụedemede',
  'play.word.timeLabel': 'Oge: {time}',
  'play.word.tooShort': 'Dee mkpụrụedemede {n}',
  'play.word.feedback': '{hit} n’ebe ziri ezi, {near} n’okwu ahụ',
  'play.word.solved': 'I chọpụtara ya n’ọnwụnwa {tries}, {time}!',
  'play.word.solvedShort': 'I chọpụtara ya!',
  'play.word.notSolved': 'Ọ bụghị nke a. Okwu ahụ bụ {word}.',
  'play.word.answerWas': 'Okwu ahụ bụ {word}.',
  'play.word.shareAsk': 'Kekọrịta nsonaazụ gị, hụ ma ndị enyi gị ga-agafe ya:',
  'play.word.tomorrow': 'Health Word ọhụrụ ga-abịa echi.',

  // How to play
  'play.how.title': 'Otú esi egwu',
  'play.how.step1': 'Chọpụta Health Word nke taa nke nwere mkpụrụedemede ise. Ị nwere ọnwụnwa {tries}.',
  'play.how.step2': 'Dee okwu nwere mkpụrụedemede ise, ma pịa Tinye.',
  'play.how.step3': 'Agba ndị ahụ na-egosi ka ị si dị nso. Jiri ha mee nchọpụta gị ọzọ.',
  'play.how.examples': 'Ihe atụ',
  'play.how.exHit': 'Akwụkwọ ndụ: {letter} nọ n’okwu ahụ, n’ebe ziri ezi.',
  'play.how.exNear': 'Odo odo: {letter} nọ n’okwu ahụ, mana n’ebe ọzọ.',
  'play.how.exMiss': 'Isi awọ: {letter} nọghị n’okwu ahụ.',
  'play.how.clock': 'Oge na-amalite mgbe ị pịrị Gwuo. Ịbụ ọsọ ka mma n’ịma aka.',
  'play.how.daily': 'Otu okwu ọhụrụ kwa ụbọchị, otu ihe ahụ maka onye ọ bụla. Kekọrịta nsonaazụ gị, tụnyere ya.',
  'play.how.english': 'Okwu ahụ bụ n’asụsụ Bekee mgbe niile. Aka ntụ ga-agwa gị isiokwu ya.',
  'play.how.points': 'Mechaa ya inweta akara 5, chọpụta ya inweta akara 5 ọzọ.',
  'play.how.gotIt': 'Aghọtara m',

  'play.category.body': 'ahụ',
  'play.category.food': 'nri na ihe ọṅụṅụ',
  'play.category.move': 'imegharị ahụ',
  'play.category.care': 'ilekọta ahụike gị',
  'play.category.mind': 'uche na mmụọ',

  'play.mark.hit': 'n’ebe ziri ezi',
  'play.mark.near': 'n’okwu ahụ, ebe na-ezighị ezi',
  'play.mark.miss': 'ọ nọghị n’okwu ahụ',

  'play.stats.played': 'E gwuola',
  'play.stats.solved': 'Echọpụtara',
  'play.stats.streak': 'Usoro',

  // Sharing
  'play.share.whatsapp': 'WhatsApp',
  'play.share.more': 'Kekọrịta',
  'play.share.copy': 'Detuo njikọ',
  'play.share.copied': 'Edetuola ✓',
  'play.share.wordLine': 'SmartClinic Health Word #{n} {score} ⏱ {time}',
  'play.share.wordInvite': 'Ị ga-agafe m? Gwuo n’efu:',
  'play.share.duel': 'Ana m ama gị aka! {theme}, ụbọchị {days} na SmartClinic. Sonye m ka anyị hụ onye ga-emeri:',
  'play.share.group': 'Soro m n’ịma aka ahụike nke ụbọchị {days} na SmartClinic: {theme}. Ka anyị na-akpali ibe anyị:',

  // Challenges
  'play.challenges.title': 'Ịma aka',
  'play.challenges.intro': 'Were otu enyi ma ọ bụ otu ndị enyi ma aka. Onye mere ihe ahụike kachasị ka ga-emeri.',
  'play.challenges.none': 'Enwebeghị ịma aka ọ bụla. Bido otu, zigara enyi gị ma ọ bụ ndị otu WhatsApp gị.',
  'play.challenges.start': 'Bido ịma aka',

  'play.theme.ALL_ROUND': 'Ihe niile',
  'play.theme.WORD': 'Ọgụ Health Word',
  'play.theme.QUIZ': 'Ndị mmeri ajụjụ',
  'play.theme.ACTIVE_DAYS': 'Ụbọchị mmegharị ahụ',
  'play.themeHint.ALL_ROUND': 'Ihe niile na-agụ',
  'play.themeHint.WORD': 'Ọnwụnwa kacha ole, oge kacha ngwa',
  'play.themeHint.QUIZ': 'Ajụjụ kwa ụbọchị',
  'play.themeHint.ACTIVE_DAYS': 'Ịkọ otu ahụ dị gị na omume',
  'play.rules.ALL_ROUND': 'Kwa ụbọchị: 10 maka ịkọ otu ahụ dị gị ma ọ bụ omume, 5 maka ajụjụ kwa ụbọchị na 5 ọzọ ma ọ bụrụ na ọ ziri ezi, 5 maka Health Word na 5 ọzọ ma ọ bụrụ na ị chọpụtara ya.',
  'play.rules.WORD': 'Kwa ụbọchị: chọpụta Health Word maka 10, tinyere 2 maka ọnwụnwa ọ bụla fọdụrụ gị. Ịgwu egwu na-achọpụtaghị ya na-enye 2. Ma ọ bụrụ na akara hà, onye oge ya dị ngwa ka ga-emeri.',
  'play.rules.QUIZ': 'Kwa ụbọchị: 5 maka ịza ajụjụ kwa ụbọchị na 10 ọzọ ma ọ bụrụ na ị zaa ya nke ọma.',
  'play.rules.ACTIVE_DAYS': 'Kwa ụbọchị: 5 maka ịkọ otu ahụ dị gị na 5 maka ịkaa akara na ị mere omume.',

  'play.mode.duel': 'Mmadụ abụọ',
  'play.mode.group': 'Otu (ruo mmadụ 30)',
  'play.mode.duelShort': '1 na 1',
  'play.mode.groupShort': 'Otu',

  'play.form.what': 'Gịnị ka unu ga-asọ mpi n’ime ya?',
  'play.form.who': 'Onye ka ị na-ama aka?',
  'play.form.howLong': 'Ogologo oge ole?',
  'play.form.days': 'Ụbọchị {n}',
  'play.form.tomorrow': 'Bido echi kama taa',
  'play.form.privacy': 'Ndị enyi na-ahụ aha mbụ gị, mkpụrụedemede mbụ nke aha ọzọ, akara gị na ụbọchị ị rụrụ ọrụ. Ha adịghị ahụ nkọwa ahụike gị.',
  'play.form.create': 'Mepụta ma kpọọ ha',
  'play.form.cancel': 'Kagbuo',

  'play.status.upcoming': 'Na-amalite {date}',
  'play.status.daysLeft': 'Ụbọchị {n} fọdụrụ',
  'play.status.lastDay': 'Ụbọchị ikpeazụ!',
  'play.status.ended': 'Agwụla',
  'play.status.doneToday': 'emechara taa ✓',

  // One challenge
  'play.challenge.back': 'Egwuregwu',
  'play.challenge.by': '{name} bidoro ya',
  'play.challenge.players': 'Ndị egwuregwu {n} n’ime {max}',
  'play.challenge.board': 'Ndepụta ndị na-eduga',
  'play.challenge.final': 'Nsonaazụ ikpeazụ',
  'play.challenge.scoreNow': 'Akara taa',
  'play.challenge.waiting': 'Anyị na-eche ka ndị enyi bata. Zipụ òkù ahụ!',
  'play.challenge.howScored': 'Otu esi enweta akara',
  'play.challenge.again': 'Bido ịma aka ọzọ',
  'play.challenge.leave': 'Pụọ n’ịma aka a',
  'play.challenge.leaveConfirm': 'Ị chọrọ ịpụ n’ịma aka a? A ga-ewepụ akara gị n’ime ndepụta ahụ.',
  'play.challenge.notFound': 'Anyị ahụghị ịma aka ahụ. Lelee njikọ ahụ.',

  'play.invite.titleDuel': 'Kpọọ onye ị na-ama aka',
  'play.invite.titleGroup': 'Kpọọ ndị enyi gị',
  'play.invite.body': 'Zipụ njikọ ahụ na WhatsApp, n’ozi ederede, ma ọ bụ n’otu ọ bụla. Ndị enyi ọhụrụ na SmartClinic nwere ike ịbata n’efu.',

  'play.join.title': '{name} ama gị aka!',
  'play.join.cta': 'Nabata ịma aka ahụ',
  'play.join.full': 'Ịma aka a jupụtala.',
  'play.join.ended': 'Ịma aka a agwụla.',

  'play.board.place': 'Ọnọdụ {n}',
  'play.board.you': 'gị',
  'play.board.activeDays': 'Ụbọchị {n} ọrụ',
  'play.board.today': 'taa',

  // Friends this week
  'play.week.title': 'Izu a na ndị enyi',
  'play.week.intro': 'Gị na onye ọ bụla ị mara aka. A na-amalite ọzọ kwa Mọnde.',
  'play.week.noFriends': 'Bido ịma aka ka ị hụ ndị enyi gị ebe a.',

  // Shared-link landing (before sign-in)
  'play.landing.eyebrow': 'SmartClinic',
  'play.landing.challengeTitle': '{name} ama gị aka!',
  'play.landing.challengeBody': '{theme}, ụbọchị {days}. Mee obere ihe ahụike kwa ụbọchị, hụ onye ga-eru ebe kachasị elu.',
  'play.landing.wordTitle': 'Ị nwere ike ịchọpụta Health Word nke taa?',
  'play.landing.wordBody': 'Otu okwu ahụike n’asụsụ Bekee nke nwere mkpụrụedemede ise kwa ụbọchị, ọnwụnwa isii. Mụta ihe ọhụrụ, nweta akara, gafekwa ndị enyi gị.',
  'play.landing.join': 'Sonye n’efu gwuo egwu',
  'play.landing.signIn': 'Enwere m akaụntụ',
  'play.landing.open': 'Meghee ịma aka ahụ',
  'play.landing.play': 'Gwuo ugbu a',
  'play.landing.free': 'Ịbanye bụ n’efu. Akara ị nwetara nwere ike inye aka n’ịkwụ ụgwọ Health Check.',
};

export default play;
