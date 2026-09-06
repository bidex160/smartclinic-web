import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state.service';

type GuideLanguage = 'en' | 'pcm';
type GuideCharacter = 'ayo' | 'zainab' | 'kito';

interface GuidePreferences {
  character: GuideCharacter;
  language: GuideLanguage;
  largeText: boolean;
  reducedMotion: boolean;
  autoSpeak: boolean;
  introduced: boolean;
}

interface GuideAnswer {
  title: string;
  body: string;
  route?: string;
  action?: string;
}

const STORAGE_KEY = 'smartclinic-guide-preferences-v1';
const DEFAULT_PREFERENCES: GuidePreferences = {
  character: 'ayo',
  language: 'en',
  largeText: false,
  reducedMotion: false,
  autoSpeak: true,
  introduced: false,
};

const CHARACTERS: ReadonlyArray<{ id: GuideCharacter; name: string; emoji: string }> = [
  { id: 'ayo', name: 'Ayo', emoji: '🦊' },
  { id: 'zainab', name: 'Zainab', emoji: '🦋' },
  { id: 'kito', name: 'Kito', emoji: '🐢' },
];

@Component({
  selector: 'app-smartclinic-companion',
  imports: [FormsModule, RouterLink],
  templateUrl: './smartclinic-companion.component.html',
  styleUrl: './smartclinic-companion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartClinicCompanionComponent {
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);

  readonly characters = CHARACTERS;
  readonly preferences = signal(this.loadPreferences());
  readonly open = signal(false);
  readonly settingsOpen = signal(false);
  readonly listening = signal(false);
  readonly speaking = signal(false);
  readonly query = signal('');
  readonly answer = signal<GuideAnswer | null>(null);

  readonly character = computed(
    () => CHARACTERS.find((item) => item.id === this.preferences().character) ?? CHARACTERS[0],
  );
  readonly language = computed(() => this.preferences().language);
  readonly welcome = computed(() =>
    this.language() === 'pcm'
      ? `Hello! I be ${this.character().name}, your SmartClinic guide. Wetin you wan do?`
      : `Hello! I’m ${this.character().name}, your SmartClinic guide. What would you like to do?`,
  );
  readonly supportsVoiceInput =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  readonly supportsSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

  constructor() {
    if (!this.preferences().introduced) {
      this.open.set(true);
      this.settingsOpen.set(true);
    }
  }

  toggle(): void {
    this.open.update((value) => !value);
    if (!this.open()) this.stopSpeaking();
  }

  finishIntroduction(): void {
    this.updatePreferences({ introduced: true });
    this.settingsOpen.set(false);
    if (this.preferences().autoSpeak) this.readAloud();
  }

  skipIntroduction(): void {
    this.updatePreferences({ introduced: true });
    this.open.set(false);
  }

  chooseCharacter(character: GuideCharacter): void {
    this.updatePreferences({ character });
  }

  chooseLanguage(language: GuideLanguage): void {
    this.updatePreferences({ language });
    this.answer.set(null);
  }

  toggleLargeText(): void {
    this.updatePreferences({ largeText: !this.preferences().largeText });
  }

  toggleReducedMotion(): void {
    this.updatePreferences({ reducedMotion: !this.preferences().reducedMotion });
  }

  toggleAutoSpeak(): void {
    this.updatePreferences({ autoSpeak: !this.preferences().autoSpeak });
  }

  explain(topic: 'stay-well' | 'find-care' | 'hospital' | 'appointments' | 'passport' | 'network'): void {
    const pcm = this.language() === 'pcm';
    const answers: Record<typeof topic, GuideAnswer> = {
      'stay-well': {
        title: 'Stay Well',
        body: pcm
          ? 'Stay Well help you check your health before sickness start. First, tap Explore Stay Well. Choose Guided Self-Check if you wan answer simple questions yourself, or choose Health Check if you want provider check you. Follow the questions one by one. If any answer worry you, use Find Care talk to provider.'
          : 'Stay Well helps you understand your health before illness starts. First, tap Explore Stay Well. Choose Guided Self-Check to answer simple questions yourself, or choose Health Check to book a provider. Follow each question one at a time. If a result concerns you, use Find Care to speak with a provider.',
        route: '/me/health-journey',
        action: pcm ? 'Start am' : 'Explore Stay Well',
      },
      'find-care': {
        title: 'Find Care',
        body: pcm
          ? 'Find Care help you when something dey worry you. First, tap Find Care. Tell us the problem with simple words. Choose the kind service and how you want receive care. Check the provider, price and time before you confirm. If na emergency, call emergency service or go hospital now.'
          : 'Find Care helps when something is worrying you. First, tap Find Care and describe the problem in simple words. Choose the service and how you want to receive care. Check the provider, price, and time before confirming. For an emergency, contact emergency services or go to the nearest emergency department.',
        route: '/me/request-care',
        action: pcm ? 'Find care' : 'Find Care',
      },
      hospital: {
        title: pcm ? 'My Hospital' : 'My Hospital',
        body: pcm
          ? 'My Hospital connect you to hospital wey you dey use. Tap Connect Hospital, search the hospital, then choose whether you be new or existing patient. If you don register before, enter your hospital number and complete identity check. After connection, you fit see supported bills, appointments, receipts and records.'
          : 'My Hospital connects you to a hospital you use. Tap Connect My Hospital, search for the hospital, and choose whether you are a new or existing patient. Existing patients enter their hospital number and complete identity verification. After connection, supported bills, appointments, receipts, and records can appear here.',
        route: '/me/providers/connect',
        action: pcm ? 'Connect hospital' : 'Connect My Hospital',
      },
      appointments: {
        title: pcm ? 'Why book appointment?' : 'Why book an appointment?',
        body: pcm
          ? 'Appointment help provider prepare before you reach. Choose the care you need, provider, date and time. Check the price, then confirm. SmartClinic go show your next step and keep the appointment information together.'
          : 'An appointment helps the provider prepare before you arrive. Choose the care you need, provider, date, and time. Review the price, then confirm. SmartClinic shows your next step and keeps the appointment information together.',
        route: '/me/request-care',
        action: pcm ? 'Book care' : 'Book Care',
      },
      passport: {
        title: 'Health Passport',
        body: pcm
          ? 'Health Passport na one place for health information wey SmartClinic make available to you. Open am see your available checks, results and care information. If hospital or provider need record, na you choose wetin to share and how long dem fit see am.'
          : 'Health Passport is one place for health information SmartClinic has made available to you. Open it to see available checks, results, and care information. When a hospital or provider needs a record, you choose what to share and how long access should last.',
        route: '/me/health-passport',
        action: pcm ? 'Open passport' : 'Open Health Passport',
      },
      network: {
        title: pcm ? 'Build the Network' : 'Build the Network',
        body: pcm
          ? 'Build the Network mean say you help another person or provider join healthcare community. Open My Impact, copy your personal link, then share am. Follow up help the person finish and activate. Pending points dey wait for confirmation; verified points count for your level and leaderboard.'
          : 'Build the Network means helping another person or provider join the healthcare community. Open My Impact, copy your personal link, and share it. Follow up so the person completes and activates their account. Pending points await confirmation; verified points count toward your level and leaderboard.',
        route: '/me/impact',
        action: pcm ? 'See my impact' : 'View My Impact',
      },
    };
    this.answer.set(answers[topic]);
    this.speakAnswerAutomatically();
  }

  explainThisPage(): void {
    const path = this.router.url.split('?')[0];
    if (path.includes('health-passport')) return this.explain('passport');
    if (path.includes('request-care') || path.includes('/care')) return this.explain('find-care');
    if (path.includes('provider') || path.includes('hospital')) return this.explain('hospital');
    if (path.includes('impact') || path.includes('referral')) return this.explain('network');
    if (path.includes('health') || path.includes('self-check')) return this.explain('stay-well');

    this.answer.set({
      title: this.language() === 'pcm' ? 'This page' : 'About this page',
      body:
        this.language() === 'pcm'
          ? 'This na SmartClinic front door. Choose Stay Well, Find Care, or My Hospital. I fit explain any one.'
          : 'This is the SmartClinic front door. Choose Stay Well, Find Care, or My Hospital. I can explain any option.',
    });
    this.speakAnswerAutomatically();
  }

  actionRoute(route: string): string {
    return this.authState.isPatient() ? route : '/login';
  }

  actionQueryParams(route: string): Record<string, string> | null {
    return this.authState.isPatient() ? null : { returnUrl: route };
  }

  ask(): void {
    const value = this.query().trim().toLowerCase();
    if (!value) return;
    if (/(chest pain|cannot breathe|can't breathe|unconscious|bleeding|emergency|suicide)/i.test(value)) {
      this.answer.set({
        title: this.language() === 'pcm' ? 'Get urgent help now' : 'Get urgent help now',
        body:
          this.language() === 'pcm'
            ? 'This guide no be emergency service. Call your local emergency number or go the nearest emergency department now.'
            : 'This guide is not an emergency service. Call your local emergency number or go to the nearest emergency department now.',
      });
      this.speakAnswerAutomatically();
    } else if (/(well|check|test|healthy)/i.test(value)) this.explain('stay-well');
    else if (/(doctor|care|sick|symptom|help)/i.test(value)) this.explain('find-care');
    else if (/(hospital|record|bill|wallet)/i.test(value)) this.explain('hospital');
    else if (/(appointment|book|visit)/i.test(value)) this.explain('appointments');
    else if (/(passport|result)/i.test(value)) this.explain('passport');
    else if (/(point|refer|invite|leader|network)/i.test(value)) this.explain('network');
    else {
      this.answer.set({
        title: this.language() === 'pcm' ? 'Make we find am together' : 'Let’s find it together',
        body:
          this.language() === 'pcm'
            ? 'I fit explain Stay Well, Find Care, My Hospital, appointment, Health Passport, or network points. Choose one below.'
            : 'I can explain Stay Well, Find Care, My Hospital, appointments, Health Passport, or network points. Choose one below.',
      });
      this.speakAnswerAutomatically();
    }
    this.query.set('');
  }

  readAloud(): void {
    if (!this.supportsSpeech) return;
    this.stopSpeaking();
    const response = this.answer();
    const utterance = new SpeechSynthesisUtterance(response ? `${response.title}. ${response.body}` : this.welcome());
    utterance.lang = this.language() === 'pcm' ? 'en-NG' : 'en-GB';
    utterance.rate = 0.98;
    const preferredVoice = this.preferredVoice();
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onend = () => this.speaking.set(false);
    utterance.onerror = () => this.speaking.set(false);
    this.speaking.set(true);
    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if (this.supportsSpeech) window.speechSynthesis.cancel();
    this.speaking.set(false);
  }

  startListening(): void {
    if (!this.supportsVoiceInput || this.listening()) return;
    const recognitionConstructor = (
      window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      }
    ).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    const recognition = new recognitionConstructor();
    recognition.lang = this.language() === 'pcm' ? 'en-NG' : 'en-GB';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      this.query.set(event.results[0][0].transcript);
      this.listening.set(false);
      this.ask();
    };
    recognition.onerror = () => this.listening.set(false);
    recognition.onend = () => this.listening.set(false);
    this.listening.set(true);
    recognition.start();
  }

  private updatePreferences(patch: Partial<GuidePreferences>): void {
    const next = { ...this.preferences(), ...patch };
    this.preferences.set(next);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private speakAnswerAutomatically(): void {
    if (this.preferences().autoSpeak) this.readAloud();
  }

  private preferredVoice(): SpeechSynthesisVoice | null {
    if (!this.supportsSpeech) return null;
    const languagePrefix = this.language() === 'pcm' ? 'en-NG' : 'en';
    const voices = window.speechSynthesis.getVoices();
    const preferredNames = /natural|neural|premium|enhanced|google|microsoft|siri/i;
    return (
      voices.find((voice) => voice.lang === languagePrefix && preferredNames.test(voice.name)) ??
      voices.find((voice) => voice.lang.startsWith(languagePrefix) && preferredNames.test(voice.name)) ??
      voices.find((voice) => voice.lang === languagePrefix) ??
      voices.find((voice) => voice.lang.startsWith('en')) ??
      null
    );
  }

  private loadPreferences(): GuidePreferences {
    if (typeof localStorage === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<GuidePreferences>;
      return { ...DEFAULT_PREFERENCES, ...saved };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onerror: () => void;
  onend: () => void;
  start(): void;
}
