import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CareChatApiService } from '../../core/services/care-chat-api.service';
import { CareChatPageComponent } from './care-chat-page.component';

describe('CareChatPageComponent', () => {
  const detail = {
    reference: 'SC-CHAT-1',
    careRequestReference: 'SC-CARE-1',
    canSendMessages: true,
    unreadCount: 1,
    participant: { displayName: 'Prime Clinic' },
    service: { code: 'GENERAL', name: 'General consultation' },
    appointment: null,
  };
  const newest = {
    senderType: 'PROVIDER',
    body: '<b>Literal</b>',
    createdAt: '2026-08-28T10:02:00Z',
    readAt: null,
  };
  const oldest = {
    senderType: 'PATIENT',
    body: 'Hello',
    createdAt: '2026-08-28T10:01:00Z',
    readAt: '2026-08-28T10:02:00Z',
  };
  async function setup(unavailable = false) {
    TestBed.resetTestingModule();
    const api = {
      getChat: vi.fn(() => (unavailable ? throwError(() => ({ status: 409 })) : of(detail))),
      getMessages: vi.fn(() =>
        of({ items: [newest, oldest], page: 1, limit: 30, total: 2, totalPages: 1 }),
      ),
      sendMessage: vi.fn(() => of({})),
      markRead: vi.fn(() => of(void 0)),
    };
    await TestBed.configureTestingModule({
      imports: [CareChatPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { chatScope: 'patient' },
              paramMap: convertToParamMap({ reference: 'SC-CARE-1' }),
            },
          },
        },
        { provide: CareChatApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CareChatPageComponent);
    fixture.detectChanges();
    return { fixture, api };
  }
  it('loads chronologically, escapes message text, labels patient messages as You, and marks read', async () => {
    const { fixture, api } = await setup();
    const text = fixture.nativeElement.textContent;
    expect(text.indexOf('Hello')).toBeLessThan(text.indexOf('<b>Literal</b>'));
    expect(fixture.nativeElement.querySelector('b')?.textContent).not.toBe('Literal');
    expect(text).toContain('You');
    expect(text).toContain('Prime Clinic');
    expect(api.markRead).toHaveBeenCalled();
  });
  it('sends only trimmed body and preserves unavailable state', async () => {
    const { fixture, api } = await setup();
    fixture.componentInstance.composer.controls.body.setValue('  Hi there  ');
    fixture.componentInstance.send();
    expect(api.sendMessage).toHaveBeenCalledWith('patient', 'SC-CARE-1', 'Hi there');
    const unavailable = await setup(true);
    expect(unavailable.fixture.nativeElement.textContent).toContain('Chat becomes available');
  });
});
