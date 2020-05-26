const APIService = require('./api-service');

class GenericService {
  static setMessageStatus(messageID, userID, statusNumber, statusMessage) {
    const reply = APIService.setMessageStatus(messageID, userID, statusNumber, statusMessage);
    const userArray = [userID];
    APIService.send1to1Message(userArray, reply);
    return reply;
  }

  static cancelMessageID(messageID) {
    APIService.cancelMessageID(messageID);
  }

  static getMessageEntries(userEmail) {
    const messageEntries = [];
    const tableDataRaw = APIService.getMessageIDTable();
    const tableData = JSON.parse(tableDataRaw);
    for (let i = tableData.length - 1; i >= 0; i -= 1) {
      const entry = tableData[i];
      if (entry.sender === userEmail) {
        messageEntries.push(entry);
      }
      if (messageEntries.length > 4) {
        break;
      }
    }
    return messageEntries;
  }

  static getMessageEntry(messageID) {
    return APIService.getMessageIDEntry(messageID);
  }
}

module.exports = GenericService;
