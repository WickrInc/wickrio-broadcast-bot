
pino = require('pino');

const logger = pino({
  prettyPrint: {
    translateTime: true,
    ignore: 'pid,hostname',
  },
  level: 'debug',
});

const trace = function (data) {
  logger.trace(data);
};

const debug = function (data) {
  logger.debug(data);
};

const info = function (data) {
  logger.info(data);
};

const warn = function (data) {
  logger.warn(data);
};

const error = function (data) {
  logger.error(data);
};

const fatal = function (data) {
  logger.fatal(data);
};

module.exports = {
  trace,
  debug,
  info,
  warn,
  error,
  fatal,
};
