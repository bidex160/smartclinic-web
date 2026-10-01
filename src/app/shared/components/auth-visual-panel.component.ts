import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-visual-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="relative hidden min-h-[640px] overflow-hidden rounded-[2rem] bg-ink p-10 text-white shadow-lift lg:flex lg:flex-col"
    >
      <div class="sc-motif pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true"></div>
      <div class="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand-600/40 blur-3xl" aria-hidden="true"></div>
      <div class="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-ochre-500/20 blur-3xl" aria-hidden="true"></div>
      <div class="sc-weave absolute inset-x-0 top-0" aria-hidden="true"></div>

      <a href="/" class="relative inline-flex w-fit items-center gap-3">
        <img src="/assets/fanvico.png" alt="" class="size-10 rounded-xl bg-white/10 p-1" />
        <span>
          <strong class="font-display block text-lg font-semibold leading-tight">SmartClinic</strong>
          <small class="block text-[10px] font-semibold uppercase tracking-[0.18em] text-ochre-300">Health companion</small>
        </span>
      </a>

      <div class="relative my-8 flex flex-1 items-center justify-center">
        <div class="relative h-72 w-56 overflow-hidden rounded-t-[7rem] rounded-b-[1.5rem] bg-brand-800 ring-1 ring-white/10">
          <img src="/assets/valerie.jpeg" alt="" class="h-full w-full object-cover object-[50%_18%]" />
          <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/70 to-transparent"></div>
        </div>

        <div class="absolute left-[calc(50%-15.5rem)] top-10 w-44 rounded-2xl bg-white/95 p-3 text-ink shadow-lift" aria-hidden="true">
          <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-ochre-700">Today</p>
          <p class="mt-1 text-sm font-semibold">Drink a glass of water</p>
          <p class="text-xs text-ink-muted">09:00 · Hydration</p>
        </div>

        <div class="absolute bottom-8 right-[calc(50%-15.5rem)] w-44 rounded-2xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur" aria-hidden="true">
          <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">Health Passport</p>
          <p class="mt-1 text-sm font-semibold">Shared only when you choose</p>
        </div>
      </div>

      <div class="relative">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ochre-300">{{ eyebrow() }}</p>
        <h2 class="font-display mt-3 max-w-md text-[2.4rem] font-semibold leading-[1.08]">{{ title() }}</h2>
        <p class="mt-4 max-w-md leading-7 text-white/70">{{ description() }}</p>
        <ul class="mt-6 flex flex-wrap gap-2 text-sm text-white/80">
          <li class="rounded-full bg-white/[0.07] px-3.5 py-1.5 ring-1 ring-white/15">Secure health access</li>
          <li class="rounded-full bg-white/[0.07] px-3.5 py-1.5 ring-1 ring-white/15">Verified providers</li>
          <li class="rounded-full bg-white/[0.07] px-3.5 py-1.5 ring-1 ring-white/15">One health journey</li>
        </ul>
      </div>
    </section>
  `,
})
export class AuthVisualPanelComponent {
  readonly eyebrow = input('SmartClinic');

  readonly title = input('Healthcare access built around you.');

  readonly description = input(
    'Connect your health journey, care providers and clinical information in one secure place.',
  );
}
