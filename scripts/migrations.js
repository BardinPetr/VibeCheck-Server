import C from 'chalk';
import { DB, FB } from '../src/lib/firebase.js';

// export const clearDB = () => deleteCollection('data', 100);

export const migrateUsers = async () => {
  console.log(C`{blue Started migrating users}`);

  const batchSize = 500;

  let old = await DB.collection('users').limit(batchSize).get();
  while (!old.empty) {
    const batch = DB.batch();

    old.forEach((doc) => {
      const data = doc.data();
      const name = `${data.last_name} ${data.first_name}`;
      batch.set(DB.collection('data/work/users').doc(doc.id), {
        nickname: name === ' ' ? doc.id : name,
        liked_places: data.liked_places,
        birthday: data.birthday,
        region: data.region,
      });
    });

    old = await DB.collection('users')
      .startAfter(old.docs[old.docs.length - 1])
      .limit(batchSize)
      .get();

    await batch.commit();
  }

  console.log(C`{green Finished migrating users}`);
};

const SPBDistricts = [
  'Центральный район',
  'Петроградский район',
  'Адмиралтейский район',
];
export const migrateCities = async () => {
  console.log(C`{blue Started migrating cities}`);
  const batch = DB.batch();

  (await DB.collection('districts').get()).forEach((i) => {
    batch.set(
      DB.collection(
        `/data/work/cities/${
          SPBDistricts.includes(i.id) ? 'Санкт-Петербург' : 'Москва'
        }/districts`
      ).doc(i.id),
      {
        coordinates: i.data().location,
      }
    );
  });

  (await DB.collection('cities').get()).forEach(async (i) => {
    if (['Санкт-Петербург', 'Москва'].includes(i.id)) {
      batch.set(DB.collection(`/data/work/cities`).doc(i.id), {
        coordinates: i.data().location,
      });
    }
  });

  await batch.commit();

  console.log(C`{green Finished migrating cities}`);
};

export const migrateVibes = async () => {
  console.log(C`{blue Started migrating vibes}`);

  const batch = DB.batch();

  const baseColl = DB.collection('/data/work/cities');
  const cities = (await DB.collection('/data/work/cities').get()).docs.map(
    (i) => i.id
  );

  (await DB.collection('vibes').get()).forEach((i) => {
    cities.forEach((c) => {
      batch.set(baseColl.doc(c).collection('vibes').doc(i.id), i.data());
    });
  });

  await batch.commit();

  console.log(C`{green Finished migrating vibes}`);
};

export const migrateRPlaces = async () => {
  console.log(C`{blue Started migrating recommended places}`);

  const run = (await DB.collection('/data/work/cities').get()).docs.map(
    async (city) => {
      const recommended = (
        await DB.collection('places')
          .where('recommended', '==', true)
          .where(
            'district',
            'in',
            (await city.ref.collection('districts').get()).docs.map((i) => i.id)
          )
          .get()
      ).docs.map((i) => i.id);
      await city.ref.set({
        recommended_places: recommended,
      });
    }
  );

  await Promise.all(run);

  console.log(C`{green Finished migrating recommended places}`);
};

export const migratePlaces = async () => {
  console.log(C`{blue Started migrating places}`);

  const batch = DB.batch();

  (await DB.collection('places').get()).docs.map((i) => {
    const data = i.data();
  });

  await batch.commit();

  console.log(C`{green Finished migrating places}`);
};

(async () => {
  // await clearDB();
  await migrateUsers();
  await migrateCities();
  await migrateVibes();
  await migrateRPlaces();
  // await migratePlaces();
})();
