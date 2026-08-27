export type Mode =
  | 'Builder'
  | 'Professional'
  | 'Individual'
  | 'Family'
  | 'Organisation'
  | 'Group';

export const MODES: Mode[] = [
  'Builder',
  'Professional',
  'Individual',
  'Family',
  'Organisation',
  'Group',
];

export const ROLES = [
  'Hub Builder',
  'Healthcare Provider Connector',
  'Community Mobiliser',
  'Operations & Patient Support',
  'Technology & Data',
  'Content & Creative Media',
  'Not sure yet — help me find my place',
];

export const COMMITMENTS = [
  'Invite six healthcare providers',
  'Identify a potential hub location',
  'Speak with a healthcare stakeholder',
  'Document a patient-access problem',
  'Introduce the Exchange to a community',
  'Contribute a technical or creative solution',
  'Other',
];

export const PROVIDER_TYPES = [
  'Private clinic',
  'General hospital',
  'Pharmacy',
  'Laboratory',
  'Radiology / diagnostic centre',
  'Hotel',
  'Other healthcare organisation',
];

export const GROUP_TYPES = [
  'Professional association',
  'School',
  'University / student community',
  'Mosque / faith community',
  'Community organisation',
  'Cooperative',
  'Workplace',
  'Other group',
];

export interface Entrance {
  mode: Mode;
  title: string;
  detail: string;
}

export const ENTRANCES: Entrance[] = [
  {
    mode: 'Builder',
    title: 'Become a Builder',
    detail: 'Invite, connect and grow the network',
  },
  {
    mode: 'Professional',
    title: 'Join as a Health Professional',
    detail: 'Build a verified profile, link your facility and receive requests',
  },
  {
    mode: 'Individual',
    title: 'Onboard an Individual',
    detail: 'Connect one person to the Exchange',
  },
  {
    mode: 'Family',
    title: 'Onboard a Family',
    detail: 'Register one household together',
  },
  {
    mode: 'Organisation',
    title: 'Register a Care Provider',
    detail: 'Clinic, hospital, pharmacy, lab or diagnostics',
  },
  {
    mode: 'Group',
    title: 'Onboard a Group',
    detail: 'Association, school, community or workplace',
  },
];

export interface RegistrationResult {
  referralCode: string;
  confirmationLink: string;
  registeredName: string;
  phone: string;
  email: string;
  referredByCode: string;
  referrerName: string;
  accountType: Mode;
}

export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
}
