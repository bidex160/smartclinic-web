import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

@Component({
  selector: 'app-auth-visual-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="auth-visual relative hidden min-h-[640px] overflow-hidden rounded-[2rem]
             bg-brand-700 p-10 text-white lg:flex lg:flex-col lg:justify-between"
    >
      <!-- Background glow -->
      <div class="pointer-events-none absolute inset-0">
        <div class="auth-orb auth-orb-one"></div>
        <div class="auth-orb auth-orb-two"></div>

        <div class="pulse-ring pulse-ring-one"></div>
        <div class="pulse-ring pulse-ring-two"></div>
        <div class="pulse-ring pulse-ring-three"></div>
      </div>

      <!-- Brand -->
      <div class="relative z-10">
        <a
          href="/"
          class="inline-flex items-center gap-3 text-lg font-bold text-white"
        >
          <span
            class="flex h-11 w-11 items-center justify-center rounded-2xl
                   bg-white/15 backdrop-blur"
          >
            <svg
              class="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 2v20M2 12h20" />
            </svg>
          </span>

          SmartClinic
        </a>
      </div>

      <!-- Main graphic -->
      <div class="relative z-10 mx-auto flex w-full max-w-md flex-1 items-center justify-center">
        <div
          class="relative flex h-64 w-64 items-center justify-center rounded-full
                 border border-white/20 bg-white/5 backdrop-blur"
        >
          <div
            class="flex h-36 w-36 items-center justify-center rounded-full
                   bg-white shadow-2xl"
          >
            <svg
              class="h-16 w-16 text-brand-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.45A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" />
              <path d="M8.5 12h2l1-2.5 2 5 1-2.5h2" />
            </svg>
          </div>

          <!-- Floating card -->
          <div
            class="floating-card floating-card-one absolute -right-16 top-8
                   rounded-2xl border border-white/20 bg-white/95 p-4 text-slate-900
                   shadow-xl backdrop-blur"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex h-9 w-9 items-center justify-center rounded-full bg-green-100"
              >
                <span class="h-2.5 w-2.5 rounded-full bg-green-500"></span>
              </span>

              <div>
                <p class="text-xs font-semibold text-slate-500">
                  Health journey
                </p>
                <p class="text-sm font-bold">
                  Connected
                </p>
              </div>
            </div>
          </div>

          <!-- Floating card -->
          <div
            class="floating-card floating-card-two absolute -left-20 bottom-6
                   rounded-2xl border border-white/20 bg-white/95 p-4 text-slate-900
                   shadow-xl"
          >
            <p class="text-xs font-semibold text-slate-500">
              Smart Health Check
            </p>

            <div class="mt-2 flex items-center gap-2">
              <div class="flex gap-1">
                <span class="h-2 w-2 rounded-full bg-brand-600"></span>
                <span class="h-2 w-2 rounded-full bg-brand-400"></span>
                <span class="h-2 w-2 rounded-full bg-brand-300"></span>
              </div>

              <span class="text-sm font-bold text-brand-700">
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Copy -->
      <div class="relative z-10 max-w-lg">
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-white/70">
          {{ eyebrow() }}
        </p>

        <h2 class="mt-3 text-4xl font-bold leading-tight">
          {{ title() }}
        </h2>

        <p class="mt-4 max-w-md leading-7 text-white/75">
          {{ description() }}
        </p>

        <div class="mt-7 flex flex-wrap gap-3 text-sm">
          <span class="auth-chip">
            Secure health access
          </span>

          <span class="auth-chip">
            Verified providers
          </span>

          <span class="auth-chip">
            One health journey
          </span>
        </div>
      </div>
    </section>
  `,
  styles: `
    .auth-visual {
      background:
        radial-gradient(circle at 20% 20%, rgba(255,255,255,.16), transparent 30%),
        radial-gradient(circle at 85% 75%, rgba(255,255,255,.10), transparent 28%),
        #7139d6;
    }

    .auth-chip {
      border: 1px solid rgba(255,255,255,.2);
      background: rgba(255,255,255,.09);
      border-radius: 999px;
      padding: .55rem .9rem;
      backdrop-filter: blur(12px);
    }

    .auth-orb {
      position: absolute;
      border-radius: 9999px;
      filter: blur(2px);
      opacity: .32;
      animation: drift 9s ease-in-out infinite;
    }

    .auth-orb-one {
      width: 240px;
      height: 240px;
      background: rgba(255,255,255,.18);
      top: -90px;
      right: -70px;
    }

    .auth-orb-two {
      width: 190px;
      height: 190px;
      background: rgba(255,255,255,.12);
      bottom: 100px;
      left: -80px;
      animation-delay: -4s;
    }

    .pulse-ring {
      position: absolute;
      width: 240px;
      height: 240px;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 9999px;
      left: 50%;
      top: 45%;
      transform: translate(-50%, -50%);
      animation: pulse-ring 4.5s ease-out infinite;
    }

    .pulse-ring-two {
      animation-delay: 1.5s;
    }

    .pulse-ring-three {
      animation-delay: 3s;
    }

    .floating-card {
      animation: float 5s ease-in-out infinite;
    }

    .floating-card-two {
      animation-delay: -2.3s;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }

      50% {
        transform: translateY(-10px);
      }
    }

    @keyframes pulse-ring {
      0% {
        transform: translate(-50%, -50%) scale(.7);
        opacity: .5;
      }

      70% {
        opacity: .08;
      }

      100% {
        transform: translate(-50%, -50%) scale(1.7);
        opacity: 0;
      }
    }

    @keyframes drift {
      0%, 100% {
        transform: translate(0, 0);
      }

      50% {
        transform: translate(-18px, 24px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .auth-orb,
      .pulse-ring,
      .floating-card {
        animation: none !important;
      }
    }
  `,
})
export class AuthVisualPanelComponent {
  readonly eyebrow = input('SmartClinic');

  readonly title = input(
    'Healthcare access built around you.',
  );

  readonly description = input(
    'Connect your health journey, care providers and clinical information in one secure place.',
  );
}