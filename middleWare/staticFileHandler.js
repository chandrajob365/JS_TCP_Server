const fs = require('fs')
const path = require('path')

const CONTENT_TYPE = {
  'html': 'text/html',
  'css': 'text/css',
  'js': 'application/javascript',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpg',
  'png': 'image/png',
  'gif': 'image/gif',
  'ico': 'image/x-icon',
  'text': 'text/plain',
  'json': 'application/json',
  'pdf': 'application/pdf'
}
const chunks = []
let contentType = ''
let folderLookupPath = ''

const handler = (request, response, next) => {
  contentType = getContentType(request.header.URI)
  if (contentType) {
    let fileLoc = path.join(__dirname, '../public', request.header.URI)
    handleStream(fileLoc, response, next)
  } else {
    if (typeof (next) === typeof (Function)) next()
  }
}

const handleStream = (fileLoc, response, next) => {
  let stream = fs.createReadStream(fileLoc)
  errorEventHandler(stream, response, next)
  dataEventHandler(stream, response, next)
  endEventHandler(stream, response, next)
}

const errorEventHandler = (stream, response, next) => {
  stream.on('error', error => {
    if (error) {
      response['status'] = 'HTTP/1.1 404 Not Found'
      response['content'] = 'The requested resource is not available'
      if (typeof (next) === typeof (Function)) next(error)
    }
  })
}

const dataEventHandler = (stream, response, next) => {
  stream.on('data', data => {
    chunks.push(data)
  })
}

const endEventHandler = (stream, response, next) => {
  stream.on('end', error => {
    if (!error) {
      response['content'] = Buffer.concat(chunks)
      response['status'] = 'HTTP/1.1 200 OK'
      response['Content-Type'] = contentType
      cleanup()
      if (contentType === 'image/x-icon') {
        response['Cache-Control'] = 'public, max-age=31536000'
      }
      if (typeof (next) === typeof (Function)) next('EOF')
    }
  })
}

const getContentType = fileName => {
  let fileExtension = fileName.match(/\.[0-9a-z]+$/i)
  if (fileExtension) {
    fileExtension = fileExtension[0].split('.')[1]
    return CONTENT_TYPE[fileExtension.toLowerCase()]
  }
  return null
}

const setViewLookUp = folderName => {
  folderLookupPath = folderName
}

const renderView = (request, response, fileName, next) => {
  contentType = getContentType(fileName)
  if (contentType) {
    let fileLoc = path.join(__dirname, folderLookupPath, fileName)
    handleStream(fileLoc, response, next)
  } else {
    if (typeof (next) === typeof (Function)) next()
  }
}

const cleanup = () => {
  if (chunks.lenght !== 0) {
    while (chunks.length > 0) chunks.pop()
  }
  if (contentType.length !== 0) contentType = ''
}
module.exports = {
  handler,
  setViewLookUp,
  renderView
}
