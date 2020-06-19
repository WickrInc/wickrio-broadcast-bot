import { existsSync, mkdirSync } from 'fs';
import FileHandler from '../helpers/file-handler';
import APIService from './api-service';
import StatusService from './status-service';
// TODO proper form??
import updateLastID from '../helpers/message-id-helper';
import { logger } from '../helpers/constants';

// TODO make fs a variable that is passed into the constructor
if (!existsSync(`${process.cwd()}/files`)) {
  mkdirSync(`${process.cwd()}/files`);
}

const dir = `${process.cwd()}/files/`;

class SendService {
  constructor(user) {
    this.user = user;
  }

  // TODO what happens if someone is adding a file at the same time as someone is sending a message?
  getFiles() {
    try {
      this.user.fileArr = FileHandler.listFiles(dir);
      return this.user.fileArr;
    } catch (err) {
      // TODO fix this.user.!! gracefully >:)
      logger.error(err);
      return null;
    }
  }

  getFileArr() {
    return this.user.getFiles();
  }

  setFile(file) {
    this.user.file = file;
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

  setVGroupID(vGroupID) {
    this.user.vGroupID = vGroupID;
  }

  sendToFile(fileName) {
    const sentBy = `\n\nBroadcast message sent by: ${this.user.userEmail}`;
    const messageToSend = this.user.message + sentBy;
    logger.debug('Broadcasting to a file');
    const currentDate = new Date();
    // "YYYY-MM-DDTHH:MM:SS.sssZ"
    const jsonDateTime = currentDate.toJSON();
    // TODO move filePathcreation?
    const filePath = dir + fileName;
    let uMessage;
    const messageID = updateLastID();
    if (this.user.file !== '') {
      if (fileName.endsWith('hash')) {
        uMessage = APIService.sendAttachmentUserHashFile(filePath, this.user.file, this.user.display, '', '', messageID);
      } else if (fileName.endsWith('user')) {
        uMessage = APIService.sendAttachmentUserNameFile(filePath, this.user.file, this.user.display, '', '', messageID);
      }
      APIService.writeMessageIDDB(
        messageID,
        this.user.userEmail,
        filePath,
        jsonDateTime,
        this.user.display,
      );
    } else {
      if (fileName.endsWith('hash')) {
        uMessage = APIService.sendMessageUserHashFile(filePath, messageToSend, '', '', messageID);
      } else if (fileName.endsWith('user')) {
        uMessage = APIService.sendMessageUserNameFile(filePath, messageToSend, '', '', messageID);
      }
      APIService.writeMessageIDDB(
        messageID,
        this.user.userEmail,
        filePath,
        jsonDateTime,
        this.user.message,
      );
    }
    if (this.user.vGroupID !== '' && this.user.vGroupID !== undefined) {
      StatusService.asyncStatus(messageID, this.user.vGroupID);
    }
    this.clearValues();
    logger.debug(`Broadcast uMessage${uMessage}`);
  }

  clearValues() {
    this.user.file = '';
    this.user.message = '';
    this.user.userEmail = '';
    this.user.display = '';
    this.user.vGroupID = '';
  }
}

export default SendService;
