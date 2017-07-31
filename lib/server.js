const net = require('net')
const fs = require('fs')
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
  }).listen(port || 3000, () => {
    console.log('SERVER listening @ ', 3000)
  })
}

/* EventHandlers */
const closeEventHandler = (socket) => {
  console.log()
  socket.on('close', () => {
    console.log('Client Socket CLOSED ')
  })
}

const dataEventHandler = (socket, request) => {
  socket.on('data', rawRequest => {
  console.log('<dataEventHandler> rawRequest = ', rawRequest)
  // console.log('<dataEventHandler> Stringified Request = ', rawRequest.toString())
    requestHandler(request, rawRequest)
  })
}

/* Parsers */
const parseRawRequest = (request, rawRequest) => {
  let headerChunk = getHeaderChunk(rawRequest)
  let bodyChunk = getBodyChunk(rawRequest)
  // let requestParts = requestString.split(/\r\n\r\n/)
  let headerPart = headerChunk.replace(/\r/g, '').split('\n')
  console.log('<parseRawRequest> headerPart = ', headerPart)
  parseRequestLine(request, headerPart[0])
  parseRequestHeader(request, headerPart.slice(1))
  console.log('<parseRawRequest> request = ', request)
  if (request.header['Content-Length']) {
    // parseRequestBody(request, requestString.slice(requestString.indexOf('\r\n\r\n')))
    parseRequestBody(request, bodyChunk)
   }
}

const getHeaderChunk = (rawRequest) => {
  console.log('<getHeaderChunk> Entry')
  let newLineIndex = rawRequest.indexOf('\r\n\r\n')
  let headerChunk = new Buffer(newLineIndex)
  for (let i = 0; i < newLineIndex; i++) {
    headerChunk[i] = rawRequest[i]
  }
  console.log('newLineIndex = ', newLineIndex)
  console.log('!!!!!!!!!!! headerChunk = ', headerChunk)
  return headerChunk.toString()
}

const getBodyChunk = rawRequest => {
  console.log('<getBodyChunk> Entry')
  let newLineIndex = rawRequest.indexOf('\r\n\r\n')
  let bodyChunk = new Buffer((rawRequest.length - newLineIndex))
  for (let i = newLineIndex, j = 0; i < rawRequest.length; i++, j++) {
    bodyChunk[j] = rawRequest[i]
  }
  console.log('newLineIndex = ', newLineIndex)
  console.log('!!!!!!!!!!! bodyChunk = ', bodyChunk)
  return bodyChunk
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
    request.header[elm[0]] = elm[1].trim()
  })
}

/* msgBody is a string */
const parseRequestBody = (request, bodyChunk) => {
  if ((request.header['Content-Type'] === 'application/x-www-form-urlencoded')) {
    let msgBody = bodyChunk.toString().split(/\s+|&/g)
    paramParser(request, msgBody, 'body')
  } else {
    request['files'] = {}
    request.header['boundary'] = request.header['Content-Type'].split(';')[1].split('=')[1]
    multipartFormParser(request, bodyChunk)
  }
}

const multipartFormParser = (request, bodyChunk) => {
  let boundaryIndex = bodyChunk.indexOf('--' + request.header['boundary'])
  console.log('<multipartFormParser>  request.header[\'boundary\'] = ', request.header['boundary'])
  console.log('<multipartFormParser> boundaryIndex= ', boundaryIndex)
  console.log('<multipartFormParser> tChunk buffer size to be created = ',
                (boundaryIndex + '--'.length + request.header['boundary'].length))
  /* Gets multipart header+content after boundary till EOF */
  let multipartChunk = bodyChunk.slice((boundaryIndex + '--'.length + request.header['boundary'].length),
                                bodyChunk.length)
  console.log('<multipartFormParser> Stringified multipartChunk = ', multipartChunk.toString())
  console.log('<multipartFormParser> Original bodyChunk = ', bodyChunk)
  console.log('<multipartFormParser> multipartChunk.toString().indexOf(\'--\') = ',
                  multipartChunk.toString().indexOf('--'))
  /* Checks if multipart header+content has just -- i.e it doesn't have anything */
  if (multipartChunk.toString().indexOf('--') > 4) {
    partParser(request, multipartChunk)
  }
}

