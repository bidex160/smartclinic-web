import type { Dictionary } from '../types';

/** Play — fr. */
const play: Dictionary = {
  'play.loading': 'Chargement…',
  'play.error': 'Un problème est survenu. Veuillez réessayer.',
  'play.points': 'points',

  // Page
  'play.page.eyebrow': 'Jeux',
  'play.page.title': 'Jouez et lancez des défis à vos amis',
  'play.page.intro': 'Un petit mot de santé chaque jour, et des défis amicaux pour vous garder, vous et vos amis, en mouvement.',
  'play.page.fairPlay': 'Fair-play : les scores viennent seulement des gestes de santé que vous faites dans SmartClinic, une fois par jour chacun. Personne ne voit vos informations de santé.',

  // Dashboard tile
  'play.tile.title': 'Le Health Word du jour',
  'play.tile.body': 'Devinez le mot en six essais, puis lancez un défi à un ami.',
  'play.tile.cta': 'Jouer',

  // Health Word
  'play.word.eyebrow': 'Jeu du jour',
  'play.word.title': 'Health Word #{n}',
  'play.word.hint': 'Indice : cela parle de {category}',
  'play.word.rules': 'Devinez le mot de santé en anglais, de cinq lettres, en {tries} essais. Le chrono démarre quand vous appuyez sur Jouer.',
  'play.word.legend': 'Vert : bonne lettre, bonne place. Jaune : dans le mot, mais mal placée. Gris : pas dans le mot.',
  'play.word.start': 'Jouer',
  'play.word.boardLabel': 'Vos essais',
  'play.word.keyboard': 'Clavier',
  'play.word.enter': 'Valider',
  'play.word.delete': 'Effacer la lettre',
  'play.word.timeLabel': 'Temps : {time}',
  'play.word.tooShort': 'Tapez {n} lettres',
  'play.word.feedback': '{hit} bien placées, {near} dans le mot',
  'play.word.solved': 'Trouvé : {tries}/6 en {time} !',
  'play.word.solvedShort': 'Trouvé !',
  'play.word.notSolved': 'Pas cette fois. Le mot était {word}.',
  'play.word.answerWas': 'Le mot était {word}.',
  'play.word.shareAsk': 'Partagez votre résultat et voyez si vos amis peuvent faire mieux :',
  'play.word.tomorrow': 'Un nouveau Health Word arrive demain.',

  // How to play
  'play.how.title': 'Comment jouer',
  'play.how.step1': 'Devinez le Health Word du jour, un mot de santé de cinq lettres. Vous avez {tries} essais.',
  'play.how.step2': 'Tapez un mot de cinq lettres et appuyez sur Valider.',
  'play.how.step3': 'Les couleurs montrent si vous êtes proche. Servez-vous-en pour votre prochain essai.',
  'play.how.examples': 'Exemples',
  'play.how.exHit': 'Vert : {letter} est dans le mot, à la bonne place.',
  'play.how.exNear': 'Jaune : {letter} est dans le mot, mais à une autre place.',
  'play.how.exMiss': 'Gris : {letter} n’est pas dans le mot.',
  'play.how.clock': 'Le chrono démarre quand vous appuyez sur Jouer. Aller vite compte dans les défis.',
  'play.how.daily': 'Un nouveau mot par jour, le même pour tous. Partagez votre résultat et comparez.',
  'play.how.english': 'Le mot est toujours en anglais. L’indice donne le thème.',
  'play.how.points': 'Terminez pour 5 points, trouvez le mot pour 5 de plus.',
  'play.how.gotIt': 'Compris',

  'play.category.body': 'le corps',
  'play.category.food': 'la nourriture et les boissons',
  'play.category.move': 'le mouvement du corps',
  'play.category.care': 'prendre soin de votre santé',
  'play.category.mind': 'le moral et l’esprit',

  'play.mark.hit': 'bonne place',
  'play.mark.near': 'dans le mot, mauvaise place',
  'play.mark.miss': 'pas dans le mot',

  'play.stats.played': 'Parties',
  'play.stats.solved': 'Trouvés',
  'play.stats.streak': 'Série',

  // Sharing
  'play.share.whatsapp': 'WhatsApp',
  'play.share.more': 'Partager',
  'play.share.copy': 'Copier le lien',
  'play.share.copied': 'Copié ✓',
  'play.share.wordLine': 'SmartClinic Health Word #{n} {score} ⏱ {time}',
  'play.share.wordInvite': 'Pouvez-vous me battre ? Jouez gratuitement :',
  'play.share.duel': 'Je vous lance un défi ! {theme}, {days} jours sur SmartClinic. Rejoignez-moi et voyons qui gagne :',
  'play.share.group': 'Rejoignez mon défi santé de {days} jours sur SmartClinic : {theme}. Encourageons-nous les uns les autres :',

  // Challenges
  'play.challenges.title': 'Défis',
  'play.challenges.intro': 'Lancez un défi à un ami ou à tout un groupe. Celui qui fait le plus de gestes de santé gagne.',
  'play.challenges.none': 'Pas encore de défi. Lancez-en un et envoyez-le à un ami ou à votre groupe WhatsApp.',
  'play.challenges.start': 'Lancer un défi',

  'play.theme.ALL_ROUND': 'Tout compte',
  'play.theme.WORD': 'Bataille de Health Word',
  'play.theme.QUIZ': 'Champions du quiz',
  'play.theme.ACTIVE_DAYS': 'Jours actifs',
  'play.themeHint.ALL_ROUND': 'Tout est compté',
  'play.themeHint.WORD': 'Le moins d’essais, le plus vite',
  'play.themeHint.QUIZ': 'Question du jour',
  'play.themeHint.ACTIVE_DAYS': 'Suivi du jour et routines',
  'play.rules.ALL_ROUND': 'Chaque jour : 10 pour le suivi du jour ou une routine, 5 pour la question du jour et 5 de plus si la réponse est juste, 5 pour le Health Word et 5 de plus si vous le trouvez.',
  'play.rules.WORD': 'Chaque jour : trouvez le Health Word pour 10, plus 2 pour chaque essai qu’il vous reste. Jouer sans trouver donne 2. En cas d’égalité, le temps le plus court gagne.',
  'play.rules.QUIZ': 'Chaque jour : 5 pour avoir répondu à la question du jour et 10 de plus si la réponse est juste.',
  'play.rules.ACTIVE_DAYS': 'Chaque jour : 5 pour votre suivi du jour et 5 pour avoir coché une routine.',

  'play.mode.duel': 'Un contre un',
  'play.mode.group': 'Groupe (jusqu’à 30)',
  'play.mode.duelShort': '1 contre 1',
  'play.mode.groupShort': 'Groupe',

  'play.form.what': 'Sur quoi allez-vous vous mesurer ?',
  'play.form.who': 'Qui voulez-vous défier ?',
  'play.form.howLong': 'Pendant combien de temps ?',
  'play.form.days': '{n} jours',
  'play.form.tomorrow': 'Commencer demain plutôt qu’aujourd’hui',
  'play.form.privacy': 'Vos amis voient votre prénom, une initiale, votre score et vos jours actifs. Jamais vos informations de santé.',
  'play.form.create': 'Créer et inviter',
  'play.form.cancel': 'Annuler',

  'play.status.upcoming': 'Début : {date}',
  'play.status.daysLeft': 'Encore {n} jours',
  'play.status.lastDay': 'Dernier jour !',
  'play.status.ended': 'Terminé',
  'play.status.doneToday': 'fait aujourd’hui ✓',

  // One challenge
  'play.challenge.back': 'Jeux',
  'play.challenge.by': 'Lancé par {name}',
  'play.challenge.players': '{n} joueurs sur {max}',
  'play.challenge.board': 'Classement',
  'play.challenge.final': 'Résultats finaux',
  'play.challenge.scoreNow': 'Score du jour',
  'play.challenge.waiting': 'En attente de vos amis. Envoyez l’invitation !',
  'play.challenge.howScored': 'Comment les points sont comptés',
  'play.challenge.again': 'Lancer un autre défi',
  'play.challenge.leave': 'Quitter ce défi',
  'play.challenge.leaveConfirm': 'Quitter ce défi ? Votre score sera retiré du classement.',
  'play.challenge.notFound': 'Nous n’avons pas trouvé ce défi. Vérifiez le lien.',

  'play.invite.titleDuel': 'Invitez votre adversaire',
  'play.invite.titleGroup': 'Invitez vos amis',
  'play.invite.body': 'Envoyez le lien par WhatsApp, par SMS ou dans n’importe quel groupe. Les amis qui découvrent SmartClinic peuvent s’inscrire gratuitement.',

  'play.join.title': '{name} vous défie !',
  'play.join.cta': 'Relever le défi',
  'play.join.full': 'Ce défi est déjà complet.',
  'play.join.ended': 'Ce défi est terminé.',

  'play.board.place': 'Place {n}',
  'play.board.you': 'vous',
  'play.board.activeDays': '{n} jours actifs',
  'play.board.today': 'aujourd’hui',

  // Friends this week
  'play.week.title': 'Cette semaine avec vos amis',
  'play.week.intro': 'Vous et toutes les personnes que vous avez défiées. Remise à zéro chaque lundi.',
  'play.week.noFriends': 'Lancez un défi pour voir vos amis ici.',

  // Shared-link landing (before sign-in)
  'play.landing.eyebrow': 'SmartClinic',
  'play.landing.challengeTitle': '{name} vous défie !',
  'play.landing.challengeBody': '{theme}, pendant {days} jours. Faites chaque jour de petits gestes de santé et voyez qui arrive en tête.',
  'play.landing.wordTitle': 'Saurez-vous deviner le Health Word du jour ?',
  'play.landing.wordBody': 'Un mot de santé en anglais, de cinq lettres, chaque jour, en six essais. Apprenez du nouveau, gagnez des points et battez vos amis.',
  'play.landing.join': 'S’inscrire gratuitement et jouer',
  'play.landing.signIn': 'J’ai déjà un compte',
  'play.landing.open': 'Ouvrir le défi',
  'play.landing.play': 'Jouer maintenant',
  'play.landing.free': 'Inscription gratuite. Les points gagnés peuvent compter pour un Health Check.',
};

export default play;
