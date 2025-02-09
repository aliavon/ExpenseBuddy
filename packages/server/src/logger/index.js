const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: isDev ? 'debug' : 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
}, isDev ? pino.transport({
  target: 'pino-pretty',
  options: { colorize: true }
}) : undefined);

module.exports = logger;