const partParser = (request, multipartChunk) => {
  /* Gives multipart data chunk between two boundary */
  let partChunk = multipartChunk.slice(0, multipartChunk.indexOf('--' + request.header['boundary']))
  /* Remaining multipartChunk from next boundary
      till EOF to be passed recursively to multipartFormParser */
  let remainingPartChunk = multipartChunk.slice(multipartChunk.indexOf('--' + request.header['boundary']),
                                                multipartChunk.length)
  // console.log('<partParser> Stringified partChunk =', partChunk.toString())
  console.log('<partParser> Index of Content-Type = ', partChunk.indexOf('Content-Type'))
  if (partChunk.indexOf('Content-Type') !== -1) {
    multipartWithContentType(request, partChunk)
  } else {
    multipartWithOutContentType(request, partChunk)
  }
  multipartFormParser(request, remainingPartChunk)
  // console.log('<partParser> Stringified remainingPartChunk =', remainingPartChunk.toString())
}

/* Parses multipart Element having Content-Type */
const multipartWithContentType = (request, partChunk) => {
  console.log('<multipartWithContentType> Entry')
  let file = {}
  console.log('<multipartWithContentType> partChunk index of \\r\\n\\r\\n =', partChunk.indexOf('\r\n\r\n'))
  /* Slices header part from start index till CRLF */
  let formPartHeader = partChunk
                      .slice(0, partChunk.indexOf('\r\n\r\n'))
                      .toString()
                      .replace(/^\r\n|\r\n$/g, '').split('\r\n')
  console.log('<multipartWithContentType> formPartHeader = ', formPartHeader)
  file['mime-type'] = formPartHeader[1].split(':')[1].trim()
  formPartHeader[0].split(';').slice(1).forEach(headerContent => {
    let header = headerContent.split('=')
    file[header[0].trim()] = header[1].replace(/^"|"$/g, '')
  })
  file['location'] = './upload/' + file['filename']
  console.log('<multipartWithContentType> partChunk=', partChunk)
  /* Gets content of passed multipart by slicing from CRLF till next boundary */
  let formPartData = partChunk
                     .slice((partChunk.indexOf('\r\n\r\n') + 4),
                              partChunk.indexOf('--' + request.header['boundary']))
  console.log('<multipartWithContentType> formPartData =', formPartData)
/* Write uploaded file to 'upload' location on server */
  fs.writeFile(file['location'], formPartData, function (err) {
    if (err) throw new Error(err)
    console.log('<multipartFormParser>It\'s saved! in same location.')
  })
  request.files[file.name] = file
  console.log('<multipartWithContentType> request=', request)
}

/* Parses multipart Elements not having Content-Type */
const multipartWithOutContentType = (request, partChunkString) => {
  console.log('<multipartWithOutContentType> Entry ')
  let formData = partChunkString.toString().split('\r\n\r\n')
  // let headerData = formPart.filter(elm => elm.match(/\w/))
  console.log('<multipartWithOutContentType> formPart=', formData)

  let key = formData[0].split(';')[1].split('=')[1].replace(/^"|"$/g, '')
  let val = formData[1].replace(/\r\n/, '')
  request.body = Object.assign(request.body, {[key]: val})
  console.log('<multipartWithOutContentType> request = ', request)
}

const paramParser = (request, params, reqObject) => {
  params.forEach(elm => {
    if (elm.length > 0) {
      let param = elm.split('=')
      request[reqObject][param[0]] = param[1]
    }
  })
}

/* Request Handler */
const requestHandler = (request, rawRequest) => {
  let METHODS = {
    GET: getHandler,
    POST: postHandler
  }
  let response = {}

  parseRawRequest(request, rawRequest)
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
    // multipartFormParser(request, response)
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
  console.log('<responseHandler> responseString= ', responseString)
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
