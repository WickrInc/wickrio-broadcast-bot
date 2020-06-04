import APIService from './api-service';

const maxNumberEntries = 10;

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

  static getDefaultMessageEntries(userEmail) {
    return GenericService.getMessageEntries(userEmail);
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
    return (str.length > n) ? `${str.substr(0, n - 1)}&hellip;` : str;
  }
}

export default GenericService;
