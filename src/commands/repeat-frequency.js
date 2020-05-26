const logger = require('../logger');
const State = require('../state');

class RepeatFrequency {
  constructor(repeatService) {
    this.repeatService = repeatService;
    this.state = State.REPEAT_FREQUENCY;
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
    // TODO more checks required
    if (messageService.isInt()) {
      this.repeatService.setFrequency(messageService.getMessage());
      this.repeatService.repeatMessage();
      reply = 'Broadcast message #1 in the process of being sent...';
      state = State.NONE;
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

module.exports = RepeatFrequency;
