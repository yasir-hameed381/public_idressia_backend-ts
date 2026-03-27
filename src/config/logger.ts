import winston from 'winston';

const transports: winston.transport[] = [];

if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  );
} else {
  transports.push(
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports,
});

const loggerWithStream = Object.assign(logger, {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    },
  },
});

export default loggerWithStream;
