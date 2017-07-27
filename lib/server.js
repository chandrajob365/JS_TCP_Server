const net = require('net')

const ROUTES = {
  GET: {},
  POST: {}
}

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
  }).listen(port || 4000, () => {
    console.log('SERVER listening @ ', 4000)
  })
}

/* EventHandlers */
const closeEventHandler = (socket) => {
  socket.on('close', () => {
    console.log('Client Socket CLOSED ')
  })
}

const dataEventHandler = (socket, request) => {
  socket.on('data', rawRequest => {
    // console.log('<dataEventHandler> rawRequest = ', rawRequest)
    requestHandler(request, rawRequest)
  })
}

/* Parsers */
const parseRawRequest = (request, requestString) => {
  console.log('<parseRawRequest> Entry requestString = ', requestString)
  let requestParts = requestString.split('\r\n\r\n')
  console.log('-----------<parseRawRequest>-------------')
  console.log('<parseRawRequest> requestParts = ', requestParts)
  let headerPart = requestParts[0].replace(/\r/g, '').split('\n')
  parseRequestLine(request, headerPart[0])
  parseRequestHeader(request, headerPart.slice(1))
  if (request.header['Content-Length']) {
    parseRequestBody(request, requestParts.slice(1))
  }
}

const parseRequestLine = (request, requestLine) => {
  requestLine = requestLine.split(' ')
  request.header.METHOD = requestLine[0]
  request.header.URI = requestLine[1]
  request.header.VERSION = requestLine[2]
}

const parseRequestHeader = (request, requestHeaders) => {
  requestHeaders.forEach(elm => {
    elm = elm.replace(/:/, '&').split('&')
    console.log('<parseRequestHeader> elm =', elm, '  elm[1].length =', elm[1].length)
    request.header[elm[0]] = elm[1].trim()
  })
}

const parseRequestBody = (request, msgBody) => {
  console.log('<parseRequestBody> msgBody = ', msgBody)
  if((request.header['Content-Type'] === 'application/x-www-form-urlencoded')) {
      msgBody = msgBody.toString().split(/\s+|&/g)
      paramParser(request, msgBody, 'body')
  } else {
    request.header['boundary'] = request.header['Content-Type'].split(';')[1].split('=')[1]
    console.log('-----------------')
    console.log('<parseRequestBody> request.header.boundary =', request.header.boundary, ' length = ', request.header.boundary.length)
    console.log('-----------------')
    request.header.body = msgBody.toString()
    console.log('<parseRequestBody> After JOIN request.header.body = ', request.header.body)
  }
}

const multipartFormDataParsing = (request, msgBody) => {
  let multiPart = {}
  console.log('<multipartFormDataParsing> parts = ', request.header.body.split('--' + request.header.boundary))
}

const paramParser = (request, params, reqObject) => {
  params.forEach(elm => {
    let param = elm.split('=')
    request[reqObject][param[0]] = param[1]
  })
  console.log('<paramParser> request -> ', request)
}

/* Request Handler */
const requestHandler = (request, rawRequest) => {
  let METHODS = {
    GET: getHandler,
    POST: postHandler
  }
  let response = {}
  parseRawRequest(request, rawRequest.toString())
  methodHandler(request, response, METHODS)
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
    paramParser(request, queryParams, 'params')
  }
  if (typeof ROUTES.GET[request.header.URI] === 'function') {
    ROUTES.GET[request.header.URI](request, response)
  } else {
    error404Handler(request, response)
  }
}

const postHandler = (request, response) => {
  if (typeof ROUTES.POST[request.header.URI] === 'function') {
    multipartFormDataParsing(request, response)
    ROUTES.POST[request.header.URI](request, response)
  } else {
    error404Handler(request, response)
  }
}

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
    responseHandler(request, response)
  }
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

module.exports = {
  start: startServer,
  sendHtml: sendHTML,
  addRoute
}
