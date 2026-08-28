import WickrIOBot from '../models/WickrIOBot'
import logger from './logger'

export const BROADCASTS_SENT = 'Broadcasts_Sent'
export const BROADCASTS_FAILED = 'Broadcasts_Failed'
export const BROADCAST_RECIPIENTS = 'Broadcast_Recipients'
export const BROADCASTS_TEXT = 'Broadcasts_Text'
export const BROADCASTS_FILE = 'Broadcasts_File'
export const BROADCASTS_VOICEMEMO = 'Broadcasts_VoiceMemo'
export const BROADCAST_QUEUE_DEPTH = 'Broadcast_Queue_Depth'
export const BROADCAST_QUEUE_DELAY_SEC = 'Broadcast_Queue_Delay_Sec'
export const REPEAT_SERIES_ABORTED = 'Repeat_Series_Aborted'
export const BROADCAST_ACKS = 'Broadcast_Acks'
export const BROADCAST_ABORTS = 'Broadcast_Aborts'
export const COMMANDS_REJECTED_UNAUTHORIZED = 'Commands_Rejected_Unauthorized'
export const COMMANDS_UNRECOGNIZED = 'Commands_Unrecognized'

function getAPI() {
  try {
    return WickrIOBot.getInstance().getWickrIOAddon()
  } catch (err) {
    return undefined
  }
}

export function incrementMetric(name, value = 1) {
  try {
    const api = getAPI()
    if (api === undefined) return
    Promise.resolve(api.cmdIncrementMetric(name, value)).catch(err => {
      logger.debug(`metrics: failed to increment ${name}: ${err}`)
    })
  } catch (err) {
    logger.debug(`metrics: failed to increment ${name}: ${err}`)
  }
}

export function setMetric(name, value) {
  try {
    const api = getAPI()
    if (api === undefined) return
    Promise.resolve(api.cmdSetMetric(name, value)).catch(err => {
      logger.debug(`metrics: failed to set ${name}: ${err}`)
    })
  } catch (err) {
    logger.debug(`metrics: failed to set ${name}: ${err}`)
  }
}
