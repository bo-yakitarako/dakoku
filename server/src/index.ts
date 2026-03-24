import * as http from '@/http';
import { registerAuthRoutes } from '@/routes/auth';
import { registerCalendarRoutes } from '@/routes/calendar';
import { registerEmailVerificationRoutes } from '@/routes/emailVerification';
import { registerMainRoutes } from '@/routes/main';
import { registerPasswordResetRoutes } from '@/routes/passwordReset';

http.get('/', (c) => c.text('ok'));

registerAuthRoutes();
registerEmailVerificationRoutes();
registerPasswordResetRoutes();
registerMainRoutes();
registerCalendarRoutes();
