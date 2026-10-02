import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthStateService } from '../../../core/services/auth-state.service';
import { CompanionApiService, CompanionCapabilities, CompanionCharacter, CompanionTopic } from '../../../core/services/companion-api.service';
import { APP_LANGUAGES, AppLanguage, LocalePreferencesService } from '../../../core/services/locale-preferences.service';
import {
  BROWSER_VOICE_LOCALE,
  builtInExtra,
  builtInTopic,
  GuideAnswer,
  keywordTopic,
  LISTEN_LOCALE,
  URGENT_PATTERN,
  URGENT_TEXT,
  welcomeText,
} from './companion-content';

export type { GuideAnswer } from './companion-content';

interface GuidePreferences {
  character: CompanionCharacter;
  largeText: boolean;
  reducedMotion: boolean;
  autoSpeak: boolean;
  introduced: boolean;
}

interface ThreadItem {
  readonly id: number;
  readonly from: 'guide' | 'me';
  readonly answer: GuideAnswer;
  /** e.g. "Shown in English for now" */
  readonly note?: string;
}

type VoiceState = 'idle' | 'loading' | 'playing';

const STORAGE_KEY = 'smartclinic-guide-preferences-v1';
const DEFAULT_PREFERENCES: GuidePreferences = {
  character: 'ayo',
  largeText: false,
  reducedMotion: false,
  autoSpeak: true,
  introduced: false,
};

const CHARACTERS: ReadonlyArray<{ id: CompanionCharacter; name: string; emoji: string; voice: string }> = [
  { id: 'ayo', name: 'Ayo', emoji: '🦊', voice: 'Man’s voice' },
  { id: 'zainab', name: 'Zainab', emoji: '🦋', voice: 'Woman’s voice' },
  { id: 'kito', name: 'Kito', emoji: '🐢', voice: 'Calm voice' },
];

const TOPICS: ReadonlyArray<{ id: Exclude<CompanionTopic, 'welcome'>; label: string }> = [
  { id: 'find-care', label: 'See a doctor' },
  { id: 'stay-well', label: 'Check my health' },
  { id: 'know-numbers', label: 'Blood group & genotype' },
  { id: 'passport', label: 'Health Passport' },
  { id: 'points', label: 'My points' },
  { id: 'hospital', label: 'My Hospital' },
];

