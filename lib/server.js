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
    console.log('Client connected to Server port', JSON.stringify(socket.address()))
    dataEventHandler(socket, request)
    closeEventHandler(socket)
  }).listen(port || 3000, () => {
    console.log('SERVER listening @ ', port)
  })
}

const closeEventHandler = (socket) => {
  socket.on('close', () => {
    console.log('Client Socket CLOSED ')
  })
}

const dataEventHandler = (socket, request) => {
  socket.on('data', rawRequest => {
    console.log('rawRequest = ', rawRequest)
    requestHandler(request, rawRequest)
  })
}

const requestHandler = (request, rawRequest) => {
  let METHODS = {
    GET: getHandler,
    POST: postHandler
  }
  let response = {}
  parseRawRequest(request, rawRequest.toString())
  methodHandler(request, response, METHODS)
}

const parseRawRequest = (request, requestString) => {
  let requestParts = requestString.split('\r\n\r\n')
  let headerPart = requestParts[0].replace(/\r/g, '').split('\n')
  parseRequestLine(request, headerPart[0])
  parseRequestHeader(request, headerPart.slice(1))
  if (request['Content-Length']) {
    parseRequestBody(request, requestParts[1].replace('\n', ''))
  }
  console.log('request Header with Body = ', request)
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
    request.header[elm[0]] = elm[1].replace(/^\s+/g, '')
  })
}

const parseRequestBody = (request, msgBody) => {
  request.body = msgBody
}

const addRoute = (method, path, func) => {
  ROUTES[method][path] = func
}

const methodHandler = (request, response, METHODS) => {
  METHODS[request.header.METHOD](request, response)
}

const getHandler = (request, response) => {
  if (typeof ROUTES.GET[request.header.URI] === 'function') {
    ROUTES.GET[request.header.URI](request, response)
  } else {
    error404Handler(request, response)
  }
}

const postHandler = (request, response) => {

}

  /* Response */
const sendHTML = (request, response, content) => {
  if (content) {
    response['content'] = content
    response['Content-type'] = 'text/html'
    console.log('<sendHTML> response = ', response)
    OK200Handler(request, response)
  } else {
    // ERR400Handler(request, response)
  }
}

const OK200Handler = (request, response) => {
  response['status'] = 'HTTP/1.1 200 OK'
  if (response['content']) {
    response['content-length'] = (response['content'].length).toString()
    responseHandler(request, response)
  }
}

const error404Handler = (request, response) => {
  response['status'] = 'HTTP/1.1 418 I’m a teapot'
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
  console.log('------- responseString --------- ', responseString)
  return responseString
}

module.exports = {
  start: startServer,
  sendHtml: sendHTML,
  addRoute: addRoute
}
