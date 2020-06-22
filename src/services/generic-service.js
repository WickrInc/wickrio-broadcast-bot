import APIService from './api-service';
import { logger } from '../helpers/constants';

const maxStringLength = 50;
// TODO put this in the constructor??
const inc = 10;

class GenericService {
  constructor(endIndex, user) {
    this.user = user;
    this.user.defaultEndIndex = endIndex;
  }

  setMessageStatus(messageID, userID, statusNumber, statusMessage) {
    const reply = APIService.setMessageStatus(messageID, userID, statusNumber, statusMessage);
    const userArray = [userID];
    APIService.send1to1Message(userArray, reply, '', '', '');
    return reply;
  }

  cancelMessageID(messageID) {
    APIService.cancelMessageID(messageID);
  }

  getEntriesString(userEmail) {
    const currentEntries = this.getMessageEntries(userEmail);
    let reply;
    logger.debug(`startIndex${this.user.startIndex}`);
    if (currentEntries.length < 1 || this.user.startIndex >= this.user.endIndex) {
      reply = 'There are no previous messages to display';
    } else {
      let contentData;
      let index = 1;
      let messageString = '';
      // TODO fix extra \n in more functionality
      for (let i = this.user.startIndex; i < this.user.endIndex; i += 1) {
        contentData = this.getMessageEntry(currentEntries[i].message_id);
        const contentParsed = JSON.parse(contentData);
        const messageDisplayed = this.truncate(contentParsed.message, maxStringLength);
        messageString += `(${this.user.startIndex + index}) ${messageDisplayed}\n`;
        index += 1;
      }
      reply = `Here are the past ${this.user.endIndex} broadcast message(s):\n`
        + `${messageString}`;
      // + `Which message would you like to ${commandString}\n`
      // + 'Or to see more messages reply more';
    }
    return reply;
  }

  getAbortEntriesString(userEmail) {
    const currentEntries = this.getMessageEntries(userEmail);
    let reply;
    logger.debug(`startIndex${this.user.startIndex}`);
    if (currentEntries.length < 1 || this.user.startIndex >= this.user.endIndex) {
      reply = 'There are no previous messages to display';
    } else {
      let contentData;
      let index = 1;
      let messageString = '';
      // TODO fix extra \n in more functionality
      for (let i = this.user.startIndex; i < this.user.endIndex; i += 1) {
        contentData = this.getMessageEntry(currentEntries[i].message_id);
        const contentParsed = JSON.parse(contentData);
        const messageDisplayed = this.truncate(contentParsed.message, maxStringLength);
        messageString += `(${this.user.startIndex + index}) ${messageDisplayed}\n`;
        index += 1;
      }
      reply = `Here are the past ${this.user.endIndex} broadcast message(s):\n`
        + `${messageString}`;
      // + `Which message would you like to ${commandString}\n`
      // + 'Or to see more messages reply more';
    }
    return reply;
  }

  getMessageEntries(userEmail) {
    const messageEntries = [];
    const tableDataRaw = APIService.getMessageIDTable('0', '1000', userEmail);
    const messageIDData = JSON.parse(tableDataRaw);

    const tableData = messageIDData.list;
    // for (let i = tableData.length - 1; i >= 0; i -= 1) {
    for (let i = 0; i < tableData.length; i += 1) {
      const entry = tableData[i];
      if (entry.sender === userEmail) {
        messageEntries.push(entry);
      }
    }
    this.user.endIndex = Math.min(this.user.endIndex, messageEntries.length);
    return messageEntries;
  }

  getMessageEntry(messageID) {
    return APIService.getMessageIDEntry(messageID);
  }

  // TODO should we trim white space too?
  truncate(str, n) {
    return (str.length > n) ? `${str.substr(0, n - 1)}...` : str;
  }

  getEndIndex() {
    return this.user.endIndex;
  }

  incrementIndexes() {
    this.user.startIndex += inc;
    this.user.endIndex += inc;
  }

  resetIndexes() {
    this.user.startIndex = 0;
    this.user.endIndex = this.user.defaultEndIndex;
  }
}

export default GenericService;
