import Geocoder from 'node-geocoder';
import dotenv from 'dotenv';

dotenv.config();

const geocoder = Geocoder({
  provider: 'google',
  language: 'ru',
  apiKey: process.env.GEOCODER_APIKEY,
});

export const reverseGeocode = async (data) => {
  const res = (
    await geocoder.reverse({
      lat: data.oa,
      lon: data.ha,
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
  return { oa: res.latitude, ha: res.longitude };
};
