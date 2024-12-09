import { config } from 'dotenv';
import { connect } from './db';

config();

connect('unchiburi', async (collection) => {
  await collection.insertOne({ timpo: 'でっかい', value: [2, 4, 10, 5] });
  const data = await collection.find().toArray();
  return data;
}).then((data) => console.log(data));
