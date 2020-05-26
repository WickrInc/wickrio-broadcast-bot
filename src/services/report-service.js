const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const logger = require('../logger');
const APIService = require('./api-service');

class ReportService {
  static getReport(messageID, vGroupID) {
    let inc = 0;
    const csvArray = [];
    while (true) {
      const statusData = APIService.getMessageStatus(messageID, 'full', `${inc}`, '1000');
      const messageStatus = JSON.parse(statusData);
      // for (const entry of messageStatus) {
      for (let i = 0; i < messageStatus.length; i += 1) {
        const entry = messageStatus[i];
        const sentDateString = (entry.sent_datetime !== undefined) ? entry.sent_datetime : '';
        const readDateString = (entry.read_datetime !== undefined) ? entry.read_datetime : '';
        const reportEntry = ReportService.getReportEntry(entry);
        csvArray.push(
          {
            user: entry.user,
            status: reportEntry.statusString,
            statusMessage: reportEntry.statusMessageString,
            sentDate: sentDateString,
            readDate: readDateString,
          },
        );
      }
      if (messageStatus.length < 1000) {
        break;
      }
      inc += inc;
    }
    const now = new Date();
    const dateString = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}_${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`;
    const path = `${process.cwd()}/attachments/report-${dateString}.csv`;
    ReportService.writeCSVReport(path, csvArray);
    APIService.sendRoomAttachment(vGroupID, path, path);
    // TODO make a reply like here is the attachment
    // TODO can replies just be empty?
    return path;
  }

  static getReportEntry(entry) {
    let statusMessageString = '';
    let statusString = '';
    switch (entry.status) {
      case 0:
        statusString = 'pending';
        break;
      case 1:
        statusString = 'sent';
        break;
      case 2:
        statusString = 'failed';
        statusMessageString = entry.status_message;
        break;
      case 3:
        statusString = 'acked';
        if (entry.status_message !== undefined) {
          const obj = JSON.parse(entry.status_message);
          if (obj.location !== undefined) {
            const { latitude } = obj.location;
            const { longitude } = obj.location;
            statusMessageString = `http://www.google.com/maps/place/${latitude},${longitude}`;
          } else {
            statusMessageString = entry.status_message;
          }
        }
        break;
      case 4:
        statusString = 'ignored';
        statusMessageString = entry.status_message;
        break;
      case 5:
        statusString = 'aborted';
        statusMessageString = entry.status_message;
        break;
      case 6:
        statusString = 'read';
        statusMessageString = entry.status_message;
        break;
      case 7: // NOT SUPPORTED YET
        statusString = 'delivered';
        statusMessageString = entry.status_message;
        break;
      default:
        // TODO figure out what should be
        statusString = 'N/A';
        break;
    }
    return {
      statusMessageString,
      statusString,
    };
  }

  static writeCSVReport(path, csvArray) {
    const csvWriter = createCsvWriter({
      path,
      header: [
        { id: 'user', title: 'USER' },
        { id: 'status', title: 'STATUS' },
        { id: 'statusMessage', title: 'MESSAGE' },
      ],
    });
    csvWriter.writeRecords(csvArray)
      .then(() => {
        logger.debug('...Done');
      });
  }
}

module.exports = ReportService;
