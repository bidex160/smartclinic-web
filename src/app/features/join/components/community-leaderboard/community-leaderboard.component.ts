import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

interface Row {
  name: string;
  points: number;
  city?: string;
  country?: string;
  level?: string;
  referrals?: number;
  peopleReached?: number;
}

interface LeaderboardData {
  people: Row[];
  cities: Row[];
  countries: Row[];
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
  private http = inject(HttpClient);

  data = signal<LeaderboardData | null>(null);
  tab = signal<Tab>('cities');

  ngOnInit(): void {
    this.http
      .get<LeaderboardData>('/api/leaderboard')
      .pipe(catchError(() => of(null)))
      .subscribe((body) => {
        if (body) this.data.set(body);
      });
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
  }

  get rows(): Row[] {
    const d = this.data();
    return d ? d[this.tab()] : [];
  }
}
