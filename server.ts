// server.ts - Vercel serverless entry point
// eslint-disable-next-line no-global-assign
(Promise as unknown as typeof global.Promise) = require('bluebird') as typeof Promise;

import app from './src/config/express';

export default app;
