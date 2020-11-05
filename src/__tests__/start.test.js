import { BotAPI } from 'wickrio-bot-api'
import BroadcastService from '../services/broadcast-service'
import { StatusService } from '../services'
import dotenv from 'dotenv'
import Factory from '../factory'
import { apiService } from '../helpers/constants'
import FormData from 'form-data'
import axios from 'axios'
// import path from 'path'
dotenv.config()

const bot = new BotAPI()
let token
let rawMessage = JSON.stringify({
  message: '',
  message_id: 'x',
  // msg_ts: '1599257133.267822',
  msg_ts: 'x',
  msgtype: 1000,
  receiver: 'localbroadcasttestbot',
  respond_api: 'http:///0/Apps//Messages',
  sender: 'jesttest',
  // time: '9/4/20 10:05 PM',
  // ttl: '9/8/20 10:05 PM',
  users: [
    { name: 'alane+largeroom@wickr.com' },
    { name: 'localbroadcasttestbot' },
  ],
  vgroupid: '6bd4fe7088ff7a470b94339fe1eb0d5b18940f6faf30ed3464779daf9eb8f14c', // put in env
})

describe('Connecting and core', () => {
  it('should test the Bot object, ensuring the bot connects', async () => {
    const status = await bot.start(
      JSON.parse(process.env.tokens).WICKRIO_BOT_NAME.value
    )
    expect(status).toEqual(true)
  })
  it('should send a successful broadcast to a security group', async () => {
    const broadcastService = new BroadcastService({
      messageService: { user: {} },
      apiService,
    })
    broadcastService.setMessage(
      'broadcast from jest test for the broadcast bot!'
    )
    broadcastService.setUserEmail('jest test')
    broadcastService.setVGroupID(
      '6bd4fe7088ff7a470b94339fe1eb0d5b18940f6faf30ed3464779daf9eb8f14c' // security group 6
    )
    broadcastService.setTTL('')
    broadcastService.setBOR('')
    broadcastService.setSentByFlag(true)

    const reply = broadcastService.broadcastMessage()
    expect(reply.pending).toEqual('Broadcast message in process of being sent')
  })
  it('should send a sucessful broadcast to a single user ', async () => {
    const statusService = new StatusService()
    const broadcastService = new BroadcastService({
      messageService: { user: {} },
      apiService,
      statusService,
    })
    broadcastService.setMessage(
      'broadcast from jest test for the broadcast bot!'
    )
    broadcastService.setUserEmail('jest test')
    broadcastService.setUsers(['alane+largeroom@wickr.com'])
    broadcastService.setTTL('')
    broadcastService.setBOR('')
    broadcastService.setSentByFlag(true)
    const reply = broadcastService.broadcastMessage()
    expect(reply.pending).toEqual(
      'Broadcast message in process of being sent to list of users'
    )
  })
  it('should send a successful broadcast to the whole network', async () => {
    const statusService = new StatusService()
    const broadcastService = new BroadcastService({
      messageService: { user: {} },
      apiService,
      statusService,
    })
    broadcastService.setMessage(
      'broadcast from jest test to the whole network!'
    )
    broadcastService.setUserEmail('jest test')
    broadcastService.setUsers(['alane+largeroom@wickr.com']) // dev
    broadcastService.setTTL('')
    broadcastService.setBOR('')
    broadcastService.setSentByFlag(true)
    const reply = broadcastService.broadcastMessage()
    expect(reply.pending).toEqual(
      'Broadcast message in process of being sent to list of users'
    )
  })
  // it('should send a successful broadcast to multiple Security Groups ', async () => {
  //   const apiService = new APIService()
  //   const statusService = new StatusService()
  //   const broadcastService = new BroadcastService({
  //     messageService: { user: {} },
  //     apiService,
  //     statusService,
  //   })
  //   broadcastService.setMessage(
  //     'broadcast from jest test for the broadcast bot!'
  //   )
  //   broadcastService.setUserEmail('jest test')
  //   broadcastService.setTTL('')
  //   broadcastService.setBOR('')
  //   broadcastService.setSentByFlag(true)
  //   const reply = broadcastService.broadcastMessage()
  //   expect(reply.pending).toEqual(
  //     'Broadcast message in process of being sent to list of users'
  //   )
  // })
})
describe('rest api', () => {
  // it('should successfully Authorize the jest test user', async () => {
  //   const sendAuthorization = async () => {
  //     // const authpath = encodeURI(`${baseAPIurl}/Authenticate/${username}`)
  //     const authpath = encodeURI(`/WickrIO/V2/Apps/Broadcast/Authorize`)
  //     try {
  //       const response = await axios.get(authpath, {
  //         headers: {
  //           Authorization: `Basic ${token}`,
  //         },
  //       })
  //       console.log({ response })
  //       // return false or a key to authorize the user
  //       // localStorage.setItem('token', user?.token)
  //       // console.log({ response })
  //       // setUser(response.data.user)
  //     } catch (err) {
  //       // alert('Access denied: invalid user authentication code.')
  //       console.log(err)
  //     }
  //   }

  //   sendAuthorization()
  // })
  it('should successfully use the rest api /Broadcast endpoint', async () => {
    const reply = await sendBroadcast({
      message: 'broadcast from rest api from jest test',
      acknowledge: true,
      attachment: false,
      selectedSecGroup:
        '6bd4fe7088ff7a470b94339fe1eb0d5b18940f6faf30ed3464779daf9eb8f14c',
    })
    console.log({ reply })
    expect(reply.pending).toEqual(
      'Broadcast message in process of being sent to list of users'
    )
  })
})
describe('Commands', () => {
  // it('should run /panel', async () => {
  //   rawMessage = JSON.parse(rawMessage)
  //   rawMessage.message = '/panel'
  //   rawMessage = JSON.stringify(rawMessage)
  //   const messageService = bot.messageService({ rawMessage })
  //   const factory = new Factory({ messageService })
  //   const { reply } = factory.execute()
  //   console.log({ reply })
  //   token = reply
  //   expect(reply).toEqual('There are no previous messages to display')
  // })
  it('should run /abort', async () => {
    rawMessage = JSON.parse(rawMessage)
    rawMessage.message = '/abort'
    rawMessage = JSON.stringify(rawMessage)
    const messageService = bot.messageService({ rawMessage })
    const factory = new Factory({ messageService })
    const { reply } = factory.execute()
    expect(reply).toEqual('There are no active messages to display')
  })
  it('should run /report', async () => {
    rawMessage = JSON.parse(rawMessage)
    rawMessage.message = '/report'
    rawMessage = JSON.stringify(rawMessage)
    const messageService = bot.messageService({ rawMessage })
    const factory = new Factory({ messageService })
    const { reply } = factory.execute()
    expect(reply).toEqual('There are no previous messages to display')
  })
})
const sendBroadcast = async ({
  message,
  acknowledge,
  attachment,
  selectedSecGroup,
}) => {
  // console.log({
  //   sentBroadcasts,
  //   message,
  //   acknowledge,
  //   repeat,
  //   selectedSecGroup,
  //   freq,
  //   repeatNum,
  //   attachment,
  //   userListFile,
  // })

  if (!message) return console.log('need a message')
  const broadcastpath = encodeURI(`/WickrIO/V2/Apps/Broadcast/Message`)

  const formdata = new FormData()
  formdata.append('message', message)
  formdata.append('acknowledge', acknowledge)

  if (attachment) {
    formdata.append('attachment', attachment)
  }
  if (selectedSecGroup) {
    formdata.append('security_group', selectedSecGroup)
  }
  // if (repeat && repeatNum) {
  //   formdata.append('repeat_num', repeatNum)
  // }
  // if (repeat && freq) {
  //   formdata.append('freq_num', freq)

  console.log({
    broadcastpath,
    formdata,
  })
  try {
    const response = await axios.post(broadcastpath, formdata, {
      headers: {
        Authorization: `Basic ${token}`,
      },
    })
    console.log({ response })
  } catch (err) {
    console.log({ err })
    return err
  }
}
