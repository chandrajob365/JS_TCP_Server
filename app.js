const net = require('net')

const server = net.createServer(socket => {
  let request = {}
  request['Req-Line'] = {}
  request['body'] = {}
  console.log('Server connected ')
  dataEventHandler(socket, request)
  closeEventHandler(socket)
}).listen(3000, () => {
  console.log('SERVER listening @ ', JSON.stringify(server.address()))
})

const closeEventHandler = socket => {
  socket.on('close', () => {
    console.log('CLOSED ' + socket.remoteAddress + ' @ ' + socket.remotePort)
  })
}
const dataEventHandler = (socket, request) => {
  socket.on('data', rawRequest => {
    requestHandler(request, rawRequest)
    socket.write('You said ' + rawRequest + ' ')
  })
}

const requestHandler = (request, rawRequest) => {
  parseRawRequest(request, rawRequest.toString())
}

const parseRawRequest = (request, requestString) => {
  let requestParts = requestString.split('\r\n\r\n')
  let headerPart = requestParts[0].replace(/\r/g, '').split('\n')
  parseRequestLine(request, headerPart[0])
  parseRequestHeader(request, headerPart.slice(1))
  console.log('request Headers = ', request)
  if (request['Content-Length']) {
    parseRequestBody(request, requestParts[1].replace('\n', ''))
  }
}

const parseRequestLine = (request, requestLine, cb) => {
  requestLine = requestLine.split(' ')
  console.log('Req-Line = ', requestLine)
  request['Req-Line'].METHOD = requestLine[0]
  request['Req-Line'].URI = requestLine[1]
  request['Req-Line'].VERSION = requestLine[2]
  console.log('Req-Line = ', request['Req-Line'])
  if (typeof cb === 'function') cb
}

const parseRequestHeader = (request, requestHeaders) => {
  requestHeaders.forEach(header => {
    header = header.replace(/:/, '&').split('&')
    request[header[0]] = header[1].replace(/^\s+/g, '')
  })
}

const parseRequestBody = (request, msgBody) => {
  request['body'] = msgBody
}
