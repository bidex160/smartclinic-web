import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
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
    reference: 'SC-CMSG-2',
    senderType: 'PROVIDER' as const,
    body: '<b>Literal</b>',
    createdAt: '2026-08-28T10:02:00Z',
    readAt: null,
    attachments: [],
  };
  const oldest = {
    reference: 'SC-CMSG-1',
    senderType: 'PATIENT' as const,
    body: 'Hello',
    createdAt: '2026-08-28T10:01:00Z',
    readAt: '2026-08-28T10:02:00Z',
    attachments: [],
  };
  async function setup(options: { unavailable?: boolean; scope?: 'patient' | 'provider'; writable?: boolean; items?: readonly unknown[]; upload?: Subject<ReturnType<typeof attachment>> } = {}) {
    TestBed.resetTestingModule();
    const api = {
      getChat: vi.fn(() => (options.unavailable ? throwError(() => ({ status: 409 })) : of({ ...detail, canSendMessages: options.writable ?? true }))),
      getMessages: vi.fn(() =>
        of({ items: options.items ?? [newest, oldest], page: 1, limit: 30, total: 2, totalPages: 1 }),
      ),
      sendMessage: vi.fn(() => of({})),
      markRead: vi.fn(() => of(void 0)),
      uploadPatientAttachment: vi.fn(() => options.upload ?? of(attachment())),
      uploadProviderAttachment: vi.fn(() => options.upload ?? of(attachment())),
      getPatientAttachmentAccess: vi.fn(() => of({ url: 'https://files.example.test/image', expiresAt: '2026-08-29T11:00:00Z' })),
      getProviderAttachmentAccess: vi.fn(() => of({ url: 'https://files.example.test/image', expiresAt: '2026-08-29T11:00:00Z' })),
    };
    await TestBed.configureTestingModule({
      imports: [CareChatPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { chatScope: options.scope ?? 'patient' },
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
    expect(api.sendMessage).toHaveBeenCalledWith('patient', 'SC-CARE-1', 'Hi there', []);
    const unavailable = await setup({ unavailable: true });
    expect(unavailable.fixture.nativeElement.textContent).toContain('Chat becomes available');
  });
  it.each(['patient', 'provider'] as const)('shows attachment controls for writable %s chat and uses its upload route', async scope => { const { fixture, api } = await setup({ scope }); expect(fixture.nativeElement.textContent).toContain('Attach file'); const file = new File(['%PDF-'], 'report.pdf', { type: 'application/pdf' }); fixture.componentInstance.selectFile(fileEvent(file)); expect(scope === 'patient' ? api.uploadPatientAttachment : api.uploadProviderAttachment).toHaveBeenCalledWith('SC-CARE-1', file); expect(fixture.componentInstance.pendingAttachments()[0].reference).toBe('SC-CMA-1'); });
  it('hides composer and attachment upload for read-only chat', async () => { const { fixture } = await setup({ writable: false }); expect(fixture.nativeElement.textContent).toContain('read-only'); expect(fixture.nativeElement.textContent).not.toContain('Attach file'); });
  it('validates MIME, size and maximum five attachments', async () => { const { fixture, api } = await setup(); const c = fixture.componentInstance; c.selectFile(fileEvent({ name: 'bad.txt', type: 'text/plain', size: 1 })); expect(c.error()).toContain('PDF'); c.selectFile(fileEvent({ name: 'large.pdf', type: 'application/pdf', size: 15 * 1024 * 1024 + 1 })); expect(c.error()).toContain('15 MB'); c.pendingAttachments.set(Array.from({ length: 5 }, (_, index) => attachment(`SC-CMA-${index}`))); c.selectFile(fileEvent(new File(['x'], 'sixth.png', { type: 'image/png' }))); expect(c.error()).toContain('at most 5'); expect(api.uploadPatientAttachment).not.toHaveBeenCalled(); });
  it('disables send while uploading and supports attachment-only plus text-and-attachment payloads', async () => { const upload = new Subject<ReturnType<typeof attachment>>(); const { fixture, api } = await setup({ upload }); const c = fixture.componentInstance; c.selectFile(fileEvent(new File(['x'], 'image.png', { type: 'image/png' }))); expect(c.canSend()).toBe(false); upload.next(attachment()); upload.complete(); expect(c.canSend()).toBe(true); c.send(); expect(api.sendMessage).toHaveBeenCalledWith('patient', 'SC-CARE-1', undefined, ['SC-CMA-1']); expect(c.pendingAttachments()).toEqual([]); c.pendingAttachments.set([attachment()]); c.composer.controls.body.setValue(' Details '); c.send(); expect(api.sendMessage).toHaveBeenLastCalledWith('patient', 'SC-CARE-1', 'Details', ['SC-CMA-1']); });
  it('preserves body and pending references on send failure and allows local removal', async () => { const { fixture, api } = await setup(); api.sendMessage.mockReturnValue(throwError(() => ({ status: 500 }))); const c = fixture.componentInstance; c.pendingAttachments.set([attachment()]); c.composer.controls.body.setValue('Keep me'); c.send(); expect(c.pendingAttachments()).toHaveLength(1); expect(c.composer.controls.body.value).toBe('Keep me'); c.removePending('SC-CMA-1'); expect(c.pendingAttachments()).toEqual([]); });
  it('renders attachment-only messages and requests scope-specific preview access on demand', async () => { const message = { ...newest, body: null, attachments: [attachment()] }; const patient = await setup({ items: [message] }); expect(patient.fixture.nativeElement.textContent).toContain('scan.png'); expect(patient.api.getPatientAttachmentAccess).not.toHaveBeenCalled(); patient.fixture.componentInstance.viewAttachment(message, attachment()); expect(patient.api.getPatientAttachmentAccess).toHaveBeenCalledWith('SC-CARE-1', 'SC-CMSG-2', 'SC-CMA-1'); expect(patient.fixture.componentInstance.previewUrl()).toBeTruthy(); patient.fixture.componentInstance.closePreview(); expect(patient.fixture.componentInstance.previewUrl()).toBeNull(); const provider = await setup({ scope: 'provider', items: [message] }); provider.fixture.componentInstance.viewAttachment(message, attachment()); expect(provider.api.getProviderAttachmentAccess).toHaveBeenCalled(); });
  it('keeps attachment metadata through older-message pagination', async () => { const { fixture, api } = await setup(); const older = { ...oldest, reference: 'SC-CMSG-OLD', body: null, attachments: [attachment('SC-CMA-OLD')] }; api.getMessages.mockReturnValue(of({ items: [older], page: 2, limit: 30, total: 3, totalPages: 2 })); const c = fixture.componentInstance; c.totalPages.set(2); c.loadEarlier(); fixture.detectChanges(); expect(c.messages().some(message => message.reference === 'SC-CMSG-OLD' && message.attachments.length === 1)).toBe(true); expect(fixture.nativeElement.textContent).toContain('scan.png'); });
  it('polling fetches only chat/message metadata and never attachment access URLs', async () => { vi.useFakeTimers(); try { const { api } = await setup(); await vi.advanceTimersByTimeAsync(5000); expect(api.getMessages.mock.calls.length).toBeGreaterThan(1); expect(api.getPatientAttachmentAccess).not.toHaveBeenCalled(); expect(api.getProviderAttachmentAccess).not.toHaveBeenCalled(); } finally { vi.useRealTimers(); } });
});
function attachment(reference = 'SC-CMA-1') { return { reference, originalName: 'scan.png', mimeType: 'image/png', sizeBytes: 1024, resourceType: 'IMAGE' as const, createdAt: '2026-08-29T10:00:00Z', expiresAt: '2026-08-30T10:00:00Z' }; }
function fileEvent(file: Pick<File, 'name' | 'type' | 'size'>): Event { return { target: { files: [file] } } as unknown as Event; }
