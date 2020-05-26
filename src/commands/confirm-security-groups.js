const logger = require('../logger');
const State = require('../state');

class ConfirmSecurityGroups {
  constructor(broadcastService) {
    this.broadcastService = broadcastService;
    this.state = State.CONFIRM_GROUPS;
  }

  shouldExecute(messageService) {
    if (messageService.getCurrentState() === this.state) {
      return true;
    }
    return false;
  }

  execute(messageService) {
    let state;
    let reply;
    // TODO account for voice/ file message
    if (messageService.affirmativeReply()) {
      reply = 'Would you like to repeat this broadcast message?';
      state = State.ASK_REPEAT;
    } else if (messageService.negativeReply()) {
      reply = 'Please enter the number(s) of the security group(s) or reply all to send the message to everyone in the network.';
      state = State.WHICH_GROUPS;
    } else {
      reply = 'Invalid input, please reply with (y)es or (n)o';
      state = this.state;
    }
    const obj = {
      reply,
      state,
    };
    return obj;
  }
}

module.exports = ConfirmSecurityGroups;
