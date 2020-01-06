'use strict';

module.exports = {
  "one-to-one": "Sorry, the Broadcast Bot currently only supports commands vi 1:1 conversations only!",
  "not-authorized": "Sorry, you are not authorized to send broadcast messages. If you think this is a mistake please contact your system administrator.",
  "version": "*Versions*\n" +
    "Integration: %{integrationVersion}\n" +
    "WickrIO Addon: %{addonVersion}\n" + 
    "WickrIO API: %{apiVersion}\n",
  "help": "*Messaging Commands*\n" +
          "/broadcast <Message> : to send a broadcast message\n" +
          "To send a file as a broadcast message - Click the + sign and share the file with the bot\n" +
          "To send a voice memo as a broadcast message - Click the microphone button and send a voice memo to the bot\n" +
          "/ack  : To acknowledge a broadcast message \n" +
          "/status : To get status of a broadcast message \n" +
          "/report : To get a CSV file with the status of each user of a broadcast message \n" +
          "/cancel : To cancel the last operation and enter a new command \n\n" + 
          "*Admin Commands*\n" +
          "/admin list : Get list of admin users \n" +
          "/admin add <users> : Add one or more admin users \n" +
          "/admin remove <users> : Remove one or more admin users \n\n" +
          "*Other Commands*\n" +
          "/help : Show help information",
  "usage": "Usage: /broadcast <Message>\nPlease type the message you would like to send after the /broadcast",
  "askForAck": "Would you like to ask the recipients for an acknowledgement?",
  "noPrevious": "There are no previous messages to display",
  "whichMessage": "Here are the past %{length} broadcast message(s):\n" + 
                  "%{messageList}" +
                  "Which message would you like to see the status of?",
  "enterID": "Please enter a number for the messageID",
  "whichReport":  "Here are the past %{length} broadcast message(s):\n" + 
                  "%{messageList}" +
                  "Which message would you like to receive a report of?",
  "canceled": "Previous command canceled, send a new command or enter /help for a list of commands.",
  "currentAdmins": "Current amins:\n%{userList}",
  "alreadyContains": "Failed, current list of admins already contains:\n%{user}",
  "adminsToAdd": "Going to add admins:\n%{userList}",
  "adminsAdded": "%{userEmail} has added the following admins:\n%{userList}",
  "noNewAdmins": "Command contains no user names to add!",
  "removeFail": "Failed, current list of admins does not contain:\n%{user}",
  "adminsToDelete": "Going to delete admins:\n%{userList}",
  "adminsDeleted": "%{userEmail} has removed the following admins:\n%{userList}",
  "noRemoveAdmins": "Command contains no user names to remove!",
  "invalidAdminCommand": "Invalid /admin command, usage:\n/admin list|add <user(s)>|remove <user(s)>",
  "voiceMemoBroadcast": "Would you like to send this voice memo as a broadcast message?",
  "fileBroadcast": "Would you like to send file named: '%{filename}' as a broadcast message?",
  "fileNotSent": "Would you like to ask the recipients for an acknowledgement?",
  "voiceMemoNotSent": "Voice Memo will not be sent as a broadcast message.",
  "invalidInput": "Invalid input, please reply with yes or no",
  "whichGroup": "Who would you like to receive this message?\n\n" +
                "Here is a list of the security groups:\n" +
                "%{securityGroupList}" +
                "Please enter the number(s) of the security group(s) you would like to send your message to.\n\nOr reply *all* to send the message to everyone in the network",
  "askRepeat": "Would you like to repeat this broadcast message?",
  "confirmGroups": "Your message will send to the following security group(s):\n%{groupsList}Continue?",
  "invalidIndex": "Invalid input: %{index} please enter the number(s) of the security group(s) or reply all to send the message to everyone in the network.",
  "whichGroupAgain": "Please enter the number(s) of the security group(s) or reply all to send the message to everyone in the network.",
  "activeRepeat": "You already have a repeating broadcast message active, do you want to cancel it?",
  "timesRepeat": "How many times would you like to repeat this message?",
  "invalidNumberValue": "Invalid Input, please send a number value.\nHow many times do you want to repeat this message?",
  "repeatFrequency": "How often do you want to repeat this message(choose every 5, 10 or 15 minutes)?",
  "invalidFrequency": "Invalid Input, please send a number value.\nHow often do you want to repeat this message(choose every 5, 10 or 15 minutes)?",
  "wrongId": "Invalid input: %{index} please enter a number between 1 and %{length}",
  "messageStatus": "*Message Status:*\n" +
                   "Total Users: %{num2send}\n" +
                   "Messages Sent: %{sent}\n" +
                   "Users Acknowledged: %{acked}\n" +
                   "Message pending to Users: %{pending}\n" +
                   "Message failed to send: %{failed}",
  "repeatMessageSent": "Broadcast message #%{count} in process of being sent",
  "voiceMemoSentSG": "Broadcast voice memo message in process of being sent to security group",
  "fileSentSG": "Broadcast file message in process of being sent to security group",
  "messageSentSG": "Broadcast message in process of being sent to security group",
  "voiceMemoSent": "Broadcast voice memo message in process of being sent",
  "fileSent": "Broadcast file message in process of being sent",
  "messageSent": "Broadcast message in process of being sent",
  "noStatusData": "No data found for that message"
}

