import { Injectable } from '@angular/core';
import {
  Country,
  State,
  City,
  ICountry,
  IState,
  ICity,
} from 'country-state-city';

@Injectable({
  providedIn: 'root',
})
export class LocationDataService {
  getCountries(): ICountry[] {
    return Country.getAllCountries();
  }

  getStates(countryCode: string): IState[] {
    if (!countryCode) {
      return [];
    }

    return State.getStatesOfCountry(countryCode);
  }

  getCities(
    countryCode: string,
    stateCode: string,
  ): ICity[] {
    if (!countryCode || !stateCode) {
      return [];
    }

    return City.getCitiesOfState(
      countryCode,
      stateCode,
    );
  }
}