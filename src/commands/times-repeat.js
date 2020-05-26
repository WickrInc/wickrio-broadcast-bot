const logger = require('../logger');
const State = require('../state');

class TimesRepeat {
  constructor(repeatService) {
    this.repeatService = repeatService;
    this.state = State.TIMES_REPEAT;
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
    if (messageService.isInt()) {
      this.repeatService.setRepeats(parseInt(messageService.getMessage(), 10));
      this.repeatService.setVGroupID(messageService.getVGroupID());
      reply = 'How often would you like to repeat this message?(every 5, 10 or 15 minutes)';
      state = State.REPEAT_FREQUENCY;
    } else {
      reply = 'Invalid Input, please enter a number value.';
      state = State.TIMES_REPEAT;
    }
    return {
      reply,
      state,
    };
  }
}

module.exports = TimesRepeat;
