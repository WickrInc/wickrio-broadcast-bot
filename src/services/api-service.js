// TODO what's the correct format here?
import {
  WickrIOAPI,
} from '../helpers/constants';

class APIService {
  static getSecurityGroups() {
    const groupData = WickrIOAPI.cmdGetSecurityGroups();
    const temp = JSON.parse(groupData);
    // return JSON.parse(groupData);
    return temp;
  }

  static sendSecurityGroupVoiceMemo(securityGroups, voiceMemo, duration, ttl, bor, messageID, sentBy) {
    // TODO add time sent to VoiceMemo String?
    return WickrIOAPI.cmdSendSecurityGroupVoiceMemo(securityGroups, voiceMemo, 'VoiceMemo', duration, ttl, bor, messageID, sentBy);
  }

  static sendSecurityGroupAttachment(securityGroups, filename, displayName, ttl, bor, messageID, sentBy) {
    return WickrIOAPI.cmdSendSecurityGroupAttachment(securityGroups, filename, displayName, ttl, bor, messageID, sentBy);
  }

  static sendSecurityGroupMessage(securityGroups, message, ttl, bor, messageID) {
    return WickrIOAPI.cmdSendSecurityGroupMessage(message, securityGroups, ttl, bor, messageID);
  }

  static sendNetworkVoiceMemo(voiceMemo, duration, ttl, bor, messageID, sentBy) {
    return WickrIOAPI.cmdSendNetworkVoiceMemo(voiceMemo, 'VoiceMemo', duration, ttl, bor, messageID, sentBy);
  }

  static sendNetworkAttachment(filename, displayName, ttl, bor, messageID, sentBy) {
    return WickrIOAPI.cmdSendNetworkAttachment(filename, displayName, ttl, bor, messageID, sentBy);
  }

  static sendNetworkMessage(message, ttl, bor, messageID) {
    return WickrIOAPI.cmdSendNetworkMessage(message, ttl, bor, messageID);
  }

  static writeMessageIDDB(messageId, sender, target, dateSent, messageContent) {
    return WickrIOAPI.cmdAddMessageID(messageId, sender, target, dateSent, messageContent);
  }

  static getMessageStatus(messageID, type, page, pageSize) {
    try {
      return WickrIOAPI.cmdGetMessageStatus(messageID, type, page, pageSize);
    } catch (err) {
      return undefined;
    }
  }

  static getMessageStatusFiltered(messageID, type, page, pageSize, filter, users) {
    try {
      return WickrIOAPI.cmdGetMessageStatus(messageID, type, page, pageSize, filter, users);
    } catch (err) {
      return undefined;
    }
  }

  static getMessageIDEntry(messageID) {
    try {
      return WickrIOAPI.cmdGetMessageIDEntry(messageID);
    } catch (err) {
      return undefined;
    }
  }

  static getMessageIDTable(page, size, sender) {
    return WickrIOAPI.cmdGetMessageIDTable(page, size, sender);
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

  static send1to1Message(userArray, reply, ttl, bor, messageID) {
    return WickrIOAPI.cmdSend1to1Message(userArray, reply, ttl, bor, messageID);
  }

  static send1to1MessageLowPriority(userArray, reply, ttl, bor, messageID, flags) {
    const buttons = [];
    return WickrIOAPI.cmdSend1to1Message(userArray, reply, ttl, bor, messageID, flags, buttons, true);
  }

  static cancelMessageID(messageID) {
    return WickrIOAPI.cmdCancelMessageID(messageID);
  }

  static setEventCallback(callbackUrl) {
      return WickrIOAPI.cmdSetEventCallback(callbackUrl);
  }

  static getEventCallback() {
      return WickrIOAPI.cmdGetEventCallback();
  }

  static deleteEventCallback() {
      return WickrIOAPI.cmdDeleteEventCallback();
  }
}

export default APIService;
