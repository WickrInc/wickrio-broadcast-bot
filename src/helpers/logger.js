// import { WickrLogger } from 'wickrio-bot-api'
const util = require('util')
const logger = require('wickrio-bot-api').logger

// const logger = new WickrLogger().getLogger()

console.log = function () {
  logger.info(util.format.apply(null, arguments))
}
console.error = function () {
  logger.error(util.format.apply(null, arguments))
}

export default logger
