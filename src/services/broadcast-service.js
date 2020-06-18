import APIService from './api-service';
import StatusService from './status-service';
// TODO proper form??
import updateLastID from '../helpers/message-id-helper';
import { logger } from '../helpers/constants';

class BroadcastService {
  constructor(user) {
    this.user = user;
    // this.file = '';
    // this.message = '';
    // this.mail = '';
    // this.display = '';
    // this.ackFlag = false;
    // this.securityGroups = [];
    // this.duration = 0;
    // this.voiceMemo = '';
    // this.repeatFlag = false;
    // this.vGroupID = '';
    // this.APISecurityGroups = [];
    // this.users = [];
    // this.ttl = '';
    // this.bor = '';
  }

  setRepeatFlag(repeatFlag) {
    this.user.repeatFlag = repeatFlag;
  }

  setFile(file) {
    this.user.file = file;
  }

  setVoiceMemo(voiceMemo) {
    this.user.voiceMemo = voiceMemo;
  }

  setDuration(duration) {
    this.user.duration = duration;
  }

  setMessage(message) {
    this.user.message = message;
  }

  setDisplay(display) {
    this.user.display = display;
  }

  setUserEmail(email) {
    this.user.userEmail = email;
  }

  setSecurityGroups(securityGroups) {
    this.user.securityGroups = securityGroups;
  }

  setUsers(users) {
    this.user.users = users;
  }

  getAPISecurityGroups() {
    this.user.APISecurityGroups = APIService.getSecurityGroups();
    return this.user.APISecurityGroups;
  }

  setAckFlag(ackFlag) {
    this.user.ackFlag = ackFlag;
  }

  setSentByFlag(sentByFlag) {
    this.user.sentByFlag = sentByFlag;
  }

  setVGroupID(vGroupID) {
    this.user.vGroupID = vGroupID;
  }

  setBOR(bor) {
    this.user.bor = bor;
  }

  setTTL(ttl) {
    this.user.ttl = ttl;
  }

  broadcastMessage() {
    let messageToSend;
    if (this.user.sentByFlag) {
      messageToSend = `${this.user.message}\n\nBroadcast message sent by: ${this.user.userEmail}`;
    } else {
      messageToSend = this.user.message;
    }

    if (this.user.ackFlag) {
      if (this.user.sentByFlag) {
        messageToSend = `${messageToSend}\nPlease acknowledge this.user.message by replying with /ack`;
      } else {
        messageToSend = `${messageToSend}\n\nPlease acknowledge this.user.message by replying with /ack`;
      }
    }
    // TODO what is users vs network?
    var target;
    if (this.user.users !== undefined && this.user.users.length > 0) {
      target = 'USERS';
    } else if (this.user.securityGroups === undefined || this.user.securityGroups.length < 1) {
      target = 'NETWORK';
    } else {
      target = this.user.securityGroups.join();
    }

    logger.debug(`target${target}`);
    const currentDate = new Date();
    // "YYYY-MM-DDTHH:MM:SS.sssZ"
    const jsonDateTime = currentDate.toJSON();
    // messageID must be a string
    // TODO is is necessary to do this.user.
    const messageID = `${updateLastID()}`;
    console.log({ messageID });
    var uMessage;
    const reply = {};
    if (target === 'USERS') {
      uMessage = APIService.send1to1MessageLowPriority(
        this.user.users,
        messageToSend,
        this.user.ttl,
        this.user.bor,
        messageID,
      );
      logger.debug(`send1to1Messge returns=${uMessage}`);
      reply.pending = 'Broadcast message in process of being sent to list of users';
      reply.message = this.user.message;
    } else if (target === 'NETWORK') {
      if (this.user.voiceMemo !== undefined && this.user.voiceMemo !== '') {
        uMessage = APIService.sendNetworkVoiceMemo(
          this.user.voiceMemo,
          this.user.duration,
          this.user.ttl,
          this.user.bor,
          messageID,
          messageToSend,
        );
        reply.pending = 'Voice Memo broadcast in process of being sent';
        reply.message = this.user.message;
      } else if (this.user.file !== undefined && this.user.file !== '') {
        uMessage = APIService.sendNetworkAttachment(
          this.user.file,
          this.user.display,
          this.user.ttl,
          this.user.bor,
          messageID,
          messageToSend,
        );
        reply.pending = 'File broadcast in process of being sent';
        reply.message = this.user.message;
      } else {
        uMessage = APIService.sendNetworkMessage(messageToSend, this.user.ttl, this.user.bor, messageID);
        reply.pending = 'Broadcast message in process of being sent';
        reply.message = this.user.message;
      }
    } else if (this.user.voiceMemo !== undefined && this.user.voiceMemo !== '') {
      uMessage = APIService.sendSecurityGroupVoiceMemo(
        this.user.securityGroups,
        this.user.voiceMemo,
        this.user.duration,
        this.user.ttl,
        this.user.bor,
        messageID,
        messageToSend,
      );
      reply.pending = 'Voice Memo broadcast in process of being sent to security group';
      reply.message = messageToSend;
    } else if (this.user.file !== undefined && this.user.file !== '') {
      uMessage = APIService.sendSecurityGroupAttachment(
        this.user.securityGroups,
        this.user.file,
        this.user.display,
        this.user.ttl,
        this.user.bor,
        messageID,
        messageToSend,
      );
      reply.pending = 'File broadcast in process of being sent to security group';
      reply.message = this.user.message;
    } else {
      uMessage = APIService.sendSecurityGroupMessage(
        this.user.securityGroups,
        messageToSend,
        this.user.ttl,
        this.user.bor,
        messageID,
      );
      reply.pending = 'Broadcast message in process of being sent to security group';
      reply.message = this.user.message;
    }
    if (this.user.file !== undefined && this.user.file !== '') {
      logger.debug(`display:${this.user.display}:`);
      APIService.writeMessageIDDB(messageID, this.user.userEmail, target, jsonDateTime, this.user.display);
    } else if (this.user.voiceMemo !== undefined && this.user.voiceMemo !== '') {
      APIService.writeMessageIDDB(messageID, this.user.userEmail, target, jsonDateTime, `VoiceMemo-${jsonDateTime}`);
    } else {
      APIService.writeMessageIDDB(messageID, this.user.userEmail, target, jsonDateTime, this.user.message);
    }
    if (this.user.vGroupID !== '' && this.user.vGroupID !== undefined) {
      StatusService.asyncStatus(messageID, this.user.vGroupID);
    }
    logger.debug(`Broadcast uMessage=${uMessage}`);
    reply.message_id = messageID;
    if (target === 'USERS') {
      reply.users = this.user.users;
    } else {
      reply.securityGroups = this.user.securityGroups;
    }

    this.user.file = '';
    this.user.message = '';
    this.user.userEmail = '';
    this.user.display = '';
    this.user.ackFlag = false;
    this.user.securityGroups = [];
    this.user.duration = 0;
    this.user.voiceMemo = '';
    this.user.repeatFlag = false;
    this.user.vGroupID = '';
    this.user.APISecurityGroups = [];
    this.user.users = [];
    this.user.ttl = '';
    this.user.bor = '';

    return reply;
  }

  // TODO check if this.user.works as expected
  static isInt(value) {
    return !(Number.isNaN(value));
  }
}

export default BroadcastService;
