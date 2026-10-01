import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import qrcode from 'qrcode-generator';

/**
 * Renders a QR code as inline SVG built from the module grid (no innerHTML),
 * so it works offline and needs no image service.
 */
@Component({
  selector: 'app-qr-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      role="img"
      [attr.aria-label]="label()"
      [attr.viewBox]="'0 0 ' + matrix().size + ' ' + matrix().size"
      shape-rendering="crispEdges"
      class="block h-full w-full"
    >
      <rect [attr.width]="matrix().size" [attr.height]="matrix().size" fill="#ffffff" />
      <path [attr.d]="matrix().path" fill="#1d1530" />
    </svg>
  `,
})
export class QrCodeComponent {
  readonly value = input.required<string>();
  readonly label = input('QR code');

  /** Quiet zone of 4 modules around the code, as the QR spec requires. */
  readonly matrix = computed(() => {
    const qr = qrcode(0, 'M');
    qr.addData(this.value());
    qr.make();
    const count = qr.getModuleCount();
    const margin = 4;
    let path = '';
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) path += `M${col + margin},${row + margin}h1v1h-1z`;
      }
    }
    return { size: count + margin * 2, path };
  });
}
