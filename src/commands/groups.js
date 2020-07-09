/*
  This class is used to let the user know what security groups
  they can send a broadcast message to and to provide functions
  that limit an admin's security group access.
*/

import State from '../state';
import { logger } from '../helpers/constants';
import APIService from '../services/api-service';

class Groups {
  static shouldExecute(messageService) {
    if (messageService.getCommand() === '/groups') {
      return true;
    }
    return false;
  }

  /*

    Execute gets the userEmail, gathers the security groups user has access to and then
    prints to the user.

    1. Check to see if username is in the JSON array
    2. Check to see if there are no security groups for that user
    3. Get the security groups for that user then return
    3a. If 'ALL' return all security groups

  */

  static execute(messageService) {
    let procjson = require('../../processes.json');
    const username = messageService.userEmail;
    let reply = '';
    let i;
    // 1.
    if (!(procjson.apps[0].env.tokens.SECURITY_GROUP_ACCESS.hasOwnProperty(username))) {
      reply += 'Error user was not found.';
    } else {
    //  2.
      const size = procjson.apps[0].env.tokens.SECURITY_GROUP_ACCESS[username].length;
      if (size === 0) {
        reply += 'You do not have access to broadcast to any security groups.';
      } else {
      // 3.
        reply += 'The security groups you can broadcast a message to are:\n';
        // 3a.
        if (this.handleALL(procjson.apps[0].env.tokens.SECURITY_GROUP_ACCESS[username]) === true) {
          reply += this.getAllSGs();
        } else {
          for (i = 0; i < size; i += 1) {
            reply += `${this.convertSGID(procjson.apps[0].env.tokens.SECURITY_GROUP_ACCESS[username][i])}\n`;
          }
        }
      }
    }
    return {
      reply,
      state: State.NONE,
    };
  }

  /*
    Returns a list of security groups that a user has access to. 
    Also checks to see and handle 'ALL' value. If true return list of all security groups.
  */
  static getSGs(username, allSGs) {
    let procjson = require('../../processes.json');
    const filteredList = [];
    let i;
    if (this.handleALL(procjson.apps[0].env.tokens.SECURITY_GROUP_ACCESS[username]) === true) {
      for (i = 0; i < allSGs.length; i += 1) {
        filteredList.push(allSGs[i]);
      }
    } else {
      for (i = 0; i < allSGs.length; i += 1) {
        if (procjson.apps[0].env.tokens.SECURITY_GROUP_ACCESS[username].includes(allSGs[i].id)) {
          filteredList.push(allSGs[i]);
        }
      }
    }
    return filteredList;
  }

  /*
    This function returns the name of a security group when given an id number for a security group.
    If Security Group ID has a match return the name of that security group.
    If not return error message.
  */

  static convertSGID(idNum) {
    const sgList = APIService.getSecurityGroups();
    logger.debug(sgList);
    let i;
    for (i = 0; i < sgList.length; i += 1) {
      if (sgList[i].id === idNum) {
        return sgList[i].name;
      }
    }
    // DO WE WANT ADMIN TO BE ABLE TO SEE THE ID NUMBER?
    return 'Error: Security Group ID number not found: (idNUM?)';
  }

  /*
    This function is used to check if the admin has access to ALL Security groups.
    This is determined if the array's only entry is 'ALL'.
  */
  static handleALL(array) {
    if (array.length === 1 && array[0] === 'ALL') {
      return true;
    }
    return false;
  }

  /*
    Returns a string of all security group names.
  */

  static getAllSGs() {
    let returnString = '';
    const sgList = APIService.getSecurityGroups();
    let i;
    for (i = 0; i < sgList.length; i += 1) {
      returnString += `${sgList[i].name}\n`;
    }
    return returnString;
  }
}

export default Groups;
