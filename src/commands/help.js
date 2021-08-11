import State from '../state'
import {
  bot,
  logger,
  WEB_APPLICATION,
  WEB_INTERFACE,
  BOT_MAPS,
  BROADCAST_ENABLED,
  ADMINISTRATORS_CHOICE,
} from '../helpers/constants'
const webAppEnabled =
  WEB_APPLICATION?.value === 'yes' && WEB_INTERFACE?.value === 'yes'
const mapEnabled = BOT_MAPS?.value === 'yes'

class Help {
  constructor({ apiService, messageService }) {
    this.apiService = apiService
    this.messageService = messageService
    this.commandString = '/help'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    const { isAdmin, vGroupID } = this.messageService

    let webAppString = ''
    let broadcastString = ''
    if (webAppEnabled) {
      webAppString =
        '*Web App Commands*\n' +
        '/panel : displays the link and token to the web user interface\n\n'
    }
    let mapString = ''
    if (mapEnabled) {
      mapString =
        '*Map Commands*\n' +
        '/map : Get a picture of everybody who responded to a broadcast with their location\n\n'
    }
    if (BROADCAST_ENABLED?.value === 'no') {
      if (webAppEnabled) {
        webAppString =
          '*Web App Commands*\n' +
          '/panel: is currently disabled as it only supports broadcasts which are currently disabled\n\n'
      }
    } else {
      broadcastString =
        'To broadcast a voice memo - Click the microphone button and send a voice memo to the bot\n'
    }
    let helpString =
      '*Messages Commands*\n' +
      '/start : Start a new broadcast\n' +
      '/ack : To acknowledge a broadcast message\n' +
      '/status : To get the status of a broadcast message\n' +
      '/report : To get a CSV file with the status of each user for a broadcast message\n' +
      '/abort : To abort a broadcast or send that is currently in progress\n\n' +
      'To broadcast a file - Click the + sign and share the file with the bot\n' +
      `${broadcastString}` +
      `${webAppString}` +
      `${mapString}` +
      '%{adminHelpHeader}' +
      '*Other Commands*\n' +
      '/help : Show help information\n' +
      '/version : Get the version of the integration\n' +
      '/cancel : To cancel the last operation and enter a new command\n' +
      '/files : To get a list of saved files available for the /send command\n' +
      '/delete : To delete a file that was previously made available for the /send command'

    if (ADMINISTRATORS_CHOICE.value === 'no' || isAdmin) {
      // console.log({ helpString, vGroupID })

      if (ADMINISTRATORS_CHOICE.value === 'yes') {
        let adminHelp = '*Admin Commands*\n' + '%{adminHelp}\n'
        adminHelp = bot.getAdminHelp(adminHelp)
        helpString = helpString.replace('%{adminHelpHeader}', adminHelp)
      } else {
        helpString = helpString.replace('%{adminHelpHeader}', '')
      }

      const sMessage = this.apiService.sendRoomMessage(vGroupID, helpString)
      logger.debug(sMessage)
      // user.currentState = State.NONE
      return
    } else {
      helpString = helpString.replace('%{adminHelpHeader}', '')
    }
    return {
      reply: helpString,
      state: State.NONE,
    }
  }
}

module.exports = Help
