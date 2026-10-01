/**
 * Swap a missing photo for a fallback (or hide it) so optional team and
 * patient photography never renders as a broken image.
 */
export function useImageFallback(event: Event, fallback?: string): void {
  const image = event.target as HTMLImageElement | null;
  if (!image) return;
  if (fallback && !image.src.endsWith(fallback)) {
    image.src = fallback;
    return;
  }
  image.closest('[data-photo-slot]')?.setAttribute('hidden', '');
}
