import { describe, it, expect, beforeEach, vi } from 'vitest'

// Object-level authorization tests for the V2 web report route:
//   GET /WickrIO/V2/Apps/Web/Broadcast/Report/:messageID/:page/:size
//
// These exercise the real route handler and the real checkAuth middleware.
// Only the Wickr runtime storage/API dependencies are mocked, so the
// authorization decision under test is the real one.

const jwt = require('jsonwebtoken')

const SECRET = 'report-authz-test-secret'
const BOT_NAME = 'broadcast-bot'
const ADMIN = 'admin-one@example.com'
const OTHER_ADMIN = 'admin-two@example.com'
const VALID_SESSION = 'valid-session-code'

const ROUTE = '/WickrIO/V2/Apps/Web/Broadcast/Report/:messageID/:page/:size'

// messageID -> stored MessageID entry, as getMessageIDEntry() would return it
const messageStore = {
  1: {
    message_id: '1',
    sender: ADMIN,
    target: 'NETWORK',
    message: 'broadcast owned by the calling admin',
  },
  2: {
    message_id: '2',
    sender: OTHER_ADMIN,
    target: 'NETWORK',
    message: 'broadcast owned by a different admin',
  },
  3: {
    message_id: '3',
    sender: BOT_NAME,
    target: 'NETWORK',
    message: 'broadcast created over the REST API',
  },
}

let statusCalls = []

const getMessageStatus = vi.fn(async (messageID, kind) => {
  statusCalls.push([messageID, kind])
  if (kind === 'summary') {
    return JSON.stringify({
      num2send: 1,
      sent: 1,
      pending: 0,
      failed: 0,
      acked: 1,
    })
  }
  return JSON.stringify([
    {
      user: 'recipient@example.com',
      status: 3,
      status_message: JSON.stringify({
        location: { latitude: 31.9539, longitude: 35.9106 },
      }),
      sent_datetime: '2026-06-29T00:00:00Z',
      read_datetime: '2026-06-29T00:01:00Z',
    },
  ])
})

vi.mock('../src/helpers/constants', () => ({
  bot: {
    myAdmins: {
      // Both admins are valid panel admins.
      getAdmin: email =>
        email === ADMIN || email === OTHER_ADMIN ? { email } : undefined,
    },
    getUser: () => undefined,
    addUser: email => email,
  },
  client_auth_codes: {
    [ADMIN]: VALID_SESSION,
    [OTHER_ADMIN]: VALID_SESSION,
  },
  BOT_AUTH_TOKEN: { value: SECRET },
  BOT_PORT: { value: 4545 },
  WICKRIO_BOT_NAME: { value: BOT_NAME },
  apiService: {
    getMessageIDEntry: vi.fn(async messageID =>
      messageStore[messageID] === undefined
        ? undefined
        : JSON.stringify(messageStore[messageID])
    ),
    getMessageStatus,
  },
}))

vi.mock('../src/helpers/logger', () => ({
  default: { debug() {}, info() {}, error() {} },
}))

vi.mock('../src/services/broadcast-service', () => ({
  default: class BroadcastService {},
}))

// Collect the routes the module registers against a minimal Express stand-in.
async function getReportRoute() {
  const imported = await import('../src/api/webapi')
  const useWebAndRoutes = imported.default || imported

  const routes = []
  const app = {
    use() {},
    get: (routePath, ...handlers) =>
      routes.push({ method: 'GET', routePath, handlers }),
    post: (routePath, ...handlers) =>
      routes.push({ method: 'POST', routePath, handlers }),
  }

  useWebAndRoutes(app)

  const route = routes.find(r => r.method === 'GET' && r.routePath === ROUTE)
  expect(route, 'V2 report route should be registered').toBeDefined()
  return route
}

function makeResponse() {
  return {
    statusCode: 200,
    body: undefined,
    jsonBody: undefined,
    headers: {},
    set(key, value) {
      this.headers[key] = value
      return this
    },
    status(code) {
      this.statusCode = code
      return this
    },
    send(body) {
      this.body = body
      return this
    },
    json(body) {
      this.jsonBody = body
      return this
    },
    type() {
      return this
    },
  }
}

