import winston from 'winston';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

export const createLogger = (): winston.Logger => {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'wave-chat' },
    transports: [
      new winston.transports.File({
        filename: path.join(LOG_DIR, 'combined.log'),
        format: fileFormat,
      }),
      new winston.transports.File({
        filename: path.join(LOG_DIR, 'error.log'),
        level: 'error',
        format: fileFormat,
      }),
    ],
  });

  return logger;
};
