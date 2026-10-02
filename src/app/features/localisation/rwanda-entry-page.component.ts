import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RWANDA_LOCALES, RwandaLocale, rwandaLocale } from '../../core/config/market-context';
import { LocalePreferencesService } from '../../core/services/locale-preferences.service';

const COPY: Record<RwandaLocale, { title: string; description: string; existing: string; newAccount: string; principle: string }> = {
  en: {
    title: 'Healthcare connected around you.',
    description: 'Use one SmartClinic account for care, medicines, tests, providers and the programmes that apply to you in Rwanda.',
    existing: 'Sign in to SmartClinic', newAccount: 'Create my SmartClinic account',
    principle: 'Already use SmartClinic elsewhere? Sign in with the same email address or phone number. Do not create a second account.',
  },
  rw: {
    title: 'Ubuvuzi buhujwe kandi bugukikije.',
    description: 'Koresha konti imwe ya SmartClinic ku buvuzi, imiti, ibizamini, abaganga na gahunda zigukorera mu Rwanda.',
    existing: 'Injira muri SmartClinic', newAccount: 'Fungura konti ya SmartClinic',
    principle: 'Usanzwe ukoresha SmartClinic ahandi? Injira ukoresheje imeyili cyangwa nimero ya telefone usanzwe ukoresha. Ntufungure indi konti.',
  },
  fr: {
    title: 'Vos soins de santé, enfin connectés.',
    description: 'Utilisez un seul compte SmartClinic pour vos soins, médicaments, examens, prestataires et programmes au Rwanda.',
    existing: 'Se connecter à SmartClinic', newAccount: 'Créer mon compte SmartClinic',
    principle: 'Vous utilisez déjà SmartClinic ailleurs ? Connectez-vous avec la même adresse e-mail ou le même numéro. Ne créez pas un deuxième compte.',
  },
  sw: {
    title: 'Huduma zako za afya zimeunganishwa.',
    description: 'Tumia akaunti moja ya SmartClinic kwa huduma, dawa, vipimo, watoa huduma na programu zinazokufaa nchini Rwanda.',
    existing: 'Ingia kwenye SmartClinic', newAccount: 'Fungua akaunti ya SmartClinic',
    principle: 'Tayari unatumia SmartClinic mahali pengine? Ingia kwa barua pepe au nambari ileile. Usifungue akaunti ya pili.',
  },
};

@Component({
  selector: 'app-rwanda-entry-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-5 py-10 sm:px-8">
      <div class="mx-auto max-w-6xl">
        <header class="flex flex-wrap items-center justify-between gap-4">
          <a routerLink="/" class="font-black tracking-wide text-brand-900">SMARTCLINIC</a>
          <label class="font-bold text-slate-700">Language
            <select [value]="locale()" (change)="changeLanguage($any($event.target).value)" class="ml-2 min-h-11 rounded-xl border border-slate-300 bg-white px-3">
              @for (language of languages; track language.code) { <option [value]="language.code">{{ language.label }}</option> }
            </select>
          </label>
        </header>

        <section class="mt-10 grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p class="text-sm font-black uppercase tracking-[.18em] text-emerald-700">SmartClinic Rwanda</p>
            <h1 class="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">{{ copy().title }}</h1>
            <p class="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{{ copy().description }}</p>
            <div class="mt-7 flex flex-col gap-3 sm:flex-row">
              <a routerLink="/login" [queryParams]="authQueryParams()" class="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-700 px-6 py-3 font-bold text-white">{{ copy().existing }}</a>
              <a routerLink="/register" [queryParams]="authQueryParams()" class="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-300 bg-white px-6 py-3 font-bold text-brand-800">{{ copy().newAccount }}</a>
            </div>
            <a routerLink="/provider/register" [queryParams]="authQueryParams()" class="mt-4 inline-flex font-bold text-brand-800 underline">Join as a Rwanda healthcare provider →</a>
            <p class="mt-5 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-slate-700">{{ copy().principle }}</p>
          </div>

          <aside class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8" aria-labelledby="rwanda-market-title">
            <h2 id="rwanda-market-title" class="text-2xl font-black text-slate-950">Built for Rwanda. Connected globally.</h2>
            <dl class="mt-6 grid gap-4">
              <div class="rounded-2xl bg-slate-50 p-4"><dt class="text-sm text-slate-500">Account</dt><dd class="mt-1 font-bold">One global SmartClinic identity</dd></div>
              <div class="rounded-2xl bg-slate-50 p-4"><dt class="text-sm text-slate-500">Phone</dt><dd class="mt-1 font-bold">Rwanda +250 or your existing email</dd></div>
              <div class="rounded-2xl bg-slate-50 p-4"><dt class="text-sm text-slate-500">Local settings</dt><dd class="mt-1 font-bold">RWF · Africa/Kigali</dd></div>
              <div class="rounded-2xl bg-slate-50 p-4"><dt class="text-sm text-slate-500">Your choices</dt><dd class="mt-1 font-bold">Self-pay, insurance, employer, school and family relationships can coexist</dd></div>
            </dl>
            <p class="mt-5 text-sm leading-6 text-slate-500">Payment methods and participating providers will appear only when they are configured and verified for Rwanda.</p>
          </aside>
        </section>
      </div>
    </main>
  `,
})
export class RwandaEntryPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly preferences = inject(LocalePreferencesService);
  readonly languages = RWANDA_LOCALES;
  readonly locale = signal<RwandaLocale>(rwandaLocale(this.route.snapshot.queryParamMap.get('lang')));
  readonly copy = () => COPY[this.locale()];
  constructor() {
    // Opening the Rwanda page means Rwanda: remember it for the rest of the app.
    if (this.preferences.market() !== 'RW') this.preferences.choose('RW', this.locale());
  }
  readonly authQueryParams = () => ({ market: 'RW', lang: this.locale() });

  changeLanguage(value: string): void {
    this.locale.set(rwandaLocale(value));
    this.preferences.choose('RW', this.locale());
  }
}
