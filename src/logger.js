import pino from 'pino'

const logger = pino({
  prettyPrint: {
    translateTime: true,
    ignore: 'pid,hostname',
  },
  level: 'debug',
})

export default logger
