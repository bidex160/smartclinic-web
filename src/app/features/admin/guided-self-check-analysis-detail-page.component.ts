import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SelfCheckAnalysis } from '../../core/models/guided-self-check-operations.model';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';
@Component({
  selector: 'app-guided-self-check-analysis-detail-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-5 py-8">
    <a routerLink="/admin/guided-self-check" class="font-bold text-brand-700">← AI Analysis</a>
    @if (loading()) {
      <p role="status" class="mt-6">Loading analysis…</p>
    } @else if (error()) {
      <p role="alert" class="mt-6 rounded-xl bg-red-50 p-5">{{ error() }}</p>
    } @else if (analysis(); as a) {
      <header class="mt-6">
        <p class="font-bold uppercase text-amber-800">
          Internal decision support · Classification remains AMBER
        </p>
        <h1 class="mt-2 break-all text-3xl font-bold">{{ a.reference }}</h1>
        <p>Self-Check {{ a.selfCheckReference }} · {{ label(a.status) }}</p>
      </header>
      @if (a.output; as o) {
        <section class="mt-6 rounded-2xl border bg-white p-6">
          <h2 class="text-xl font-bold">AI-generated decision support</h2>
          <p class="mt-3">{{ o.conciseSummary }}</p>
          <dl class="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt class="font-bold">Operational priority</dt>
              <dd>{{ label(o.suggestedOperationalPriority) }}</dd>
            </div>
            <div>
              <dt class="font-bold">Suggested action</dt>
              <dd>
                {{ o.recommendedAction ? label(o.recommendedAction) : 'No action suggested' }}
              </dd>
            </div>
            <div>
              <dt class="font-bold">Human review recommended</dt>
              <dd>{{ o.humanReviewSuggested ? 'Yes' : 'No' }}</dd>
            </div>
            <div>
              <dt class="font-bold">Escalation suggested</dt>
              <dd>{{ o.escalationSuggested ? 'Yes' : 'No' }}</dd>
            </div>
          </dl>
          @for (group of groups(o); track group.title) {
            <h3 class="mt-5 font-bold">{{ group.title }}</h3>
            @if (group.items.length) {
              <ul class="mt-2 list-disc pl-5">
                @for (item of group.items; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            } @else {
              <p class="text-slate-600">None returned.</p>
            }
          }
        </section>
      }
      @if (a.status === 'FAILED') {
        <p class="mt-5 rounded-xl bg-red-50 p-4">
          Analysis could not be completed. Safe failure:
          {{ label(a.failureCode || 'PROCESSING_ERROR') }}.
        </p>
      }
      @if (a.status === 'PENDING' || a.status === 'FAILED') {
        <button
          type="button"
          (click)="process()"
          [disabled]="busy()"
          class="mt-5 rounded-lg bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          {{ busy() ? 'Processing analysis…' : 'Process analysis' }}
        </button>
      }
      <p class="mt-5 text-sm text-slate-600">
        This analysis is not a diagnosis and does not change the governed AMBER classification.
      </p>
    }
  </main>`,
})
export class GuidedSelfCheckAnalysisDetailPageComponent {
  private api = inject(GuidedSelfCheckOperationsApiService);
  private ref = inject(ActivatedRoute).snapshot.paramMap.get('reference')!;
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  analysis = signal<SelfCheckAnalysis | null>(null);
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.api
      .analysis(this.ref)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => this.analysis.set(r),
        error: () => this.error.set('This analysis could not be loaded.'),
      });
  }
  process() {
    this.busy.set(true);
    this.api
      .processAnalysis(this.ref)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (r) => this.analysis.set(r),
        error: () => this.error.set('Analysis processing could not be completed.'),
      });
  }
  groups(o: NonNullable<SelfCheckAnalysis['output']>) {
    return [
      { title: 'Notable responses', items: o.notableResponses },
      { title: 'Inconsistencies', items: o.inconsistencies },
      { title: 'Information gaps', items: o.informationGaps },
    ];
  }
  label(v: string) {
    return v
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (x) => x.toUpperCase());
  }
}
