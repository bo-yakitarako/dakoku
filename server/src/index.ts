import { bootstrapDatabase } from '@/db/bootstrap';
import * as http from '@/http';
import { registerAuthRoutes } from '@/routes/auth';
import { registerCalendarRoutes } from '@/routes/calendar';
import { registerMainRoutes } from '@/routes/main';

bootstrapDatabase();

http.get('/', (c) => c.text('ok'));

registerAuthRoutes();
registerMainRoutes();
registerCalendarRoutes();
