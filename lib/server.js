const net = require('net')

module.exports = class Server {
  constructor () {
    this.ROUTES = {
      GET: {},
      POST: {}
    }
  }

  startServer (port) {
    net.createServer(socket => {
      let request = {}
      request['header'] = {}
      request['body'] = {}
      console.log('Client connected to Server')
      console.log('Inside startServer this = ', this)
      this.dataEventHandler(socket, request)
      this.closeEventHandler(socket)
    }).listen(port, () => {
      console.log('SERVER listening @ ', port)
    })
  }

  closeEventHandler (socket) {
    socket.on('close', () => {
      console.log('CLOSED ' + socket.remoteAddress + ' @ ' + socket.remotePort)
    })
  }

  dataEventHandler (socket, request) {
    socket.on('data', rawRequest => {
      console.log('rawRequest = ', rawRequest)
      console.log('dataEventHandler this = ', this)
      this.requestHandler(request, rawRequest)
      socket.write('You said ' + rawRequest + ' ')
    })
  }

  requestHandler (request, rawRequest) {
    let METHODS = {
      GET: this.getHandler,
      POST: this.postHandler
    }
    let response = {}
    this.parseRawRequest(request, rawRequest.toString())
    this.methodHandler(request, response, METHODS)
  }

  parseRawRequest (request, requestString) {
    let requestParts = requestString.split('\r\n\r\n')
    let headerPart = requestParts[0].replace(/\r/g, '').split('\n')
    this.parseRequestLine(request, headerPart[0])
    this.parseRequestHeader(request, headerPart.slice(1))
    if (request['Content-Length']) {
      this.parseRequestBody(request, requestParts[1].replace('\n', ''))
    }
    console.log('request Header with Body = ', request)
  }

  parseRequestLine (request, requestLine, cb) {
    requestLine = requestLine.split(' ')
    request.header.METHOD = requestLine[0]
    request.header.URI = requestLine[1]
    request.header.VERSION = requestLine[2]
    if (typeof cb === 'function') cb
  }

  parseRequestHeader (request, requestHeaders) {
    requestHeaders.forEach(elm => {
      elm = elm.replace(/:/, '&').split('&')
      request.header[elm[0]] = elm[1].replace(/^\s+/g, '')
    })
  }

  parseRequestBody (request, msgBody) {
    request.body = msgBody
  }

  addRoute (method, path, func) {
    console.log('this =====> ', this)
    this.ROUTES[method][path] = func
  }

  methodHandler (request, response, METHODS) {
    METHODS[request.header.METHOD](request, response)
  }

  getHandler (request, response) {
    console.log('this == ', this)
    ROUTES.GET[request.header.URI](request, response)
  }

  postHandler (request, response) {

  }
  test () {
    console.log('Inside test function of server')
  }
}
