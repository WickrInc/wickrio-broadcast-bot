import State from '../state'
import { bot, logger, WEB_APPLICATION } from '../helpers/constants'
const webAppEnabled = WEB_APPLICATION.value === 'yes'

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

    let webAppString
    if (webAppEnabled) {
      webAppString =
        '*Web App Commands*\n' +
        '/panel : displays the link and token to the web user interface\n\n'
    }
    let helpString =
      '*Messages Commands*\n' +
      '/send <Message> : To send a broadcast message to a given file of user hashes or usernames\n' +
      'To save a file of usernames or user hashes - Click the + sign and share the file with the bot\n' +
      '/broadcast <Message> : To send a broadcast message to the network or security groups\n' +
      'To broadcast a file - Click the + sign and share the file with the bot\n' +
      'To broadcast a voice memo - Click the microphone button and send a voice memo to the bot\n' +
      '/ack : To acknowledge a broadcast message \n' +
      '/messages : To get a text file of all the messages sent to the bot\n' +
      '/status : To get the status of a broadcast message\n' +
      '/report : To get a CSV file with the status of each user for a broadcast message\n' +
      '/abort : To abort a broadcast or send that is currently in progress\n\n' +
      `${webAppString}` +
      '*Admin Commands*\n' +
      '%{adminHelp}\n' +
      '*Other Commands*\n' +
      '/help : Show help information\n' +
      '/version : Get the version of the integration\n' +
      '/cancel : To cancel the last operation and enter a new command\n' +
      '/files : To get a list of saved files available for the /send command\n' +
      '/delete : To delete a file that was previously made available for the /send command\n'

    if (isAdmin) {
      // console.log({ helpString, vGroupID })
      helpString = bot.getAdminHelp(helpString)
      const sMessage = this.apiService.sendRoomMessage(vGroupID, helpString)
      logger.debug(sMessage)
      // user.currentState = State.NONE
      return
    }
    return {
      reply: helpString,
      state: State.NONE,
    }
  }
}

export default Help
