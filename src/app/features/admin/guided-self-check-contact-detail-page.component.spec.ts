import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GuidedSelfCheckOperationsApiService } from '../../core/services/guided-self-check-operations-api.service';
import { GuidedSelfCheckContactDetailPageComponent } from './guided-self-check-contact-detail-page.component';

describe('GuidedSelfCheckContactDetailPageComponent', () => {
  const detail = {
    reference: 'SC-GSCW-ONE',
    selfCheckReference: 'SC-GSC-ONE',
    priority: 'ROUTINE',
    status: 'IN_PROGRESS',
    patient: {
      reference: 'SC-PAT-ONE',
      displayName: 'Ada Patient',
      phone: '+2348012345678',
      email: 'ada@example.test',
    },
    createdAt: '2026-08-31T09:00:00Z',
    acknowledgedAt: '2026-08-31T09:05:00Z',
    startedAt: '2026-08-31T09:10:00Z',
    completedAt: null,
    outcome: null,
    operationalNote: null,
  } as const;

  async function setup(value: any = detail) {
    const api = {
      contactWorkItem: vi.fn(() => of(value)),
      acknowledgeContact: vi.fn(() => of({})),
      startContact: vi.fn(() => of({})),
      completeContact: vi.fn(() => of({})),
      cancelContact: vi.fn(() => of({})),
    };
    await TestBed.configureTestingModule({
      imports: [GuidedSelfCheckContactDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'SC-GSCW-ONE' } } },
        },
        { provide: GuidedSelfCheckOperationsApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GuidedSelfCheckContactDetailPageComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, api };
  }

  it('keeps authorized patient contact data on detail and renders constrained outcomes', async () => {
    const { fixture } = await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ada Patient');
    expect(text).toContain('+2348012345678');
    expect(text).toContain('ada@example.test');
    expect(text).toContain('Unable to reach patient');
    expect(text).not.toContain('Provider');
    expect(fixture.nativeElement.querySelector('a[href^="tel:"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it('uses purposeful operational copy and sends only exact completion fields', async () => {
    const { fixture, component, api } = await setup();
    const textarea = fixture.nativeElement.querySelector('textarea[name="note"]');
    expect(textarea.placeholder).toBe('Add a brief operational note about the contact attempt');
    expect(fixture.nativeElement.textContent).toContain('not diagnosis or treatment advice');
    component.outcome = 'PATIENT_DECLINED';
    component.note = 'Patient declined this contact';
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.complete();
    expect(api.completeContact).toHaveBeenCalledWith(
      'SC-GSCW-ONE',
      'PATIENT_DECLINED',
      'Patient declined this contact',
    );
  });

  it('shows only lifecycle-appropriate controls', async () => {
    const pending = await setup({ ...detail, status: 'PENDING' });
    expect(pending.fixture.nativeElement.textContent).toContain('Acknowledge');
    expect(pending.fixture.nativeElement.textContent).not.toContain('Start Contact');

    TestBed.resetTestingModule();
    const completed = await setup({
      ...detail,
      status: 'COMPLETED',
      outcome: 'CONTACTED',
      completedAt: '2026-08-31T10:00:00Z',
    });
    const text = completed.fixture.nativeElement.textContent;
    expect(text).toContain('Outcome: Contacted');
    expect(text).not.toContain('Complete Contact');
    expect(text).not.toContain('Cancel contact work');
  });
});
