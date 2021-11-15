import winston from 'winston'
import 'winston-daily-rotate-file'

// const { combine, timestamp, label, prettyPrint } = format

const rotateTransport = new winston.transports.DailyRotateFile({
  filename: 'broadcast-%DATE%-log.output',
  // datePattern: 'YYYY-MM-DD-HH',
  // maxSize: '1k',
  maxSize: '10m',
  maxFiles: '5',
})

const errorTransport = new winston.transports.DailyRotateFile({
  filename: 'broadcast-%DATE%-error.output',
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
      format: 'MMM-DD-YYYY HH:mm:ss',
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
