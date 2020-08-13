import { DB, FB } from '../lib/firebase.js';

export const migrateUsers = async () => {
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
};

const SPBDistricts = [
  'Центральный район',
  'Петроградский район',
  'Адмиралтейский район',
];
export const migrateCities = async () => {
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

  await batch.commit();

  (await DB.collection('cities').get()).forEach(async (i) => {
    if (['Санкт-Петербург', 'Москва'].includes(i.id)) {
      await DB.collection(`/data/work/cities`).doc(i.id).set({
        coordinates: i.data().location,
      });
    }
  });
};

export const migrateVibes = async () => {
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
};

export const migratePlaces = async () => {
  (await DB.collection('/data/work/cities').get()).forEach(async (city) => {
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
    console.log(recommended);
    city.ref.update({
      recommended_places: FB.firestore.FieldValue.arrayUnion(...recommended),
    });
  });

  // const batch = DB.batch();

  // await batch.commit();
};

(async () => {
  await migrateUsers();
  await migrateCities();
  await migrateVibes();
  await migratePlaces();
})();
