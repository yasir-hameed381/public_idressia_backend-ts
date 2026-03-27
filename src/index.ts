// Load .env FIRST before any other imports
import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(process.cwd(), '.env') });

// make bluebird default Promise
// eslint-disable-next-line no-global-assign
(Promise as unknown as typeof global.Promise) = require('bluebird') as typeof Promise;

import vars from './config/vars';
import logger from './config/logger';
import app from './config/express';

if (!vars.jwtSecret && vars.env !== 'test') {
  logger.error('Fatal: JWT_SECRET environment variable is required.');
  process.exit(1);
}

app.listen(vars.port, () => {
  logger.info(`server started on port ${vars.port} (${vars.env})`);
});

export default app;
