import {
  // WickrIOAPI,
  logger
} from './constants';
import APIService from '../services/api-service';

class WriteMessageIDDB {

  writeMessageIDDB(messageId, sender, target, dateSent, messageContent) {
    logger.debug("inside writeToMessageIdDB");
    // TODO should this return something?
    APIService.cmdAddMessageID(messageId, sender, target, dateSent, messageContent);
  }

}

module.exports = WriteMessageIDDB;
