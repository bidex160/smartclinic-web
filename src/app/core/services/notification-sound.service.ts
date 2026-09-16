import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
    private readonly audio = new Audio('/assets/audio/notification.wav');

  constructor() {
    this.audio.preload = 'auto';
    this.audio.volume = 0.75;
  }

  async play(): Promise<void> {
    try {
      this.audio.currentTime = 0;
      await this.audio.play();
    } catch {
      // Sound must never break notification delivery/state.
    }
  }
  // play(): void {
  //   try {
  //     const AudioContextConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  //     if (!AudioContextConstructor) return;
  //     const context = new AudioContextConstructor();
  //     const oscillator = context.createOscillator();
  //     const gain = context.createGain();
  //     oscillator.frequency.value = 660;
  //     gain.gain.setValueAtTime(0.025, context.currentTime);
  //     gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
  //     oscillator.connect(gain).connect(context.destination);
  //     oscillator.start();
  //     oscillator.stop(context.currentTime + 0.16);
  //     oscillator.addEventListener('ended', () => void context.close().catch(() => undefined), { once: true });
  //   } catch {
  //     console.error('browser couldnt play')
  //     // Browser autoplay restrictions must never affect notification delivery.
  //   }
  // }
}
