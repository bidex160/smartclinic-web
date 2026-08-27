import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  CITY_SUGGESTIONS,
  COUNTRIES,
  GHANA_REGIONS,
  NIGERIA_STATES,
} from './location-fields.data';

@Component({
  selector: 'app-location-fields',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label>
      Country *
      <select
        name="country"
        required
        [value]="country()"
        (change)="country.set($any($event.target).value)"
      >
        @for (c of countries; track c) {
          <option>{{ c }}</option>
        }
      </select>
    </label>

    @if (regions(); as r) {
      <label>
        State / Region *
        <select name="state" required>
          <option value="" disabled selected>Select state or region</option>
          @for (x of r; track x) {
            <option>{{ x }}</option>
          }
        </select>
      </label>
    } @else {
      <label>
        State / Region *
        <input name="state" placeholder="Enter your state or region" required />
      </label>
    }

    <label>
      City *
      <input
        name="city"
        list="city-options"
        placeholder="Start typing your city"
        autocomplete="address-level2"
        required
      />
      <datalist id="city-options">
        @for (c of cities; track c) {
          <option [value]="c"></option>
        }
      </datalist>
    </label>
  `,
})
export class LocationFieldsComponent {
  readonly countries = COUNTRIES;
  readonly cities = CITY_SUGGESTIONS;

  country = signal('Nigeria');

  regions = computed(() => {
    const c = this.country();
    if (c === 'Nigeria') return NIGERIA_STATES;
    if (c === 'Ghana') return GHANA_REGIONS;
    return null;
  });
}
