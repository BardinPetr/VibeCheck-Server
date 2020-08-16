import objectScan from 'object-scan';
import { writeFileSync } from 'fs';
import setValue from 'set-value';

import { DB } from './firebase.js';

export const recurseApply = async (path, func, last) => {
  let cur;
  try {
    cur = await DB.collection(path).listDocuments();
  } catch {
    cur = [await DB.doc(path)];
  }
  await Promise.all(
    cur.map(async (i) => {
      if (!last) await func(i);
      await Promise.all(
        (await i.listCollections()).map((coll) => recurseApply(coll.path, func))
      );
      if (last) await func(i);
    })
  );
};

export const createTestDB = () =>
  recurseApply('/data', async (x) => {
    const coll = DB.collection(
      x.path.replace(x.id, '').replace('work', 'test')
    );
    await coll
      .doc(x.id === 'work' ? 'test' : x.id)
      .set((await x.get()).data() || {});
  });

export const deleteFull = async (path) => {
  await recurseApply(
    path,
    async (x) => {
      console.log(x.path);
      await x.delete();
    },
    true
  );
};

export const backupDb = async (path) => {
  let res = {};
  await recurseApply(path, async (x) => {
    let path = x.path.replace(/\//g, '.');
    console.log(path);
    setValue(res, path, (await x.get()).data() || {});
    setValue(res, `${path}.isRealDoc`, true);
  });
  return res;
};

export const restoreDb = async (path, data) => {
  const res = objectScan(['**'], {
    joined: true,
    filterFn: ({ value }) => value.isRealDoc,
  })(data);
  console.log(res);
};

(async () => {
  await createTestDB();

  const res = await backupDb('/data/work');
  // await restoreDb('/data/work', res);
})();
