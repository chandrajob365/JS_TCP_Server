const fs = require('fs')

const parseRawRequest = (request, rawRequest) => {
  let headerChunk = getHeaderChunk(rawRequest)
  let bodyChunk = getBodyChunk(rawRequest)
  let headerPart = headerChunk.replace(/\r/g, '').split('\n')
  parseRequestLine(request, headerPart[0])
  parseRequestHeader(request, headerPart.slice(1))
  if (request.header['Content-Length']) {
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
  return headerChunk.toString()
}

const getBodyChunk = rawRequest => {
  let newLineIndex = rawRequest.indexOf('\r\n\r\n')
  let bodyChunk = new Buffer((rawRequest.length - newLineIndex))
  for (let i = newLineIndex, j = 0; i < rawRequest.length; i++, j++) {
    bodyChunk[j] = rawRequest[i]
  }
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
    queryParamParser(request, msgBody, 'body')
  } else {
    request['files'] = {}
    request.header['boundary'] = request.header['Content-Type'].split(';')[1].split('=')[1]
    multipartFormParser(request, bodyChunk)
  }
}

const multipartFormParser = (request, bodyChunk) => {
  let boundaryIndex = bodyChunk.indexOf('--' + request.header['boundary'])
  /* Gets multipart header+content after boundary till EOF */
  let multipartChunk = bodyChunk.slice((boundaryIndex + '--'.length + request.header['boundary'].length),
                                bodyChunk.length)
  /* Checks if multipart header+content has just -- i.e it doesn't have anything */
  if (multipartChunk.length > (request.header['boundary'].length + 4)) {
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
  if (partChunk.indexOf('Content-Type') !== -1) {
    multipartWithContentType(request, partChunk)
  } else {
    multipartWithOutContentType(request, partChunk)
  }
  multipartFormParser(request, remainingPartChunk)
}

/* Parses multipart Element having Content-Type */
const multipartWithContentType = (request, partChunk) => {
  let file = {}
  /* Slices header part from start index till CRLF */
  let formPartHeader = partChunk
                      .slice(0, partChunk.indexOf('\r\n\r\n'))
                      .toString()
                      .replace(/^\r\n|\r\n$/g, '').split('\r\n')
  file['mime-type'] = formPartHeader[1].split(':')[1].trim()
  formPartHeader[0].split(';').slice(1).forEach(headerContent => {
    let header = headerContent.split('=')
    file[header[0].trim()] = header[1].replace(/^"|"$/g, '')
  })
  file['location'] = './upload/' + file['filename']
  /* Gets content of passed multipart by slicing from CRLF till next boundary */
  let formPartData = partChunk
                     .slice((partChunk.indexOf('\r\n\r\n') + 4),
                              partChunk.indexOf('--' + request.header['boundary']))
/* Write uploaded file to 'upload' location on server */
  fs.writeFile(file['location'], formPartData, function (err) {
    if (err) throw new Error(err)
    console.log('<multipartFormParser>It\'s saved! in same location.')
  })
  request.files[file.name] = file
}

/* Parses multipart Elements not having Content-Type */
const multipartWithOutContentType = (request, partChunkString) => {
  let formData = partChunkString.toString().split('\r\n\r\n')
  let key = formData[0].split(';')[1].split('=')[1].replace(/^"|"$/g, '')
  let val = formData[1].replace(/\r\n/, '')
  request.body = Object.assign(request.body, {[key]: val})
}

const queryStringParser = (request, queryParams, reqObject) => {
  paramParser(request, queryParams, reqObject)
}

const queryParamParser = (request, msgBody, reqObject) => {
  paramParser(request, msgBody, reqObject)
}

const paramParser = (request, params, reqObject) => {
  params.forEach(elm => {
    if (elm.length > 0) {
      let param = elm.split('=')
      request[reqObject][param[0]] = param[1]
    }
  })
}

module.exports = {
  parseRawRequest,
  queryStringParser
}
