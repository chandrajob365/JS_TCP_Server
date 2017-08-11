const net = require('net')
const requestParser = require('../modules/requestParser')

const ROUTES = {
  GET: {},
  POST: {}
}

const ALLOWED_ORIGIN_WITH_METHODS = {}
const MIDDLEWARES = []

const startServer = (port) => {
  net.createServer(socket => {
    let request = {}
    request['header'] = {}
    request['body'] = {}
    request['socket'] = socket
    request['params'] = {}
    console.log('Client connected to Server port', JSON.stringify(socket.address()))
    dataEventHandler(socket, request)
    closeEventHandler(socket)
  }).listen(port || 3000, () => {
    console.log('SERVER listening @ ', port || 3000)
  })
}

/* EventHandlers */
const closeEventHandler = (socket) => {
  socket.on('close', () => {
    console.log('Client Socket CLOSED ')
  })
}

const dataEventHandler = (socket, request) => {
  let timer = false
  const chunks = []
  socket.on('data', rawRequest => {
    chunks.push(rawRequest)
    clearTimeout(timer)
    timer = setTimeout(() => requestHandler(request, Buffer.concat(chunks)), 1000)
  })
}

/* Request Handler */
const requestHandler = (request, rawRequest) => {
  let METHODS = {
    GET: getHandler,
    POST: postHandler,
    OPTIONS: optionHandler
  }
  let response = {}
  requestParser.parseRawRequest(request, rawRequest)
  processMiddleware(MIDDLEWARES, request, response)
  // If request conatians ORIGIN header as part of CORS request
  if (request.header.hasOwnProperty('Origin')) {
    corsHandler(request, response)
  }
  methodHandler(request, response, METHODS)
}

const processMiddleware = (MIDDLEWARES, request, response) => {
  if (MIDDLEWARES.length > 0) {
    MIDDLEWARES[0](request, response, () => {
      processMiddleware(MIDDLEWARES.slice(1), request, response)
    })
  }
}

const addRoute = (method, path, func) => {
  ROUTES[method][path] = func
}

const methodHandler = (request, response, METHODS) => {
  METHODS[request.header.METHOD](request, response)
}

const getHandler = (request, response) => {
  if (request.header.URI.indexOf('?') !== -1) {
    let baseRoute = (request.header.URI)
                      .substring(0, request.header.URI.indexOf('?'))
    let queryParams = (request.header.URI)
                    .slice((request.header.URI.indexOf('?') + 1)
                            , request.header.URI.length).split('&')
    request.header.URI = baseRoute
    requestParser.queryStringParser(request, queryParams, 'params')
  }
  if (typeof ROUTES.GET[request.header.URI] === 'function') {
    ROUTES.GET[request.header.URI](request, response)
  } else {
    error404Handler(request, response)
  }
}

const postHandler = (request, response) => {
  if (typeof ROUTES.POST[request.header.URI] === 'function') {
    ROUTES.POST[request.header.URI](request, response)
  } else {
    error404Handler(request, response)
  }
}

const optionHandler = (request, response) => {
  if (request.header.hasOwnProperty('Origin')) {
    if (ALLOWED_ORIGIN_WITH_METHODS.hasOwnProperty(request.header.Origin)) {
      response['Access-Control-Allow-Methods'] = ALLOWED_ORIGIN_WITH_METHODS[request.header.Origin]
      if (request.header['Access-Control-Request-Headers']) {
        response['Access-Control-Allow-Headers'] = 'Content-Type' // Fix this with case statement for header types
      }
    }
  }
  OK200Handler(request, response)
}

const addAllowedOrigin = (origin, methodList) => {
  Object.assign(ALLOWED_ORIGIN_WITH_METHODS, {[origin]: methodList})
}

/* CORS handler start */
const corsHandler = (request, response) => {
  if (ALLOWED_ORIGIN_WITH_METHODS.hasOwnProperty(request.header.Origin)) {
    response['Access-Control-Allow-Origin'] = request.header.Origin
    response['Access-Control-Allow-Credentials'] = 'true'
  }
}
/* CORS handler end */

/* Middleware handler start */
const use = fn => {
  console.log('<use> fn = ', fn)
  MIDDLEWARES.push(fn)
}

/* Middleware handler end */

/* Response Handlers */
const sendHTML = (request, response, content) => {
  if (content) {
    response['content'] = content
    response['Content-type'] = 'text/html'
    OK200Handler(request, response)
  } else {
    // ERR400Handler(request, response)
  }
}

const OK200Handler = (request, response) => {
  response['status'] = 'HTTP/1.1 200 OK'
  if (response['content']) {
    response['content-length'] = response['content'].toString().length
  }
  responseHandler(request, response)
}

const error404Handler = (request, response) => {
  response['status'] = 'HTTP/1.1 404 Not Found'
  response['content'] = 'The requested resource could not be found but may be available in the future'
  response['Date'] = new Date().toUTCString()
  response['Connection'] = 'close'
  responseHandler(request, response)
}

const responseHandler = (request, response) => {
  response['Date'] = new Date().toUTCString()
  response['Connection'] = 'close'
  response['Server'] = 'netServer'
  let responseString = stringifyResponse(response)
  console.log('<responseHandler> responseString=', responseString)
  request['socket'].write(responseString, (err) => {
    if (err) console.log('####### Socket-write-error ########')
    else request['socket'].end()
  })
}

const stringifyResponse = (response) => {
  let responseString = response['status'] + '\r\n'
  for (let key in response) {
    if (response.hasOwnProperty(key) && key !== 'status' && key !== 'content') {
      responseString += key + ': ' + response[key] + '\r\n'
    }
  }
  responseString += '\r\n'
  if ('content' in response) responseString += response['content']
  return responseString
}

/* Redirect Start */
const redirect = (request, response, location) => {
  redirect302Handler(request, response, location)
}

const redirect302Handler = (request, response, location) => {
  response['status'] = 'HTTP/1.1 302 Found'
  response['Date'] = new Date().toUTCString()
  response['Location'] = location
  let responseString = stringifyResponse(response)
  request['socket'].write(responseString, (err) => {
    if (err) console.log('####### Socket-write-error ########')
    else request['socket'].end()
  })
}
/* Redirect Start */

module.exports = {
  start: startServer,
  sendHtml: sendHTML,
  addRoute,
  redirect,
  addAllowedOrigin,
  use
}
