import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ReferralsApiService } from '../../../../core/services/referrals-api.service';


interface PersonLeaderboardRow {
  name: string;
  points: number;
  city: string | null;
  country: string | null;
  level: string | null;
  referrals: number;
}

interface AggregateLeaderboardRow {
  name: string;
  points: number;
}

interface LeaderboardData {
  people: PersonLeaderboardRow[];
  cities: AggregateLeaderboardRow[];
  countries: AggregateLeaderboardRow[];
}

type Tab = 'people' | 'cities' | 'countries';

@Component({
  selector: 'app-community-leaderboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './community-leaderboard.component.html',
})
export class CommunityLeaderboardComponent implements OnInit {
  private readonly referralApi = inject(ReferralsApiService);

  readonly data = signal<LeaderboardData | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly tab = signal<Tab>('cities');

  readonly rows = computed(() => {
    const data = this.data();

    if (!data) {
      return [];
    }

    return data[this.tab()];
  });

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.loading.set(true);
    this.error.set(false);

    this.referralApi.getPublicLeaderboard().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
  }

  personLocation(row: PersonLeaderboardRow): string | null {
    const values = [row.city, this.countryName(row.country)].filter(
      (value): value is string => Boolean(value),
    );

    return values.length ? values.join(', ') : null;
  }

  personMeta(row: PersonLeaderboardRow): string {
    const values: string[] = [];

    const location = this.personLocation(row);

    if (location) {
      values.push(location);
    }

    if (row.level) {
      values.push(row.level);
    }

    values.push(
      `${row.referrals} qualified ${
        row.referrals === 1 ? 'referral' : 'referrals'
      }`,
    );

    return values.join(' · ');
  }

  countryName(code: string | null): string | null {
    if (!code) {
      return null;
    }

    const names: Record<string, string> = {
      NG: 'Nigeria',
      GH: 'Ghana',
    };

    return names[code.toUpperCase()] ?? code.toUpperCase();
  }
}