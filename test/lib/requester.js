const nock = require('nock')
const url = require('url')
require('chai')
  .use(require('chai-as-promised'))
  .should()

const requester = require('../../lib/requester')

describe('requester', () => {
  describe('#do', () => {
    const defaultApiUrl = url.parse('https://api.mythril.ai')
    const httpApiUrl = url.parse('http://localhost:3100')
    const httpsApiUrl = url.parse('https://localhost:3100')
    const validApiKey = 'valid-api-key'
    const bytecode = 'bytecode'
    const uuid = 'my-uuid'
    const basePath = '/mythril/v1/analysis'

    it('should request analysis for http API', async () => {
      nock(httpApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .post(basePath, {
          type: 'bytecode',
          contract: bytecode
        })
        .reply(200, {
          result: 'Queued',
          uuid: uuid
        })

      await requester.do(bytecode, validApiKey, httpApiUrl).should.eventually.equal(uuid)
    })

    it('should request analysis for https API', async () => {
      nock(httpsApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .post(basePath, {
          type: 'bytecode',
          contract: bytecode
        })
        .reply(200, {
          result: 'Queued',
          uuid: uuid
        })

      await requester.do(bytecode, validApiKey, httpsApiUrl).should.eventually.equal(uuid)
    })

    it('should default to official API endpoint', async () => {
      nock(defaultApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .post(basePath, {
          type: 'bytecode',
          contract: bytecode
        })
        .reply(200, {
          result: 'Queued',
          uuid: uuid
        })

      await requester.do(bytecode, validApiKey, defaultApiUrl).should.eventually.equal(uuid)
    })

    it('should reject on api server connection failure', async () => {
      const invalidApiHostname = url.parse('http://not-a-valid-hostname')

      await requester.do(bytecode, validApiKey, invalidApiHostname).should.be.rejectedWith(Error)
    })

    it('should reject on api server 500', async () => {
      nock(httpApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .post(basePath, {
          type: 'bytecode',
          contract: bytecode
        })
        .reply(500)

      await requester.do(bytecode, validApiKey, httpApiUrl).should.be.rejectedWith(Error)
    })

    it('should reject on request limit errors', async () => {
      const expectedErrorMsg = 'request limit exceeded'
      nock(httpApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .post(basePath, {
          type: 'bytecode',
          contract: bytecode
        })
        .reply(429, {
          error: expectedErrorMsg
        })

      await requester.do(bytecode, validApiKey, httpApiUrl).should.be.rejectedWith(Error)
    })

    it('should reject on validation errors', async () => {
      const expectedErrorMsg = 'validation failed'
      nock(httpApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .post(basePath, {
          type: 'bytecode',
          contract: bytecode
        })
        .reply(400, {
          error: expectedErrorMsg
        })

      await requester.do(bytecode, validApiKey, httpApiUrl).should.be.rejectedWith(Error)
    })

    it('should reject on authentication errors', async () => {
      const inValidApiKey = 'my-invalid-api--key-sigh'

      nock(httpApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${inValidApiKey}`
        }
      })
        .post(basePath, {
          type: 'bytecode',
          contract: bytecode
        })
        .reply(401, 'Unauthorized')

      await requester.do(bytecode, inValidApiKey, httpApiUrl).should.be.rejectedWith(Error)
    })

    it('should reject on non-JSON data', async () => {
      nock(defaultApiUrl.href, {
        reqheaders: {
          authorization: `Bearer ${validApiKey}`
        }
      })
        .post(basePath, {
          type: 'bytecode',
          contract: bytecode
        })
        .reply(200, 'non-json-response')

      await requester.do(bytecode, validApiKey, defaultApiUrl).should.be.rejectedWith(SyntaxError)
    })
  })
})
