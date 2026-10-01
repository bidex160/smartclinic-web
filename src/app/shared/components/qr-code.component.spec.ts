import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { QrCodeComponent } from './qr-code.component';

describe('QrCodeComponent', () => {
  it('draws a scannable QR grid with a quiet zone for the given value', () => {
    const fixture = TestBed.createComponent(QrCodeComponent);
    fixture.componentRef.setInput('value', 'SCP-VFBJ-YD9J');
    fixture.componentRef.setInput('label', 'SmartClinic ID SCP-VFBJ-YD9J');
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    // Version 1 (21x21 modules) plus a 4-module margin on each side.
    expect(svg.getAttribute('viewBox')).toBe('0 0 29 29');
    expect(svg.getAttribute('aria-label')).toBe('SmartClinic ID SCP-VFBJ-YD9J');
    const d = svg.querySelector('path')!.getAttribute('d')!;
    // The top-left finder pattern starts at the quiet-zone corner.
    expect(d.startsWith('M4,4h1v1h-1z')).toBe(true);
    expect(d.split('M').length - 1).toBeGreaterThan(150);
  });
});
