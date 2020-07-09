import State from '../state';
import { logger } from '../helpers/constants';
import Groups from './groups';

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
    this.broadcastService.setTTL('');
    this.broadcastService.setBOR('');
    this.broadcastService.setSentByFlag(true);
    logger.debug(`Here are all the things: ${messageService.getArgument()}`);
    const securityGroupList = Groups.getSGs(messageService.userEmail, this.broadcastService.getAPISecurityGroups());
    let reply;
    let state;
    if (securityGroupList.length === 0) {
      reply = 'You have no access to any security groups and cannot broadcast a message.';
      state = State.NONE;
    } else {
      reply = 'Would you like to ask the recipients for an acknowledgement?';
      state = State.ASK_FOR_ACK;
      // TODO check for undefined??
      if (
        messageService.getArgument() === undefined
      || messageService.getArgument() === ''
      || messageService.getArgument().length === 0
      ) {
        reply = 'Must have a message or file to broadcast, Usage: /broadcast <message>';
        state = State.NONE;
      }
    }
    return {
      reply,
      state,
    };
  }
}

export default InitializeBroadcast;
