import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { API_CONFIG } from '../../../core/config/api-config.token';
import { LocalePickerComponent } from './locale-picker.component';

describe('LocalePickerComponent', () => {
  afterEach(() => localStorage.clear());

  it('compact button opens the panel, and a wrong word can be reported with matching keys', () => {
    TestBed.configureTestingModule({ imports: [LocalePickerComponent], providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } }] });
    const f = TestBed.createComponent(LocalePickerComponent);
    f.componentRef.setInput('compact', true);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('[data-locale-button]')!.textContent).toContain('English');
    (el.querySelector('[data-locale-button]') as HTMLButtonElement).click();
    f.detectChanges();
    (el.querySelector('[data-report-open]') as HTMLButtonElement).click();
    f.detectChanges();
    const shown = el.querySelector('[data-report-shown]') as HTMLTextAreaElement;
    shown.value = 'More languages';
    shown.dispatchEvent(new Event('input'));
    f.detectChanges();
    (el.querySelector('[data-report-send]') as HTMLButtonElement).click();
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne('/api/v1/public/language-feedback');
    expect(req.request.body).toMatchObject({ language: 'en', shownText: 'More languages', catalogKeys: ['common.locale.more'] });
    req.flush({ id: 'x', received: true });
    f.detectChanges();
    expect(el.querySelector('[data-report-thanks]')).toBeTruthy();
    http.verify();
  });

  it('closes when tapping outside', () => {
    TestBed.configureTestingModule({ imports: [LocalePickerComponent], providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } }] });
    const f = TestBed.createComponent(LocalePickerComponent);
    f.detectChanges();
    f.componentInstance.open.set(true);
    f.detectChanges();
    document.body.click();
    expect(f.componentInstance.open()).toBe(false);
  });
});
