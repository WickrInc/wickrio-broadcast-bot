import logger from '../logger';
import State from '../state';

class ChooseSecurityGroups {
  constructor(broadcastService) {
    this.broadcastService = broadcastService;
    this.state = State.WHICH_GROUPS;
  }

  shouldExecute(messageService) {
    if (messageService.getCurrentState() === this.state) {
      return true;
    }
    return false;
  }

  execute(messageService) {
    let reply;
    let state;
    if (messageService.getMessage() === 'all') {
      this.broadcastService.setSecurityGroups([]);
      reply = 'Would you like to repeat this broadcast message?';
      state = State.ASK_REPEAT;
      return {
        reply,
        state,
      };
    }
    const groups = messageService.getMessage().split(/[^0-9]/);
    const securityGroupList = this.broadcastService.getAPISecurityGroups();
    let groupsToSend = [];
    let groupsString = '';
    let validInput = true;
    let badInput = '';
    groups.forEach((group) => {
      // TODO check for NaN
      // Subtract one for zero based indexing
      const index = parseInt(group, 10) - 1;
      if (index >= 0 && index < securityGroupList.length) {
        groupsToSend.push(securityGroupList[index].id);
        groupsString += `${securityGroupList[index].name}\n`;
      } else {
        validInput = false;
        badInput = index;
      }
    });
    if (validInput) {
      state = State.CONFIRM_GROUPS;
      reply = `Your message will send to the following security group(s):\n${groupsString}Continue?`;
      this.broadcastService.setSecurityGroups(groupsToSend);
    } else {
      state = State.WHICH_GROUPS;
      reply = `Invalid input: ${badInput} please enter the number(s) of the security group(s) or reply all to send the message to everyone in the network.`;
      groupsToSend = [];
    }
    return {
      reply,
      state,
    };
  }
}

export default ChooseSecurityGroups;
