import APIService from './api-service';

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

  static getMessageEntries(userEmail) {
    const messageEntries = [];
    const tableDataRaw = APIService.getMessageIDTable('0', '1000', userEmail);
    const messageIDData = JSON.parse(tableDataRaw);
	
    const tableData = messageIDData.list;
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

export default GenericService;
