import { config } from 'dotenv';
import { User } from './db/User';

config();

(async () => {
  const user = await User.create({ name: 'ぼかすか', email: 'komanechi@baka.com' });
  console.log(user.createdAt.format('YYYY-MM-DD HH:mm:ss'));
})();
