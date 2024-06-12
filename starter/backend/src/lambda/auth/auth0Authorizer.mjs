import Axios from 'axios'
import jsonwebtoken from 'jsonwebtoken'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('auth')

const jwksUrl = 'https://dev-s5xamegh00opdjdn.us.auth0.com/.well-known/jwks.json'

export async function handler(event) {
  try {
    const jwtToken = await verifyToken(event.authorizationToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader) {
  const token = getToken(authHeader)
  const jwt = jsonwebtoken.decode(token, { complete: true })
  const certificate = await fetchCertificate(jwt);

  return jsonwebtoken.verify(token, certificate, { algorithms: ['RS256'] })
}

async function fetchCertificate(jwt) {
  try {
    const jwks = await fetchJwks()
    const key = jwks.keys.find((x) => x.kid == jwt.header.kid)
    if (key) {
      const x5c = key.x5c[0]
      return '-----BEGIN CERTIFICATE-----\n' + x5c + '\n-----END CERTIFICATE-----\n'
    }
    return ''
  } catch (error) {
    throw new Error('Error fetching certificate', error)
  }
}

async function fetchJwks() {
  try {
    const response = await Axios.get(jwksUrl)
    return response.data
  } catch (error) {
    console.log('Error fetching jwks', error)
    return []
  }
}

function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
