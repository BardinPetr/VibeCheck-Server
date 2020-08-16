import Geocoder from 'node-geocoder';
import dotenv from 'dotenv';

import { FB } from '../lib/firebase.js';

dotenv.config();

const geocoder = Geocoder({
  provider: 'google',
  language: 'ru',
  apiKey: process.env.GEOCODER_APIKEY,
});

export const reverseGeocode = async (data) => {
  const res = (
    await geocoder.reverse({
      lat: data.latitude,
      lon: data.longitude,
    })
  )[0];
  return {
    address: res.formattedAddress,
    district:
      res.administrativeLevels.level3long ||
      res.administrativeLevels.level2long,
  };
};

export const geocode = async (data) => {
  const res = (
    await geocoder.geocode({
      address: data,
    })
  )[0];
  return new FB.firestore.GeoPoint(res.latitude, res.longitude);
};

export const fixDistrictNaming = (data) =>
  data.toUpperCase().replace('РАЙОН', '').trim();
