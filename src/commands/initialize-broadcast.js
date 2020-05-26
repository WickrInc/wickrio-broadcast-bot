const logger = require('../logger');
const State = require('../state');

class InitializeBroadcast {
  constructor(broadcastService) {
    this.broadcastService = broadcastService;
    this.commandString = '/broadcast';
  }

  shouldExecute(messageService) {
    if (messageService.getCommand() === this.commandString) {
      return true;
    }
    return false;
  }

  execute(messageService) {
    this.broadcastService.setMessage(messageService.getArgument());
    this.broadcastService.setUserEmail(messageService.getUserEmail());
    this.broadcastService.setVGroupID(messageService.getVGroupID());
    let reply = 'Would you like to ask the recipients for an acknowledgement?';
    let state = State.ASK_FOR_ACK;
    // TODO check for undefined??
    if (!messageService.getArgument() || messageService.getArgument().length === 0) {
      reply = 'Must have a message or file to broadcast, Usage: /broadcast <message>';
      state = State.NONE;
    }
    return {
      reply,
      state,
    };
  }
}

module.exports = InitializeBroadcast;