/**
 * The SmartClinic companion: a friendly guide that speaks the person's language in a natural voice,
 * answers questions, and always offers a real person. It never diagnoses.
 */
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
  private readonly api = inject(CompanionApiService);
  readonly locale = inject(LocalePreferencesService);

  readonly characters = CHARACTERS;
  readonly topics = TOPICS;
  readonly preferences = signal(this.loadPreferences());
  readonly open = signal(false);
  readonly settingsOpen = signal(false);
  /** True while the patient types in a page form, so the launcher never covers the field. */
  readonly typing = signal(false);
  readonly teaserVisible = computed(() => !this.open() && !this.preferences().introduced);
  /** On public pages the first-visit bubble would cover the main buttons on a phone, so it waits for wider screens. */
  readonly publicPage = signal(!this.router.url.startsWith('/me'));
  readonly listening = signal(false);
  readonly thinking = signal(false);
  readonly voice = signal<VoiceState>('idle');
  /** Which message is being read aloud. */
  readonly speakingId = signal<number | null>(null);
  readonly voiceNote = signal('');
  readonly query = signal('');
  readonly thread = signal<readonly ThreadItem[]>([]);
  readonly recentQuestions = signal<string[]>(this.loadRecentQuestions());

  private readonly capabilities = toSignal(this.api.capabilities(), { initialValue: { answers: false, voices: {} } as CompanionCapabilities });
  readonly character = computed(() => CHARACTERS.find((item) => item.id === this.preferences().character) ?? CHARACTERS[0]);
  readonly language = computed(() => this.locale.language());
  readonly languageName = computed(() => APP_LANGUAGES[this.language()].label);
  readonly welcome = computed(() => welcomeText(this.language(), this.character().name));
  /** The latest thing the guide said: what "Hear this" reads. */
  readonly answer = computed(() => [...this.thread()].reverse().find((t) => t.from === 'guide')?.answer ?? null);
  readonly naturalVoice = computed(() => Boolean(this.capabilities().voices[this.language()]));
  readonly supportsVoiceInput =
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  readonly supportsSpeech = typeof window !== 'undefined' && (typeof Audio !== 'undefined' || 'speechSynthesis' in window);

  private nextId = 1;
  private audio: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;

  constructor() {
    // First visit: invite gently with a small bubble instead of covering the page.
    if (!this.preferences().introduced) this.settingsOpen.set(true);
    inject(DestroyRef).onDestroy(() => this.stopSpeaking());
    this.router.events.pipe(takeUntilDestroyed()).subscribe(() => this.publicPage.set(!this.router.url.startsWith('/me')));
  }

  @HostListener('document:focusin', ['$event'])
  onFocusIn(event: FocusEvent): void {
    this.typing.set(isPageFormField(event.target));
  }

  @HostListener('document:focusout')
  onFocusOut(): void {
    this.typing.set(false);
  }

  toggle(): void {
    this.open.update((value) => !value);
    if (!this.open()) this.stopSpeaking();
  }

  finishIntroduction(): void {
    this.updatePreferences({ introduced: true });
    this.open.set(true);
    this.settingsOpen.set(false);
    if (this.preferences().autoSpeak) this.readAloud();
  }

  skipIntroduction(): void {
    this.updatePreferences({ introduced: true });
    this.open.set(false);
  }

  chooseCharacter(character: CompanionCharacter): void {
    this.updatePreferences({ character });
  }

  chooseLanguage(language: AppLanguage): void {
    this.stopSpeaking();
    this.locale.chooseLanguage(language);
    this.thread.set([]);
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

  /** Explain one part of the app, in the person's language. */
  explain(topic: Exclude<CompanionTopic, 'welcome'>): void {
    const lang = this.language();
    if (lang === 'en' || lang === 'pcm') return this.say(builtInTopic(topic, lang === 'pcm'));
    if (!this.capabilities().answers) return this.say(builtInTopic(topic, false), this.englishOnlyNote());
    this.fetchAnswer({ topic }, () => this.say(builtInTopic(topic, false), this.englishOnlyNote()));
  }

  explainThisPage(): void {
    const path = this.router.url.split('?')[0];
    if (path.includes('health-passport')) return this.explain('passport');
    if (path.includes('progress')) return this.explain('points');
    if (path.includes('request-care') || path.includes('/care')) return this.explain('find-care');
    if (path.includes('provider') || path.includes('hospital')) return this.explain('hospital');
    if (path.includes('health') || path.includes('self-check')) return this.explain('stay-well');
    const pcm = this.language() === 'pcm';
    this.say({
      title: pcm ? 'This page' : 'About this page',
      body: pcm
        ? 'This na SmartClinic front door. Choose Stay Well, Find Care, or My Hospital. I fit explain any one.'
        : 'This is the SmartClinic front door. Choose Stay Well, Find Care, or My Hospital. I can explain any of them.',
    });
  }

  actionRoute(route: string): string {
    return this.authState.isPatient() || !route.startsWith('/me') ? route : '/login';
  }

  actionQueryParams(route: string): Record<string, string> | null {
    return this.authState.isPatient() || !route.startsWith('/me') ? null : { returnUrl: route };
  }

  ask(): void {
    const raw = this.query().trim();
    if (!raw) return;
    this.rememberQuestion(raw);
    this.query.set('');
    this.push({ from: 'me', answer: { title: '', body: raw } });

    const lang = this.language();
    if (URGENT_PATTERN.test(raw)) return this.say(URGENT_TEXT[lang]);

    const offline = () => this.keywordAnswer(raw);
    if (this.capabilities().answers) this.fetchAnswer({ question: raw }, offline);
    else offline();
  }

  /** Read the latest answer (or the welcome) aloud. */
  readAloud(id?: number): void {
    const item = id ? this.thread().find((t) => t.id === id) : [...this.thread()].reverse().find((t) => t.from === 'guide');
    const text = item ? [item.answer.title, item.answer.body].filter(Boolean).join('. ') : this.welcome();
    this.speak(text, item?.id ?? 0, item?.note ? 'en' : this.language());
  }

  stopSpeaking(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    this.voice.set('idle');
    this.speakingId.set(null);
  }

  /** Kept for the template's original control. */
  speaking(): boolean {
    return this.voice() !== 'idle';
  }

  startListening(): void {
    if (!this.supportsVoiceInput || this.listening()) return;
    this.stopSpeaking();
    const recognitionConstructor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    const recognition = new recognitionConstructor();
    recognition.lang = LISTEN_LOCALE[this.language()];
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      this.query.set(event.results[0][0].transcript);
      this.listening.set(false);
      this.ask();
    };
    recognition.onerror = () => {
      this.listening.set(false);
      this.voiceNote.set('I couldn’t hear that. You can type instead, or try again.');
    };
    recognition.onend = () => this.listening.set(false);
    this.voiceNote.set('');
    this.listening.set(true);
    recognition.start();
  }

  useRecentQuestion(question: string): void {
    this.query.set(question);
    this.ask();
  }

  private fetchAnswer(request: { question?: string; topic?: CompanionTopic }, fallback: () => void): void {
    this.thinking.set(true);
    this.api
      .ask({
        ...request,
        language: this.language(),
        character: this.character().id,
        page: this.router.url.split('?')[0].slice(0, 100),
        country: this.locale.market(),
        signedIn: this.authState.isPatient(),
      })
      .subscribe({
        next: (a) => {
          this.thinking.set(false);
          this.say({ title: a.title, body: a.body, route: a.route, action: a.action, urgent: a.urgent });
        },
        error: () => {
          this.thinking.set(false);
          fallback();
        },
      });
  }

  private keywordAnswer(raw: string): void {
    const lang = this.language();
    const pcm = lang === 'pcm';
    const note = lang === 'en' || lang === 'pcm' ? undefined : this.englishOnlyNote();
    const topic = keywordTopic(raw);
    if (topic === 'tests' || topic === 'bills' || topic === 'specialist') return this.say(builtInExtra(topic, pcm), note);
    if (topic) return this.say(builtInTopic(topic, pcm), note);
    this.say(
      {
        title: pcm ? 'Make we find am together' : 'Let’s find it together',
        body: pcm
          ? 'I fit explain how to see doctor, check your health, your passport, your points, or My Hospital. Choose one below, or talk to person.'
          : 'I can explain seeing a doctor, checking your health, your passport, your points, or My Hospital. Choose one below, or talk to a person.',
        route: '/help',
        action: pcm ? 'Talk to person' : 'Talk to a person',
      },
      note,
    );
  }

  private englishOnlyNote(): string {
    return `I can only show this in English right now, not ${APP_LANGUAGES[this.language()].english}.`;
  }

  private say(answer: GuideAnswer, note?: string): void {
    const id = this.push({ from: 'guide', answer, note });
    if (this.preferences().autoSpeak) this.speak([answer.title, answer.body].filter(Boolean).join('. '), id, note ? 'en' : this.language());
  }

  private push(item: Omit<ThreadItem, 'id'>): number {
    const id = this.nextId++;
    this.thread.update((t) => [...t, { ...item, id }].slice(-8));
    return id;
  }

  /** Natural voice from SmartClinic first; a natural-sounding browser voice second; otherwise just text. */
  private speak(text: string, id: number, language: AppLanguage): void {
    this.stopSpeaking();
    this.voiceNote.set('');
    this.speakingId.set(id);
    const useServer = Boolean(this.capabilities().voices[language]);
    if (useServer) {
      this.voice.set('loading');
      this.api.speech(text, language, this.character().id, this.locale.market()).subscribe({
        next: (blob) => this.playBlob(blob, id),
        error: () => this.browserSpeak(text, id, language, true),
      });
      return;
    }
    this.browserSpeak(text, id, language);
  }

  private playBlob(blob: Blob, id: number): void {
    if (this.speakingId() !== id) return;
    try {
      this.audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(this.audioUrl);
      this.audio = audio;
      audio.onended = () => this.stopSpeaking();
      audio.onerror = () => this.stopSpeaking();
      this.voice.set('playing');
      void audio.play().catch(() => {
        this.stopSpeaking();
        this.voiceNote.set('Tap “Hear this” to listen.');
      });
    } catch {
      this.stopSpeaking();
    }
  }

  private browserSpeak(text: string, id: number, language: AppLanguage, serverFailed = false): void {
    const voice = this.naturalBrowserVoice(language);
    if (!voice) {
      this.stopSpeaking();
      this.voiceNote.set(
        serverFailed
          ? 'The voice is busy right now. The words are on screen — tap 🔊 to try again.'
          : `A natural ${APP_LANGUAGES[language].english} voice isn’t ready yet. The words are on screen.`,
      );
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.95;
    utterance.onend = () => this.stopSpeaking();
    utterance.onerror = () => this.stopSpeaking();
    this.speakingId.set(id);
    this.voice.set('playing');
    window.speechSynthesis.speak(utterance);
  }

  /** Only voices that sound human (neural / natural / online). Robotic system voices are skipped. */
  private naturalBrowserVoice(language: AppLanguage): SpeechSynthesisVoice | null {
    const prefix = BROWSER_VOICE_LOCALE[language];
    if (!prefix || typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const natural = /natural|neural|online|premium|enhanced/i;
    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(prefix.toLowerCase()) && natural.test(v.name));
    const local = voices.find((v) => /NG|GH|KE|RW|TZ/i.test(v.lang));
    return local ?? voices[0] ?? null;
  }

  private rememberQuestion(question: string): void {
    const next = [question, ...this.recentQuestions().filter((x) => x.toLowerCase() !== question.toLowerCase())].slice(0, 3);
    this.recentQuestions.set(next);
    try {
      localStorage.setItem('smartclinic-guide-recent-v1', JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  private loadRecentQuestions(): string[] {
    try {
      return JSON.parse(localStorage.getItem('smartclinic-guide-recent-v1') ?? '[]').slice(0, 3);
    } catch {
      return [];
    }
  }

  private updatePreferences(patch: Partial<GuidePreferences>): void {
    const next = { ...this.preferences(), ...patch };
    this.preferences.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  private loadPreferences(): GuidePreferences {
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

function isPageFormField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement) || target.closest('.guide')) return false;
  return target.matches('input:not([type=checkbox]):not([type=radio]), textarea, select');
}
