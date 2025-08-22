import State from '../state'
import ackTracker from '../helpers/ack-tracker'
import logger from '../helpers/logger'

class Ack {
  constructor({ genericService, messageService }) {
    this.messageService = messageService
    this.genericService = genericService
    this.commandString = '/ack'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  async execute() {
    // Get ALL recent broadcast messages (not filtered by sender)
    console.log('ACK: Looking for messages user can acknowledge:', this.messageService.userEmail)
    const eligibleMessages = await this.getMessagesUserCanAcknowledge()
    console.log('ACK: Found eligible messages:', eligibleMessages ? eligibleMessages.length : 'null', eligibleMessages)
    
    if (eligibleMessages && eligibleMessages.length > 0) {
      // Use the most recent message ID that user can acknowledge
      const messageID = eligibleMessages[0].message_id
      ackTracker.addAck(messageID, this.messageService.userEmail)
      
      // Test if it was stored
      const testCount = ackTracker.getAckCount(messageID)
      
      const reply = 'Message acknowledged. DEBUG: messageID=' + messageID + ', count=' + testCount
      return {
        reply,
        state: State.NONE,
      }
    } else {
      logger.error('ACK: No messages found that user can acknowledge:', this.messageService.userEmail)
      const reply = 'No recent message found to acknowledge'
      return {
        reply,
        state: State.NONE,
      }
    }
  }

  async getMessagesUserCanAcknowledge() {
    // Get all recent messages from the database
    let pageNum = 0
    const pageSize = 100
    const eligibleMessages = []
    
    const tableDataRaw = await this.genericService.apiService.getMessageIDTable(
      `${pageNum}`,
      `${pageSize}`,
      '' // Empty string to get all messages, not filtered by sender
    )
    const messageIDData = JSON.parse(tableDataRaw)
    const tableData = messageIDData.list
    
    // Filter messages this user can acknowledge using Promise.all to avoid race conditions
    const eligibilityChecks = tableData.map(async (entry) => {
      const canAcknowledge = await this.canUserAcknowledgeMessage(entry)
      return { entry, canAcknowledge }
    })
    
    const results = await Promise.all(eligibilityChecks)
    const eligibleEntries = results.filter(result => result.canAcknowledge).map(result => result.entry)
    
    // Sort by message_id descending to get most recent first
    eligibleEntries.sort((a, b) => parseInt(b.message_id) - parseInt(a.message_id))
    
    return eligibleEntries

  }

  async canUserAcknowledgeMessage(messageEntry) {
    const userEmail = this.messageService.userEmail
    const target = messageEntry.target
    
    // User can acknowledge if:
    // 1. Message sent to NETWORK (everyone can acknowledge)
    if (target === 'NETWORK') {
      return true
    }
    
    // 2. Message sent to user file (contains specific user list)
    if (target && (target.includes('.user') || target.includes('.hash'))) {
      return await this.isUserInUserFile(userEmail, target)
    }
    
    // 3. Message sent to USERS (direct user list, not file)
    if (target === 'USERS') {
      // TODO: Need to check if user is in the specific user list
      // For now, assume they can acknowledge USERS messages
      return true
    }
    
    // 4. Message sent to security group and user is in that group
    if (target && target !== 'NETWORK' && target !== 'USERS' && !target.includes('.user') && !target.includes('.hash')) {
      return await this.isUserInSecurityGroup(userEmail, target)
    }
    
    return false
  }

  async isUserInSecurityGroup(userEmail, securityGroupName) {
    try {
      // Get all security groups the current user has access to
      const userSecurityGroups = await this.genericService.apiService.getSecurityGroups()
      
      // Check if the target security group is in the user's accessible groups
      const hasAccess = userSecurityGroups.some(group => group.name === securityGroupName)
      
      console.log('Security group check:', {
        userEmail,
        targetGroup: securityGroupName,
        userGroups: userSecurityGroups.map(g => g.name),
        hasAccess
      })
      
      return hasAccess
    } catch (error) {
      console.error('Error checking security group membership:', error)
      return false
    }
  }

  async isUserInUserFile(userEmail, filePath) {
    try {
      const fs = require('fs')
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log('User file not found:', filePath)
        return false
      }
      
      // Read file contents
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const userList = fileContents.split('\n').map(line => line.trim()).filter(line => line.length > 0)
      
      // Check if current user is in the list
      const isInList = userList.includes(userEmail)
      
      console.log('User file check:', {
        userEmail,
        filePath,
        userList: userList.slice(0, 5), // Show first 5 users for debug
        totalUsers: userList.length,
        isInList
      })
      
      return isInList
    } catch (error) {
      console.error('Error checking user file:', error)
      return false
    }
  }

  // if (command === '/ack') {
  //   const userEmailString = `${userEmail}`
  //   genericService.setMessageStatus('', userEmailString, '3', '')
  //   user.currentState = State.NONE
  //   return
  // }
}

module.exports = Ack
