import jsonwebtoken from 'jsonwebtoken'
import {
  // bot,
  // WickrUser,
  client_auth_codes,
  // logger,
  BOT_AUTH_TOKEN,
  WEBAPP_HOST,
  WEBAPP_PORT,
  HTTPS_CHOICE,
  BOT_PORT,
  // WICKRIO_BOT_NAME,
  // VERIFY_USERS,
  // WickrIOAPI,
  WEB_APPLICATION,
  WEB_INTERFACE,
  // REST_APPLICATION,
} from '../helpers/constants'
const webAppEnabled =
  WEB_APPLICATION?.value === 'yes' && WEB_INTERFACE?.value === 'yes'

class Panel {
  constructor({ apiService, messageService }) {
    this.apiService = apiService
    this.messageService = messageService
    this.commandString = '/panel'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    if (webAppEnabled) {
      // Check if this user is an administrator
      // var adminUser = bot.myAdmins.getAdmin(userEmail);
      // scope this conditional down further

      // if (adminUser === undefined) {
      //   let reply = 'Access denied: ' + userEmail + ' is not authorized to broadcast!'
      //   var sMessage = APIService.sendRoomMessage(vGroupID, reply);
      //   return
      // }
      let host
      if (HTTPS_CHOICE.value === 'yes') {
        host = `https://${WEBAPP_HOST.value}`
      } else {
        host = `http://${WEBAPP_HOST.value}`
      }
      // generate a random auth code for the session
      // store it in a globally accessable store

      const random = this.generateRandomString(24)
      client_auth_codes[this.messageService.userEmail] = random
      // bot rest requests need basic base64 auth header - broadcast web needs the token from this bot. token is provided through URL - security risk
      // send token in url, used for calls to receive data, send messages
      const token = jsonwebtoken.sign(
        {
          email: this.messageService.userEmail,
          session: random,
          host: host,
          port: BOT_PORT.value,
        },
        BOT_AUTH_TOKEN.value,
        { expiresIn: '1800s' }
      )

      const reply = encodeURI(`${host}:${WEBAPP_PORT.value}/?token=${token}`)
      this.apiService.sendRoomMessage(this.messageService.vGroupID, reply)
    } else if (!webAppEnabled) {
      this.apiService.sendRoomMessage(
        this.messageService.vGroupID,
        'panel disabled, to use panel, run /configure to enable web and app interfaces!'
      )
    }
  }

  generateRandomString(length) {
    let text = ''
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    for (let i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    return text
  }
}
export default Panel
