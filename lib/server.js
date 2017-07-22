const net = require('net')

const ROUTES = {
  GET: {},
  POST: {}
}

const startServer = port => {
  net.createServer(socket => {
    let request = {}
    request['header'] = {}
    request['body'] = {}
    console.log('Server connected ')
    dataEventHandler(socket, request)
    closeEventHandler(socket)
  }).listen(port, () => {
    console.log('SERVER listening @ ', port)
  })
}
const closeEventHandler = socket => {
  socket.on('close', () => {
    console.log('CLOSED ' + socket.remoteAddress + ' @ ' + socket.remotePort)
  })
}

const dataEventHandler = (socket, request) => {
  socket.on('data', rawRequest => {
    console.log('rawRequest = ', rawRequest)
    requestHandler(request, rawRequest)
    socket.write('You said ' + rawRequest + ' ')
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

const parseRequestLine = (request, requestLine, cb) => {
  requestLine = requestLine.split(' ')
  request.header.METHOD = requestLine[0]
  request.header.URI = requestLine[1]
  request.header.VERSION = requestLine[2]
  if (typeof cb === 'function') cb
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

function addRoute (method, path, func) {
  ROUTES[method][path] = func
}

function methodHandler (request, response, METHODS) {
  METHODS[request.header.METHOD](request, response)
}

function getHandler (request, response) {
  ROUTES.GET[request.header.URI](request, response)
}

function postHandler (request, response) {

}

module.exports = {
  startServer,
  addRoute
}
