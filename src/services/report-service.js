import { createObjectCsvWriter as createCsvWriter } from 'csv-writer'
import { logger, apiService } from '../helpers/constants'
import StatusService from './status-service'

class ReportService {
  static getReport(messageID, vGroupID) {
    let inc = 0
    const csvArray = []
    let messageStatus
    const statusData = StatusService.getStatus(messageID, true)
    if (statusData.preparing) {
      return csvArray
    }
    while (true) {
      const reportData = apiService.getMessageStatus(
        messageID,
        'full',
        `${inc}`,
        '1000'
      )
      // logger.debug(`Here is the reportData: ${reportData}`);
      messageStatus = JSON.parse(reportData)
      // for (const entry of messageStatus) {
      for (let i = 0; i < messageStatus.length; i += 1) {
        const entry = messageStatus[i]
        const sentDateString =
          entry.sent_datetime !== undefined ? entry.sent_datetime : ''
        const readDateString =
          entry.read_datetime !== undefined ? entry.read_datetime : ''
        const ackDateString =
          entry.ack_datetime !== undefined ? entry.ack_datetime : ''
        const reportEntry = ReportService.getReportEntry(entry)
        csvArray.push({
          user: entry.user,
          status: reportEntry.statusString,
          statusMessage: reportEntry.statusMessageString,
          sentDate: sentDateString,
          readDate: readDateString,
          ackDate: ackDateString,
        })
      }
      if (messageStatus.length < 1000) {
        break
      }
      inc += 1
    }
    const now = new Date()
    const dateString = `${now.getDate()}-${
      now.getMonth() + 1
    }-${now.getFullYear()}_${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`
    const filename = `report-${dateString}.csv`
    const path = `${process.cwd()}/attachments/${filename}`
    ReportService.writeCSVReport(path, csvArray)
    apiService.sendRoomAttachment(vGroupID, path, filename)
    // TODO make a reply like here is the attachment
    // TODO can replies just be empty?
    return csvArray
  }

  static getReportEntry(entry) {
    let statusMessageString = ''
    let statusString = ''
    switch (entry.status) {
      case 0:
        statusString = 'pending'
        break
      case 1:
        statusString = 'sent'
        break
      case 2:
        statusString = 'failed'
        statusMessageString = entry.status_message
        break
      case 3:
        statusString = 'acked'
        if (entry.status_message !== undefined) {
          const obj = JSON.parse(entry.status_message)
          if (obj.location !== undefined) {
            const { latitude } = obj.location
            const { longitude } = obj.location
            statusMessageString = `http://www.google.com/maps/place/${latitude},${longitude}`
          } else {
            statusMessageString = entry.status_message
          }
        }
        break
      case 4:
        statusString = 'ignored'
        statusMessageString = entry.status_message
        break
      case 5:
        statusString = 'aborted'
        statusMessageString = entry.status_message
        break
      case 6:
        statusString = 'read'
        statusMessageString = entry.status_message
        break
      case 7: // NOT SUPPORTED YET
        statusString = 'delivered'
        statusMessageString = entry.status_message
        break
      default:
        // TODO figure out what should be
        statusString = 'N/A'
        break
    }
    return {
      statusMessageString,
      statusString,
    }
  }

  static writeCSVReport(path, csvArray) {
    const csvWriter = createCsvWriter({
      path,
      header: [
        { id: 'user', title: 'USER' },
        { id: 'status', title: 'STATUS' },
        { id: 'statusMessage', title: 'MESSAGE' },
        { id: 'sentDate', title: 'SENT' },
        { id: 'readDate', title: 'READ' },
        { id: 'ackDate', title: 'ACKed' },
      ],
    })
    csvWriter.writeRecords(csvArray).then(() => {
      logger.debug('...Done')
    })
  }
}

export default ReportService
