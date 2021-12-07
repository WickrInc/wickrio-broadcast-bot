import winston from 'winston'
import 'winston-daily-rotate-file'
import { LOG_LEVEL, LOG_FILE_SIZE } from './constants'

const fs = require('fs')
const path = require('path')
const logDir = 'logs'
if (!fs.existsSync(logDir)) {
  // Create the directory if it does not exist
  fs.mkdirSync(logDir)
}

const level = LOG_LEVEL !== undefined ? LOG_LEVEL?.value : 'info'
const maxSize = LOG_FILE_SIZE !== undefined ? LOG_FILE_SIZE?.value : '10m'

// const myFormat = winston.format.printf(
//   ({ level, message, timestamp, stack }) => {
//     if (stack) {
//       return `${timestamp} ${level}: ${message}\n${stack}`
//     } else {
//       return `${timestamp} ${level}: ${message}`
//     }
//   }
// )

const rotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'log-%DATE%.output'),
  // datePattern: 'YYYY-MM-DD-HH',
  // maxSize: '1k',
  level,
  maxSize,
  maxFiles: '5',
})

const errorTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.output'),
  maxSize: '10m',
  maxFiles: '5',
  level: 'error',
})

// transport.on('rotate', function(oldFilename, newFilename) {
//   // do something fun
// })

const logConfiguration = {
  transports: [rotateTransport, errorTransport],
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DDTHH:mm:ss',
    }),
    winston.format.colorize(),
    winston.format.printf(info =>
      info.stack
        ? `${[info.timestamp]} ${info.level}: ${info.message}\n${info.stack}`
        : `${[info.timestamp]} ${info.level}: ${info.message}`
    )
  ),
}

const logger = winston.createLogger(logConfiguration)

export default logger
