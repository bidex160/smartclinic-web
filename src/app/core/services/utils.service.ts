import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UtilsService {
  formatMoney(amount: string | null | undefined, currency: string | null | undefined): string {
    if (!amount || !currency) return '—';
    const value = Number(amount);
    if (!Number.isFinite(value)) return `${currency} ${amount}`;
    try { return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(value); }
    catch { return `${currency} ${amount}`; }
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';

    const [year, month, day] = date.slice(0, 10).split('-').map(Number);

    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(year, month - 1, day));
  }

  formatTime(time: string | null | undefined): string {
    if (!time) return '—';

    const [hours, minutes] = time.split(':').map(Number);

    const date = new Date(2000, 0, 1, hours, minutes);

    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  formatAppointment(
    date: string | null | undefined,
    from: string | null | undefined,
    to?: string | null,
  ): string {
    const dateLabel = this.formatDate(date);
    const fromLabel = this.formatTime(from);
    return to
      ? `${dateLabel} · ${fromLabel}–${this.formatTime(to)}`
      : `${dateLabel} · ${fromLabel}`;
  }
}
