const logger = require('../logger');
const State = require('../state');

class ActiveRepeat {
  constructor(repeatService) {
    this.repeatService = repeatService;
    this.state = State.ACTIVE_REPEAT;
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
      reply = 'How many times would you like to repeat this message?';
      state = State.TIMES_REPEAT;
      this.repeatService.setActiveRepeat(false);
    } else if (messageService.negativeReply()) {
      // TODO what if they don't want to cancel?
      reply = 'Please send a new broadcast';
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

module.exports = ActiveRepeat;
