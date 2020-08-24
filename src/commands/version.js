import State from '../state'

class Version {
  constructor({ messageService }) {
    this.messageService = messageService
  }

  shouldExecute() {
    if (this.messageService.getCommand() === '/version') {
      return true
    }
    return false
  }

  execute() {
    let json = require('../../node_modules/wickrio_addon/package.json')
    const addonVersion = json.version
    json = require('../../node_modules/wickrio-bot-api/package.json')
    const apiVersion = json.version
    const reply =
      `*Versions*\nIntegration: ${process.env.npm_package_version}\n` +
      `WickrIO Addon: ${addonVersion}\n` +
      `WickrIO API: ${apiVersion}`
    return {
      reply,
      state: State.NONE,
    }
  }
}

// if (command === '/version') {
//   const obj = Version.execute()
//   WickrIOAPI.cmdSendRoomMessage(vGroupID, obj.reply)
//   user.currentState = State.NONE
//   return
// }

export default Version
