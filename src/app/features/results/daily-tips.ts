/**
 * General wellness tips shown one per day on the patient home. Kept short,
 * non-diagnostic and broadly accepted public-health guidance. Seasonal tips
 * follow the Nigerian calendar: rainy season (Apr–Oct), harmattan (Nov–Feb).
 */
export type TipSeason = 'any' | 'rainy' | 'harmattan';

export interface DailyTip {
  readonly title: string;
  readonly body: string;
  readonly season: TipSeason;
}

export const DAILY_TIPS: readonly DailyTip[] = [
  { season: 'any', title: 'Know your numbers', body: 'Know your genotype and blood group. They matter in an emergency and when planning a family — ask for them at your next Health Check.' },
  { season: 'any', title: 'Silent pressure', body: 'High blood pressure often has no symptoms. Check it at least once a year, and more often after 40.' },
  { season: 'any', title: 'Walk after meals', body: 'A 10-minute walk after eating can help keep your blood sugar steadier.' },
  { season: 'any', title: 'Protect your sleep', body: 'Aim for 7–9 hours. Going to bed at the same time each night, even at weekends, makes it easier.' },
  { season: 'any', title: 'Clean hands', body: 'Wash with soap for 20 seconds before eating and after using the toilet. It prevents many common infections.' },
  { season: 'any', title: 'Half the plate', body: 'Fill half your plate with vegetables — ugu, efo, okra and garden egg all count.' },
  { season: 'any', title: 'Easy on the salt', body: 'Seasoning cubes and added salt add up quickly in soups and stews. Try a little less each week.' },
  { season: 'any', title: 'Water first', body: 'Choose water over soft drinks and sweetened malt drinks most days.' },
  { season: 'any', title: 'Medicines as prescribed', body: 'Take medicines exactly as prescribed, and finish an antibiotic course unless your clinician says otherwise.' },
  { season: 'any', title: 'No antibiotics without a prescription', body: 'Using antibiotics you don’t need makes future infections harder to treat. Ask a clinician first.' },
  { season: 'any', title: 'Stay protected', body: 'Adults need vaccines too — ask whether your tetanus and other boosters are up to date.' },
  { season: 'any', title: 'Screening saves lives', body: 'Ask your clinician which screenings suit your age — for example cervical, breast or prostate checks.' },
  { season: 'any', title: 'Move every hour', body: 'If you sit for long periods, stand up and stretch for a minute every hour.' },
  { season: 'any', title: 'You are not alone', body: 'Feeling low? Talking to someone you trust really helps. Reaching out is a strength.' },
  { season: 'any', title: 'Know the signs of stroke', body: 'Face drooping, Arm weakness, Speech difficulty — Time to get emergency help immediately.' },
  { season: 'any', title: 'Smile care', body: 'Brush twice a day with fluoride toothpaste and see a dentist once a year.' },
  { season: 'any', title: 'Drink less, drive never', body: 'Keep alcohol low, and never drink and drive.' },
  { season: 'rainy', title: 'Sleep under a net', body: 'Use an insecticide-treated net every night during the rainy season.' },
  { season: 'rainy', title: 'No standing water', body: 'Empty buckets, old tyres and blocked gutters around your home — mosquitoes breed in still water.' },
  { season: 'rainy', title: 'Test, don’t guess', body: 'A fever in rainy season should be tested for malaria before treatment.' },
  { season: 'rainy', title: 'Safe water', body: 'Boil or treat drinking water, especially after heavy rain or flooding.' },
  { season: 'harmattan', title: 'Drink through the dry', body: 'Harmattan air is very dry. Sip water through the day even when you don’t feel thirsty.' },
  { season: 'harmattan', title: 'Look after your skin', body: 'Moisturise skin and lips during harmattan to stop them cracking.' },
  { season: 'harmattan', title: 'Dust and breathing', body: 'Dusty days can trigger asthma. Keep your inhaler close and cover your nose and mouth outdoors.' },
  { season: 'harmattan', title: 'Cold mornings', body: 'Harmattan mornings get cold — keep children and older relatives warm.' },
];

export function seasonFor(date: Date): TipSeason {
  const month = date.getMonth(); // 0 = January
  if (month >= 3 && month <= 9) return 'rainy';
  if (month >= 10 || month <= 1) return 'harmattan';
  return 'any';
}

/** One stable tip per calendar day, drawn from general tips plus the current season's. */
export function tipForDate(date: Date): DailyTip {
  const season = seasonFor(date);
  const pool = DAILY_TIPS.filter((tip) => tip.season === 'any' || tip.season === season);
  const startOfYear = Date.UTC(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - startOfYear) / 86_400_000);
  return pool[dayOfYear % pool.length];
}
