import { CareDeliveryMode } from '../../core/models/find-care.model';

export function careDeliveryModeLabel(mode: CareDeliveryMode): string {
  return (
    {
      IN_PERSON: 'In person',
      VIRTUAL: 'Virtual care',
      HOME_VISIT: 'Home visit',
    } satisfies Record<CareDeliveryMode, string>
  )[mode];
}
