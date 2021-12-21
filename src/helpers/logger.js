import { WickrLogger } from './constants'
const util = require('util')

const logger = WickrLogger.getLogger()
logger.info('Broadcast bot logged from bot-api')

console.log = function () {
  logger.info(util.format.apply(null, arguments))
}
console.error = function () {
  logger.error(util.format.apply(null, arguments))
}

export default logger
