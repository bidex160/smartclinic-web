import { Injectable } from '@angular/core';
import {
  Country,
  // State,
  // City,
  ICountry,
  IState,
  ICity,
} from 'country-state-city';
import { STATE_CITIES } from './state-and-cities';

@Injectable({
  providedIn: 'root',
})
export class LocationDataService {
  statesandcities = STATE_CITIES
  getCountries(): ICountry[] {
    return Country.getAllCountries().filter((country) => country.isoCode === 'NG');
  }

  getStates(countryCode: string): IState[] {
    if (!countryCode) {
      return [];
    }

    return this.statesandcities.map((state) => ({
      name: state.name,
      isoCode: state.name,
      countryCode: 'NG',
    }));
  }

  getCities(
    countryCode: string,
    stateCode: string,
  ): ICity[] {
    if (!countryCode || !stateCode) {
      return [];
    }


    return this.statesandcities.find((state) => state.name === stateCode)?.cities.map((city) => ({
      name: city,
      stateCode: stateCode,
      countryCode: countryCode,
    })) ?? [];

    // return City.getCitiesOfState(
    //   countryCode,
    //   stateCode,
    // );
  }
}