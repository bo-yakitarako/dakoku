import { config } from 'dotenv';
import { Collection, Document, MongoClient } from 'mongodb';
import {} from '../../desktop/src/preload/dataType';

config();

const DB_USER = process.env.DB_USER ?? 'user';
const DB_PASSWORD = process.env.DB_PASSWORD ?? 'password';
const DB_HOST = process.env.DB_HOST ?? 'localhost';
const DB_PORT = process.env.DB_PORT ?? '27017';
const DB_NAME = process.env.DB_NAME ?? 'database';

const MONGO_URI = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}`;

export async function connect<T>(
  collectionName: string,
  callback: (collection: Collection<Document>) => Promise<T>,
) {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(collectionName);
    const result = await callback(collection);
    await client.close();
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
}
