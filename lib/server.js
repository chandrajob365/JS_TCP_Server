const net = require('net')

module.exports = class Server {
  constructor () {
    this.ROUTES = {
      GET: {},
      POST: {}
    }
    this.getHandler = this.getHandler.bind(this)
    this.postHandler = this.postHandler.bind(this)
  }

  startServer (port) {
    net.createServer(socket => {
      let request = {}
      request['header'] = {}
      request['body'] = {}
      request['socket'] = socket
      console.log('Client connected to Server')
      this.dataEventHandler(socket, request)
      this.closeEventHandler(socket)
    }).listen(port, () => {
      console.log('SERVER listening @ ', port)
    })
  }

  closeEventHandler (socket) {
    socket.on('close', () => {
      console.log('Client Socket CLOSED ')
    })
  }

  dataEventHandler (socket, request) {
    socket.on('data', rawRequest => {
      console.log('rawRequest = ', rawRequest)
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
    this.ROUTES[method][path] = func
  }

  methodHandler (request, response, METHODS) {
    METHODS[request.header.METHOD](request, response)
  }

  getHandler (request, response) {
    console.log('<getHandler> this.ROUTES.GET[request.header.URI] = ', this.ROUTES.GET[request.header.URI])
    this.ROUTES.GET[request.header.URI](request, response)
  }

  postHandler (request, response) {

  }

  /* Response */
  sendHTML (request, response, content) {
    if (content) {
      response['content'] = content
      response['Content-type'] = 'text/html'
      console.log('<sendHTML> response = ', response)
      this.OK200Handler(request, response)
    }
    // ERR400Handler(request, response)
  }

  OK200Handler (request, response) {
    response['status'] = 'HTTP/1.1 200 OK'
    if (response['content']) {
      response['content-length'] = (response['content'].length).toString()
      this.responseHandler(request, response)
    }
  }

  responseHandler (request, response) {
    response['Date'] = new Date().toUTCString()
    response['Connection'] = 'close'
    response['Server'] = 'netServer'
    let responseString = this.stringifyResponse(response)
    request['socket'].write(responseString, (error) => {
      if (error) console.log('####### Socket-write-error ########')
      else request['socket'].end()
    })
  }

  stringifyResponse (response) {
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
}
