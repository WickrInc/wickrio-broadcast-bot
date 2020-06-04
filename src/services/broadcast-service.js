import APIService from './api-service';
import StatusService from './status-service';
// TODO proper form??
import updateLastID from '../helpers/message-id-helper';
import { logger } from '../helpers/constants';

class BroadcastService {
  constructor() {
    this.file = ''
    this.message = ''
    this.userEmail = ''
    this.display = ''
    this.ackFlag = false
    this.securityGroups = []
    this.duration = 0
    this.voiceMemo = ''
    this.repeatFlag = false
    this.vGroupID = ''
    this.APISecurityGroups = []
    this.users = []
    this.ttl = ''
    this.bor = ''
  }

  setRepeatFlag(repeatFlag) {
    this.repeatFlag = repeatFlag;
  }

  setFile(file) {
    this.file = file;
  }

  setVoiceMemo(voiceMemo) {
    this.voiceMemo = voiceMemo;
  }

  setDuration(duration) {
    this.duration = duration;
  }

  setMessage(message) {
    this.message = message;
  }

  setDisplay(display) {
    this.display = display;
  }

  setUserEmail(email) {
    this.userEmail = email;
  }

  setSecurityGroups(securityGroups) {
    this.securityGroups = securityGroups;
  }

  setUsers(users) {
    this.users = users;
  }

  getAPISecurityGroups() {
    this.APISecurityGroups = APIService.getSecurityGroups();
    return this.APISecurityGroups;
  }

  setAckFlag(ackFlag) {
    this.ackFlag = ackFlag;
  }

  setVGroupID(vGroupID) {
    this.vGroupID = vGroupID;
  }

  setBOR(bor) {
    this.bor = bor
  }
  setTTL(ttl) {
    this.ttl = ttl
  }

  broadcastMessage() {
    let sentBy = `\n\nBroadcast message sent by: ${this.userEmail}`;
    let messageToSend = this.message + sentBy;
    if (this.ackFlag) {
      messageToSend = `${messageToSend}\nPlease acknowledge this message by replying with /ack`;
      sentBy = `${sentBy}\nPlease acknowledge this message by replying with /ack`;
    }
    const target = (this.users.length > 0) ? 'USERS' : ((this.securityGroups.length < 1 || this.securityGroups === undefined) ? 'NETWORK' : this.securityGroups.join());
    logger.debug(`target${target}`);
    const currentDate = new Date();
    // "YYYY-MM-DDTHH:MM:SS.sssZ"
    const jsonDateTime = currentDate.toJSON();
    // messageID must be a string
    // TODO is is necessary to do this?
    const messageID = `${updateLastID()}`;
    let uMessage;
    let reply;
    if (target === 'USERS') {
      logger.debug(`broadcasting to users=${this.users}`);
      uMessage = APIService.send1to1Message(this.users, messageToSend, this.ttl, this.bor, messageID);
      logger.debug(`send1to1Messge returns=${uMessage}`);
      reply = 'Broadcast message in process of being sent to list of users';
    } else if (target === 'NETWORK') {
      if (this.voiceMemo !== '') {
        uMessage = APIService.sendNetworkVoiceMemo(
          this.voiceMemo,
          this.duration,
          this.ttl,
          this.bor,
          messageID,
          sentBy,
        );
        reply = 'Voice Memo broadcast in process of being sent';
      } else if (this.file !== '') {
        uMessage = APIService.sendNetworkAttachment(this.file, this.display, this.ttl, this.bor, messageID, sentBy);
        reply = 'File broadcast in process of being sent';
      } else {
        uMessage = APIService.sendNetworkMessage(messageToSend, this.ttl, this.bor, messageID);
        reply = 'Broadcast message in process of being sent';
      }
    } else if (this.voiceMemo !== '') {
      uMessage = APIService.sendSecurityGroupVoiceMemo(
        this.securityGroups,
        this.voiceMemo,
        this.duration,
        this.ttl,
        this.bor,
        messageID,
        sentBy,
      );
      reply = 'Voice Memo broadcast in process of being sent to security group';
    } else if (this.file !== '') {
      uMessage = APIService.sendSecurityGroupAttachment(
        this.securityGroups,
        this.file,
        this.display,
        this.ttl,
        this.bor,
        messageID,
        sentBy,
      );
      reply = 'File broadcast in process of being sent to security group';
    } else {
      uMessage = APIService.sendSecurityGroupMessage(this.securityGroups, messageToSend, this.ttl, this.bor, messageID);
      reply = 'Broadcast message in process of being sent to security group';
    }
    if (this.file !== '') {
      APIService.writeMessageIDDB(messageID, this.userEmail, target, jsonDateTime, this.display);
    } else if (this.voiceMemo !== '') {
      APIService.writeMessageIDDB(messageID, this.userEmail, target, jsonDateTime, `VoiceMemo-${jsonDateTime}`);
    } else {
      APIService.writeMessageIDDB(messageID, this.userEmail, target, jsonDateTime, this.message);
    }
    if (this.vGroupID !== '' && this.vGroupID !== undefined) {
      StatusService.asyncStatus(messageID, this.vGroupID);
    }
    logger.debug(`Broadcast uMessage=${uMessage}`);
    return reply;
  }

  // TODO check if this works as expected
  static isInt(value) {
    return !(Number.isNaN(value));
  }
}

export default BroadcastService;