// Run checkAuth, then the handler only if checkAuth called next().
async function requestReport({ email, session, messageID }) {
  const route = await getReportRoute()
  const [checkAuth, handler] = route.handlers

  const req = {
    params: { messageID, page: '0', size: '1000' },
    get: header =>
      header === 'Authorization'
        ? `Basic ${jwt.sign({ email, session }, SECRET, {
            expiresIn: '1800s',
          })}`
        : undefined,
  }
  const res = makeResponse()

  let authorized = false
  await checkAuth(req, res, () => {
    authorized = true
  })

  if (authorized) {
    await handler(req, res)
  }

  return { ...res, authenticatedAs: req.user && req.user.email }
}

describe('V2 report route object-level authorization', () => {
  beforeEach(() => {
    statusCalls = []
    vi.clearAllMocks()
  })

  it('returns a report to the admin who owns it', async () => {
    const res = await requestReport({
      email: ADMIN,
      session: VALID_SESSION,
      messageID: '1',
    })

    expect(res.statusCode).toBe(200)
    expect(res.authenticatedAs).toBe(ADMIN)
    expect(res.jsonBody.sender).toBe(ADMIN)
    expect(res.jsonBody.message).toBe('broadcast owned by the calling admin')
    expect(res.jsonBody.report).toBeDefined()
    expect(res.jsonBody.summary).toBeDefined()
  })

  it("denies reading another admin's report", async () => {
    const res = await requestReport({
      email: ADMIN,
      session: VALID_SESSION,
      messageID: '2',
    })

    expect(res.statusCode).toBe(401)
    expect(res.jsonBody).toBeUndefined()
    expect(res.body).toBe('Unauthorized: Message is not from this user.')

    // The other admin's report data must not appear in the response.
    const serialized = JSON.stringify(res)
    expect(serialized).not.toContain('broadcast owned by a different admin')
    expect(serialized).not.toContain('recipient@example.com')
    expect(serialized).not.toContain('google.com/maps/place')
  })

  it('rejects an unauthorized report before any status lookup', async () => {
    // A refusal must not reveal whether the report exists.
    await requestReport({
      email: ADMIN,
      session: VALID_SESSION,
      messageID: '2',
    })

    expect(getMessageStatus).not.toHaveBeenCalled()
    expect(statusCalls).toEqual([])
  })

  it('denies reading a report created over the REST API', async () => {
    // REST broadcasts are stored under the bot name because the REST API
    // authenticates a shared token rather than an admin, so no admin owns
    // them. They are readable only over the REST API.
    const res = await requestReport({
      email: ADMIN,
      session: VALID_SESSION,
      messageID: '3',
    })

    expect(res.statusCode).toBe(401)
    expect(res.jsonBody).toBeUndefined()
    expect(res.body).toBe('Unauthorized: Message is not from this user.')
    expect(getMessageStatus).not.toHaveBeenCalled()
    expect(JSON.stringify(res)).not.toContain(
      'broadcast created over the REST API'
    )
  })

  it("denies each admin the other admin's report symmetrically", async () => {
    // Scoping holds in both directions: neither admin can read the other's
    // report, and neither can reach the REST-created one.
    const cases = [
      { email: ADMIN, messageID: '2' },
      { email: OTHER_ADMIN, messageID: '1' },
      { email: OTHER_ADMIN, messageID: '3' },
    ]

    for (const { email, messageID } of cases) {
      const res = await requestReport({
        email,
        session: VALID_SESSION,
        messageID,
      })
      expect(res.statusCode, `${email} -> ${messageID}`).toBe(401)
      expect(res.jsonBody).toBeUndefined()
    }
  })

  it('lets each admin read their own report', async () => {
    const res = await requestReport({
      email: OTHER_ADMIN,
      session: VALID_SESSION,
      messageID: '2',
    })

    expect(res.statusCode).toBe(200)
    expect(res.jsonBody.sender).toBe(OTHER_ADMIN)
    expect(res.jsonBody.message).toBe('broadcast owned by a different admin')
  })

  it('returns 404 for a message id that does not exist', async () => {
    const res = await requestReport({
      email: ADMIN,
      session: VALID_SESSION,
      messageID: '999',
    })

    expect(res.statusCode).toBe(404)
    expect(res.body).toBe('Not Found: Message ID entry does not exist.')
    expect(getMessageStatus).not.toHaveBeenCalled()
  })

  it('rejects an invalid session code before authorizing the report', async () => {
    // Negative control: proves these tests are not bypassing authentication.
    const res = await requestReport({
      email: ADMIN,
      session: 'wrong-session-code',
      messageID: '1',
    })

    expect(res.statusCode).toBe(401)
    expect(res.body).toBe('Access denied: invalid user authentication code.')
    expect(res.jsonBody).toBeUndefined()
  })
})
