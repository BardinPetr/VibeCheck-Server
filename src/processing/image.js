import Axios from 'axios';
import { createWriteStream } from 'fs';
import { v5 as uuidv5 } from 'uuid';
import tmp from 'tmp';
import jimp from 'jimp';

import { Store } from '../lib/firebase.js';

export const downloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const file = tmp.fileSync().name;
    Axios({
      url,
      method: 'get',
      responseType: 'stream',
    })
      .then((img) =>
        img.data.pipe(createWriteStream(file).on('finish', () => resolve(file)))
      )
      .catch(reject);
  });
};

export const saveImage = async (url, size) => {
  const file = await downloadImage(url);

  const image = await jimp.read(file);
  await image.resize(size || 480, jimp.AUTO);
  await image.writeAsync(file);

  const id = `images/${uuidv5(url, uuidv5.URL)}.png`;
  await Store.upload(file, {
    destination: Store.file(id),
  });

  return id;
};
