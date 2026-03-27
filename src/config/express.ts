import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from '../api/routes/v1';
import * as errorHandler from '../api/middlewares/error';
import vars from './vars';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

const corsOptions: cors.CorsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    const allowed = vars.corsOrigins;
    const isProduction = vars.env === 'production';
    if (isProduction && allowed.length === 0 && origin) {
      callback(null, false);
      return;
    }
    if (allowed.length === 0) {
      callback(null, true);
      return;
    }
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use('/api', routes);

app.get('/', (_req, res) => res.send('API running 🚀'));

app.use(errorHandler.converter);
app.use(errorHandler.notFound);
app.use(errorHandler.handler);

export default app;
