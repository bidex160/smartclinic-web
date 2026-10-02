import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

interface Summary {
  builders: number;
  organizations: number;
  families: number;
  groups: number;
  peopleReached: number;
}

@Component({
  selector: 'app-network-pulse',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Shown only once real totals arrive, so visitors never see a box of empty dashes.
  template: `
    @if (data(); as summary) {
    <section class="network-pulse" aria-label="Live Smart Clinic Network activity">
      <div class="pulse-heading">
        <span class="pulse-dot"></span>
        <div>
          <strong>The network is moving</strong>
          <small>People, families and care providers connected through the community</small>
        </div>
      </div>
      <div class="pulse-stats">
        <article><b>{{ summary.builders }}</b><span>Builders</span></article>
        <article><b>{{ summary.organizations }}</b><span>Care providers</span></article>
        <article><b>{{ summary.families }}</b><span>Families</span></article>
        <article><b>{{ summary.groups }}</b><span>Groups</span></article>
        <article><b>{{ summary.peopleReached }}</b><span>People reached</span></article>
      </div>
    </section>
    }
  `,
styleUrls: ['./../../../join/join.component.scss'],
})
export class NetworkPulseComponent implements OnInit {
  private http = inject(HttpClient);
  data = signal<Summary | null>(null);

  ngOnInit(): void {
    this.http
      .get<{ summary: Summary }>('/api/leaderboard')
      .pipe(catchError(() => of(null)))
      .subscribe((body) => {
        if (body) this.data.set(body.summary);
      });
  }
}
