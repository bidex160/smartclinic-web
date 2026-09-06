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

  explain(topic: 'stay-well' | 'find-care' | 'hospital' | 'appointments' | 'passport' | 'network'): void {
    const pcm = this.language() === 'pcm';
    const answers: Record<typeof topic, GuideAnswer> = {
      'stay-well': {
        title: 'Stay Well',
        body: pcm
          ? 'Use am check and understand your health before sickness start. You fit do guided self-check or book health check.'
          : 'Use Stay Well to check and understand your health before you feel unwell. Start a guided self-check or book a health check.',
        route: '/me/health-journey',
        action: pcm ? 'Start am' : 'Explore Stay Well',
      },
      'find-care': {
        title: 'Find Care',
        body: pcm
          ? 'Tell SmartClinic wetin dey worry you. We go guide you to the kind care or provider wey fit help.'
          : 'Tell SmartClinic what you need help with. We’ll guide you toward an appropriate service or provider.',
        route: '/me/request-care',
        action: pcm ? 'Find care' : 'Find Care',
      },
      hospital: {
        title: pcm ? 'My Hospital' : 'My Hospital',
        body: pcm
          ? 'Connect the hospital wey you dey use. You fit link your hospital number, see supported services and manage the relationship.'
          : 'Connect a hospital you use. You can link your hospital number, see supported services, and manage the relationship.',
        route: '/me/providers/connect',
        action: pcm ? 'Connect hospital' : 'Connect My Hospital',
      },
      appointments: {
        title: pcm ? 'Why book appointment?' : 'Why book an appointment?',
        body: pcm
          ? 'Booking helps the provider prepare for you, keeps your visit record together and shows you wetin to do next.'
          : 'Booking helps the provider prepare for you, keeps your visit organised, and gives you a clear next step.',
        route: '/me/request-care',
        action: pcm ? 'Book care' : 'Book Care',
      },
      passport: {
        title: 'Health Passport',
        body: pcm
          ? 'Na one place to see the health information wey SmartClinic don make available to you. Na you control who you share am with.'
          : 'It is one place to see health information SmartClinic has made available to you. You control whom you share it with.',
        route: '/me/health-passport',
        action: pcm ? 'Open passport' : 'Open Health Passport',
      },
      network: {
        title: pcm ? 'Build the Network' : 'Build the Network',
        body: pcm
          ? 'Share your personal link help people join. Points show verified impact; dem no be payment for unverified sign-ups.'
          : 'Share your personal link to help people join. Points recognise verified impact; they are not awarded for unverified sign-ups.',
        route: '/me/impact',
        action: pcm ? 'See my impact' : 'View My Impact',
      },
    };
    this.answer.set(answers[topic]);
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
    }
    this.query.set('');
  }

  readAloud(): void {
    if (!this.supportsSpeech) return;
    this.stopSpeaking();
    const response = this.answer();
    const utterance = new SpeechSynthesisUtterance(response ? `${response.title}. ${response.body}` : this.welcome());
    utterance.lang = this.language() === 'pcm' ? 'en-NG' : 'en-GB';
    utterance.rate = 0.86;
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
