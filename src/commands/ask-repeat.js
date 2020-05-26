const logger = require('../logger');
const State = require('../state');

class AskRepeat {
  constructor(repeatService, broadcastService) {
    this.repeatService = repeatService;
    this.broadcastService = broadcastService;
    this.state = State.ASK_REPEAT;
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
    if (messageService.affirmativeReply()) {
      if (this.repeatService.getActiveRepeat()) {
        reply = 'There is already a repeating broadcast active, would you like to cancel it?';
        state = State.ACTIVE_REPEAT;
      } else {
        this.repeatService.setActiveRepeat(true);
        reply = 'How many times would you like to repeat this message?';
        state = State.TIMES_REPEAT;
      }
    } else if (messageService.negativeReply()) {
      reply = this.broadcastService.broadcastMessage();
      // TODO fix this!
      state = State.NONE;
    } else {
      reply = 'Invalid input, please reply with (y)es or (n)o';
      state = State.ASK_REPEAT;
    }
    return {
      reply,
      state,
    };
  }
}

module.exports = AskRepeat;
