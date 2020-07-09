import logger from '../logger';
import State from '../state';
import Groups from './groups';

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
    let groupsToSend = [];
    const securityGroupList = Groups.getSGs(messageService.userEmail, this.broadcastService.getAPISecurityGroups());
    if (messageService.getMessage() === 'all') {
      if (securityGroupList.length === 0) {
        reply = 'You do not have access to any security groups and cannot broadcast a message.';
        state = State.NONE;
        return {
          reply,
          state,
        };
      }
      for (let i = 0; i < securityGroupList.length; i += 1) {
        groupsToSend.push(securityGroupList[i].id);
      }
      this.broadcastService.setSecurityGroups(groupsToSend);
      reply = 'Would you like to repeat this broadcast message?';
      state = State.ASK_REPEAT;
      return {
        reply,
        state,
      };
    }
    const groups = messageService.getMessage().split(/[^0-9]/);
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
