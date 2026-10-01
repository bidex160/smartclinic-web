import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, output, signal, viewChild } from '@angular/core';

interface DetectedBarcode {
  readonly rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike;

/** True where the browser can read QR codes from the camera (Chrome and Edge on Android, ChromeOS, Windows). */
export function qrScanningSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;
}

/**
 * Reads one QR code from the back camera, then stops the camera. Nothing is
 * recorded or uploaded; frames are only checked on this device.
 */
@Component({
  selector: 'app-qr-scanner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden rounded-2xl bg-ink">
      <video #video class="aspect-square w-full object-cover" playsinline muted></video>
      <div class="pointer-events-none absolute inset-8 rounded-2xl ring-4 ring-white/80" aria-hidden="true"></div>
    </div>
    <p role="status" class="mt-2 text-sm text-ink-muted">{{ message() }}</p>
    <button type="button" (click)="stop(); cancelled.emit()" class="mt-2 min-h-11 rounded-full px-4 text-sm font-semibold text-ink-soft hover:bg-sand-50">Cancel</button>
  `,
})
export class QrScannerComponent implements OnDestroy {
  readonly scanned = output<string>();
  readonly cancelled = output<void>();
  readonly message = signal('Point the camera at the QR code on the patient’s SmartClinic card.');
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    queueMicrotask(() => void this.start());
  }

  async start(): Promise<void> {
    if (!qrScanningSupported()) {
      this.message.set('This browser can’t scan QR codes. Type the SmartClinic ID instead.');
      return;
    }
    try {
      const Detector = (window as unknown as { BarcodeDetector: BarcodeDetectorConstructor }).BarcodeDetector;
      const detector = new Detector({ formats: ['qr_code'] });
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      const video = this.video().nativeElement;
      video.srcObject = this.stream;
      await video.play();
      const tick = async () => {
        try {
          const [code] = await detector.detect(video);
          if (code?.rawValue) {
            this.stop();
            this.scanned.emit(code.rawValue);
            return;
          }
        } catch {
          // A frame that can't be read; try the next one.
        }
        this.timer = setTimeout(tick, 250);
      };
      void tick();
    } catch {
      this.stop();
      this.message.set('The camera isn’t available. Allow camera access, or type the SmartClinic ID instead.');
    }
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
