import { bot } from './constants'

// Use bot's existing database system for acknowledgment tracking
class AckTracker {
  constructor() {
    // Use bot's existing user database system
    this.bot = bot
  }

  addAck(messageID, userEmail) {
    console.log('ACK TRACKER addAck called:', { messageID, userEmail })
    
    // Get or create user in bot's database
    let user = this.bot.getUser(userEmail)
    if (!user) {
      const WickrUser = require('./constants').WickrUser
      user = new WickrUser(userEmail, {})
      this.bot.addUser(user)
      console.log('ACK TRACKER created new user:', userEmail)
    }
    
    // Store acknowledgments in user's data
    if (!user.acknowledgments) {
      user.acknowledgments = []
    }
    
    // Add messageID if not already acknowledged
    if (!user.acknowledgments.includes(messageID)) {
      user.acknowledgments.push(messageID)
      console.log('ACK TRACKER stored ack:', { userEmail, messageID, totalAcks: user.acknowledgments.length })
    } else {
      console.log('ACK TRACKER already acked:', { userEmail, messageID })
    }
  }

  getAckCount(messageID) {
    const users = this.bot.getUsers()
    let count = 0
    for (const user of users) {
      if (user.acknowledgments && user.acknowledgments.includes(messageID)) {
        count++
      }
    }
    return count
  }

  getAckedUsers(messageID) {
    const users = this.bot.getUsers()
    const ackedUsers = []
    for (const user of users) {
      if (user.acknowledgments && user.acknowledgments.includes(messageID)) {
        ackedUsers.push(user.userEmail)
      }
    }
    return ackedUsers
  }

  hasUserAcked(messageID, userEmail) {
    const user = this.bot.getUser(userEmail)
    return user && user.acknowledgments && user.acknowledgments.includes(messageID)
  }
}

// Singleton instance
const ackTracker = new AckTracker()
export default ackTracker