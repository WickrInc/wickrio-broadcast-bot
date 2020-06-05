import APIService from './api-service';

const maxNumberEntries = 10;
const maxStringLength = 50;

class GenericService {
  static setMessageStatus(messageID, userID, statusNumber, statusMessage) {
    const reply = APIService.setMessageStatus(messageID, userID, statusNumber, statusMessage);
    const userArray = [userID];
    APIService.send1to1Message(userArray, reply, '', '', '');
    return reply;
  }

  static cancelMessageID(messageID) {
    APIService.cancelMessageID(messageID);
  }

  static getEntriesString(userEmail) {
    const currentEntries = GenericService.getMessageEntries(userEmail);
    if (currentEntries.length < 1) {
      return 'There are no previous messages to display';
    }
    let contentData;
    let index = 1;
    let messageString = '';
    for (let i = 0; i < currentEntries.length; i += 1) {
      contentData = GenericService.getMessageEntry(currentEntries[i].message_id);
      const contentParsed = JSON.parse(contentData);
      const messageDisplayed = GenericService.truncate(contentParsed.message, maxStringLength);
      messageString += `(${index}) ${messageDisplayed}\n`;
      index += 1;
    }
    return `Here are the past ${currentEntries.length} broadcast message(s):\n${messageString}`;
  }

  static getMessageEntries(userEmail) {
    const messageEntries = [];
    const tableDataRaw = APIService.getMessageIDTable('0', '1000', userEmail);
    const tableData = JSON.parse(tableDataRaw);
    for (let i = tableData.length - 1; i >= 0; i -= 1) {
      const entry = tableData[i];
      if (entry.sender === userEmail) {
        messageEntries.push(entry);
      }
      if (messageEntries.length === maxNumberEntries) {
        break;
      }
    }
    return messageEntries;
  }

  static getMessageEntry(messageID) {
    return APIService.getMessageIDEntry(messageID);
  }

  static truncate(str, n) {
    return (str.length > n) ? `${str.substr(0, n - 1)}...` : str;
  }
}

export default GenericService;
