// TODO what's the correct format here?
const WickrIOBotAPI = require('wickrio-bot-api');

const bot = new WickrIOBotAPI.WickrIOBot();
const WickrIOAPI = bot.getWickrIOAddon();

class APIService {
  static getSecurityGroups() {
    const groupData = WickrIOAPI.cmdGetSecurityGroups();
    const temp = JSON.parse(groupData);
    // return JSON.parse(groupData);
    return temp;
  }

  static sendSecurityGroupVoiceMemo(securityGroups, voiceMemo, duration, messageID, sentBy) {
    // TODO add time sent to VoiceMemo String?
    return WickrIOAPI.cmdSendSecurityGroupVoiceMemo(securityGroups, voiceMemo, 'VoiceMemo', duration, '', '', messageID, sentBy);
  }

  static sendSecurityGroupAttachment(securityGroups, filename, displayName, messageID, sentBy) {
    return WickrIOAPI.cmdSendSecurityGroupAttachment(securityGroups, filename, displayName, '', '', messageID, sentBy);
  }

  static sendSecurityGroupMessage(securityGroups, message, messageID) {
    return WickrIOAPI.cmdSendSecurityGroupMessage(message, securityGroups, '', '', messageID);
  }

  static sendNetworkVoiceMemo(voiceMemo, duration, messageID, sentBy) {
    return WickrIOAPI.cmdSendNetworkVoiceMemo(voiceMemo, 'VoiceMemo', duration, '', '', messageID, sentBy);
  }

  static sendNetworkAttachment(filename, displayName, messageID, sentBy) {
    return WickrIOAPI.cmdSendNetworkAttachment(filename, displayName, '', '', messageID, sentBy);
  }

  static sendNetworkMessage(message, messageID) {
    return WickrIOAPI.cmdSendNetworkMessage(message, '', '', messageID);
  }

  static writeMessageIDDB(messageId, sender, target, dateSent, messageContent) {
    return WickrIOAPI.cmdAddMessageID(messageId, sender, target, dateSent, messageContent);
  }

  static getMessageStatus(messageID, type, page, pageSize) {
    return WickrIOAPI.cmdGetMessageStatus(messageID, type, page, pageSize);
  }

  static getMessageIDEntry(messageID) {
    return WickrIOAPI.cmdGetMessageIDEntry(messageID);
  }

  static getMessageIDTable() {
    return WickrIOAPI.cmdGetMessageIDTable('0', '1000');
  }

  static sendRoomMessage(vGroupID, message) {
    return WickrIOAPI.cmdSendRoomMessage(vGroupID, message);
  }

  static sendRoomAttachment(vGroupID, attachment, display) {
    return WickrIOAPI.cmdSendRoomAttachment(vGroupID, attachment, display);
  }

  static sendMessageUserHashFile(filePath, message, ttl, bor, messageID) {
    return WickrIOAPI.cmdSendMessageUserHashFile(filePath, message, ttl, bor, messageID);
  }

  static sendMessageUserNameFile(filePath, message, ttl, bor, messageID) {
    return WickrIOAPI.cmdSendMessageUserNameFile(filePath, message, ttl, bor, messageID);
  }

  static sendAttachmentUserHashFile(filePath, attachment, display, ttl, bor, messageID) {
    return WickrIOAPI.cmdSendAttachmentUserHashFile(filePath, attachment, display, ttl, bor, messageID);
  }

  static sendAttachmentUserNameFile(filePath, attachment, display, ttl, bor, messageID) {
    return WickrIOAPI.cmdSendAttachmentUserNameFile(filePath, attachment, display, ttl, bor, messageID);
  }

  static setMessageStatus(messageID, userID, statusNumber, statusMessage) {
    return WickrIOAPI.cmdSetMessageStatus(messageID, userID, statusNumber, statusMessage);
  }

  static send1to1Message(userArray, reply) {
    return WickrIOAPI.cmdSend1to1Message(userArray, reply);
  }

  static cancelMessageID(messageID) {
    return WickrIOAPI.cmdCancelMessageID(messageID);
  }
}

module.exports = APIService;
