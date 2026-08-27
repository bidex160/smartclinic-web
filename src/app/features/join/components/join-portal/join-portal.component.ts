import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';

type JoinMode =
  | 'Builder'
  | 'Professional'
  | 'Individual'
  | 'Clinic'
  | 'Laboratory'
  | 'Pharmacy'
  | 'Family'
  | 'Group';

type ReferralStatus =
  | 'idle'
  | 'present';

interface JoinEntrance {
  mode: JoinMode;
  title: string;
  detail: string;
}

@Component({
  selector: 'app-join-portal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './join-portal.component.html',
})
export class JoinPortalComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = signal<JoinMode>('Builder');

  readonly referralCode = signal('');
  readonly referralStatus = signal<ReferralStatus>('idle');

  readonly entrances: JoinEntrance[] = [
    {
      mode: 'Builder',
      title: 'Become a Builder',
      detail:
        'Create your SmartClinic account and start connecting verified people and providers.',
    },
    {
      mode: 'Professional',
      title: 'Join as a Health Professional',
      detail:
        'Create a provider profile, complete verification and prepare to receive care requests.',
    },
    {
      mode: 'Individual',
      title: 'Join SmartClinic',
      detail:
        'Create your patient account and access SmartClinic services.',
    },
    {
      mode: 'Clinic',
      title: 'Register a Clinic',
      detail:
        'Create a clinic provider account and begin SmartClinic verification.',
    },
    {
      mode: 'Laboratory',
      title: 'Register a Laboratory',
      detail:
        'Connect a laboratory or diagnostic provider to the SmartClinic network.',
    },
    {
      mode: 'Pharmacy',
      title: 'Register a Pharmacy',
      detail:
        'Connect a pharmacy to the SmartClinic provider network.',
    },
    {
      mode: 'Family',
      title: 'Connect a Family',
      detail:
        'Start with an individual SmartClinic account. Family connections will use existing patient identities.',
    },
    {
      mode: 'Group',
      title: 'Connect a Community',
      detail:
        'Introduce a school, workplace, association or community without creating a separate account system.',
    },
  ];

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const ref = (
          params.get('ref') ??
          params.get('invite') ??
          ''
        )
          .trim()
          .toUpperCase();

        this.referralCode.set(ref);
        this.referralStatus.set(ref ? 'present' : 'idle');

        const requestedType = params.get('type');

        switch (requestedType) {
          case 'Professional':
            this.mode.set('Professional');
            break;

          case 'CLINIC':
            this.mode.set('Clinic');
            break;

          case 'LABORATORY':
            this.mode.set('Laboratory');
            break;

          case 'PHARMACY':
            this.mode.set('Pharmacy');
            break;
        }
      });
  }

  selectMode(mode: JoinMode): void {
    this.mode.set(mode);
  }

  continue(): void {
    switch (this.mode()) {
      case 'Builder':
      case 'Individual':
        this.goToPatientRegistration();
        return;

      case 'Professional':
        this.goToProviderRegistration();
        return;

      case 'Clinic':
        this.goToProviderRegistration('CLINIC');
        return;

      case 'Laboratory':
        this.goToProviderRegistration('LABORATORY');
        return;

      case 'Pharmacy':
        this.goToProviderRegistration('PHARMACY');
        return;

      case 'Family':
        this.goToPatientRegistration();
        return;

      case 'Group':
        // Until SmartClinic has a proper organisation/community
        // onboarding model, do not invent one here.
        return;
    }
  }

  private goToPatientRegistration(): void {
    const queryParams: Record<string, string> = {};

    if (this.referralCode()) {
      queryParams['ref'] = this.referralCode();
    }

    void this.router.navigate(
      ['/register'],
      { queryParams },
    );
  }

  private goToProviderRegistration(
    target?: 'CLINIC' | 'LABORATORY' | 'PHARMACY',
  ): void {
    const queryParams: Record<string, string> = {};

    if (this.referralCode()) {
      queryParams['ref'] = this.referralCode();
    }

    if (target) {
      queryParams['type'] = target;
    }

    void this.router.navigate(
      ['/provider/register'],
      { queryParams },
    );
  }

  get continueLabel(): string {
    switch (this.mode()) {
      case 'Builder':
        return 'Create my SmartClinic account →';

      case 'Individual':
        return 'Create patient account →';

      case 'Professional':
        return 'Start provider registration →';

      case 'Clinic':
        return 'Register clinic →';

      case 'Laboratory':
        return 'Register laboratory →';

      case 'Pharmacy':
        return 'Register pharmacy →';

      case 'Family':
        return 'Start with a patient account →';

      case 'Group':
        return 'Community onboarding coming soon';
    }
  }

  get disabled(): boolean {
    return this.mode() === 'Group';
  }
}