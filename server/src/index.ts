import * as http from '@/http';
import { registerAuthRoutes } from '@/routes/auth';
import { registerCalendarRoutes } from '@/routes/calendar';
import { registerEmailVerificationRoutes } from '@/routes/emailVerification';
import { registerMainRoutes } from '@/routes/main';

http.get('/', (c) => c.text('ok'));

registerAuthRoutes();
registerEmailVerificationRoutes();
registerMainRoutes();
registerCalendarRoutes();
