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
  let requestParts = requestString.split(/\r\n\r\n/)
  let headerPart = requestParts[0].replace(/\r/g, '').split('\n')
  parseRequestLine(request, headerPart[0])
  parseRequestHeader(request, headerPart.slice(1))
  if (request.header['Content-Length']) {
    parseRequestBody(request, requestString.slice(requestString.indexOf('\r\n\r\n')))
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
    request.header[elm[0]] = elm[1].trim()
  })
}

/* msgBody is a string */
const parseRequestBody = (request, msgBody) => {
  if ((request.header['Content-Type'] === 'application/x-www-form-urlencoded')) {
    msgBody = msgBody.toString().split(/\s+|&/g)
    paramParser(request, msgBody, 'body')
  } else {
    multipartFormParser(request, msgBody)
  }
}

const multipartFormParser = (request, msgBody) => {
  request['files'] = {}
  /* Gets boundary from Content-Type */
  request.header['boundary'] = request.header['Content-Type'].split(';')[1].split('=')[1]
  /* Splits msgBody by boundry and removes empty elements */
  let formParts = msgBody.split('--' + request.header.boundary).filter(elm => (
    elm.match(/\w/)
  ))
  formParts.forEach(content => {
    /* Splits each element of formParts in header and body content */
    let formData = content.split('\r\n\r\n')
    /* Element without Content-Type */
    if (!content.match('Content-Type')) {
      multipartWithOutContentType(request, formData)
    } else {
      /* Element with Content-Type */
      multipartWithContentType(request, formData)
    }
  })
}

/* Parses multipart Elements not having Content-Type */
const multipartWithOutContentType = (request, formData) => {
  let key = formData[0].split(';')[1].split('=')[1].replace(/^"|"$/g, '')
  let val = formData[1].replace(/\r\n/, '')
  request.body = Object.assign(request.body, {[key]: val})
}

/* Parses multipart Element having Content-Type */
const multipartWithContentType = (request, formData) => {
  let file = {}
  /* Removes CRLF and splits array with new line as delimeter */
  let formPartHeader = formData[0].replace(/^\r\n|\r\n$/g, '').split('\r\n')
  file['mime-type'] = formPartHeader[1].split(':')[1].trim()
  formPartHeader[0].split(';').slice(1).forEach(headerContent => {
    let header = headerContent.split('=')
    file[header[0].trim()] = header[1].replace(/^"|"$/g, '')
  })
  file['location'] = './upload/' + file['filename']
  fs.writeFile(file['location'], formData[1], function (err) {
    if (err) throw new Error(err)
    console.log('<multipartFormParser>It\'s saved! in same location.')
  })
  request.files[file.name] = file
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
