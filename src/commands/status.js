import logger from '../logger';
import State from '../state';

class Status {
  constructor(genericService) {
    this.genericService = genericService;
    this.commandString = '/status';
  }

  shouldExecute(messageService) {
    if (messageService.getCommand() === this.commandString) {
      return true;
    }
    return false;
  }

  execute(messageService) {
    const currentEntries = this.genericService.getMessageEntries(messageService.getUserEmail());
    let reply;
    if (currentEntries.length < 1) {
      reply = 'There are no previous messages to display';
      return {
        reply,
        state: State.NONE,
      };
    }
    const length = Math.min(currentEntries.length, 5);
    let contentData;
    let index = 1;
    const messageList = [];
    let messageString = '';
    for (let i = 0; i < currentEntries.length; i += 1) {
      contentData = this.genericService.getMessageEntry(currentEntries[i].message_id);
      const contentParsed = JSON.parse(contentData);
      messageList.push(contentParsed.message);
      messageString += `(${index}) ${contentParsed.message}\n`;
      index += 1;
    }
    reply = `Here are the past ${length} broadcast message(s):\n`
      + `${messageString}`
      + 'Which message would you like to see the status of?';

    return {
      reply,
      state: State.WHICH_STATUS,
    };
  }
}

export default Status;
