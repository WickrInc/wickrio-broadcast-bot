import APIService from './api-service';
import { logger } from '../helpers/constants';

const maxStringLength = 50;
const inc = 10;

const maxNumberEntries = 10;

class GenericService {
  constructor(endIndex) {
    this.startIndex = 0;
    this.endIndex = endIndex;
    this.defaultEndIndex = endIndex;
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

    // let messageCounter = 0;
    // messageCounter += 1;
    // if (messageCounter > this.startIndex) {
    // }

    logger.debug(`startIndex${this.startIndex}`);
    if (currentEntries.length < 1 || this.startIndex > this.endIndex) {
      reply = 'There are no previous messages to display';
    } else {
      let contentData;
      let index = 1;
      let messageString = '';
      // TODO fix extra \n in more functionality
      for (let i = this.startIndex; i < this.endIndex; i += 1) {
        contentData = this.getMessageEntry(currentEntries[i].message_id);
        const contentParsed = JSON.parse(contentData);
        const messageDisplayed = this.truncate(contentParsed.message, maxStringLength);
        messageString += `(${this.startIndex + index}) ${messageDisplayed}\n`;
        index += 1;
      }
      reply = `Here are the past ${this.endIndex} broadcast message(s):\n`
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
    for (let i = tableData.length - 1; i >= 0; i -= 1) {
      const entry = tableData[i];
      if (entry.sender === userEmail) {
        messageEntries.push(entry);
      }
      if (messageEntries.length === maxNumberEntries) {
        break;
      }
    }
    this.endIndex = Math.min(this.endIndex, messageEntries.length);
    return messageEntries;
  }

  getMessageEntry(messageID) {
    return APIService.getMessageIDEntry(messageID);
  }

  truncate(str, n) {
    return (str.length > n) ? `${str.substr(0, n - 1)}...` : str;
  }

  getEndIndex() {
    return this.endIndex;
  }

  incrementIndexes() {
    this.startIndex += inc;
    this.endIndex += inc;
  }

  resetIndexes() {
    this.startIndex = 0;
    this.endIndex = this.defaultEndIndex;
  }
}

export default GenericService;
