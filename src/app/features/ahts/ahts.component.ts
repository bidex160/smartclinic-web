import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

type PanelId = 'exchange' | 'invest' | 'country' | 'contact';

interface TeamMember {
  name: string;
  phone: string;
}

const TEAM: Record<string, TeamMember> = {
  are: { name: 'Dr Are', phone: '2348058033969' },
  valerie: { name: 'Dr Valerie', phone: '2347032873529' },
  jemima: { name: 'Jemima', phone: '2348052058628' },
};

@Component({
  selector: 'app-ahts',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './ahts.component.html',
})
export class Ahtsomponent {
  private readonly fb = inject(FormBuilder);

  readonly activePanel = signal<PanelId | null>(null);

  readonly partnerTags = [
    'Hospitals', 'HMOs', 'EMRs', 'Labs', 'Pharmacies', 'Schools', 'Employers',
  ];

  readonly interests = [
    'SmartClinic Exchange partnership',
    'Investment / funding',
    'Country expansion',
    'Hospital / provider connection',
    'HMO / payer integration',
    'Technology / EMR integration',
    'Other',
  ];

  readonly contacts = [
    { key: 'are', label: 'Dr Abdulhafiz Seun Are - CEO', greeting: 'Hello Dr Are', primary: true },
    { key: 'valerie', label: 'Dr Valerie - Strategy & Visibility', greeting: 'Hello Dr Valerie', primary: false },
    { key: 'jemima', label: 'Jemima - Projects & Partnerships', greeting: 'Hello Jemima', primary: false },
  ].map((c) => ({
    ...c,
    href: this.waLink(
      TEAM[c.key].phone,
      `${c.greeting}, we met at AHTS Kigali 2026. I would like to continue our Primed E-Health conversation.`,
    ),
  }));

  // ?ref=valerie in the URL decides who receives the lead. Defaults to Dr Are.
  readonly owner: TeamMember =
    TEAM[new URLSearchParams(window.location.search).get('ref') ?? 'are'] ?? TEAM['are'];

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    org: ['', Validators.required],
    role: [''],
    interest: ['', Validators.required],
    country: [''],
    contact: ['', Validators.required],
    note: [''],
  });

  show(id: PanelId): void {
    this.activePanel.set(id);
  }

  scrollToLead(): void {
    document.getElementById('lead')?.scrollIntoView({ behavior: 'smooth' });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const msg =
      `AHTS Kigali lead - introduced by ${this.owner.name}\n` +
      `Name: ${v.name}\n` +
      `Organisation: ${v.org}\n` +
      `Role: ${v.role || '-'}\n` +
      `Interest: ${v.interest}\n` +
      `Country: ${v.country || '-'}\n` +
      `Contact: ${v.contact}\n` +
      `Note: ${v.note || '-'}`;
    window.location.href = this.waLink(this.owner.phone, msg);
  }

  private waLink(phone: string, text: string): string {
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }
}