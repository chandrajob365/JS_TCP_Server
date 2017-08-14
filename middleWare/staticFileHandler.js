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
let contentType = ''
const handler = (request, response, next) => {
  console.log('<staticFileHandler,  handler> Entry')
  contentType = getContentType(request.header.URI)
  console.log('<staticFileHandler,  handler> contentType = ', contentType)
  if (contentType) {
    let fileLoc = path.join(__dirname, '../public', request.header.URI)
    console.log('<staticFileHandler, handler> Inside if  fileLoc = ', fileLoc)
    let stream = fs.createReadStream(fileLoc)
    console.log('<staticFileHandler, handler> stream=', stream)
    errorEventHandler(stream, response, next)
    dataEventHandler(stream, response, next)
    endEventHandler(stream, response, next)
  } else {
    next()
  }
}

const errorEventHandler = (stream, response, next) => {
  stream.on('error', error => {
    if (error) {
      console.log('<staticFileHandler,, errorEventHandler> error =', error)
      response['status'] = 'HTTP/1.1 404 Not Found'
      response['content'] = 'The requested resource is not available'
      next(error)
    }
  })
}

const dataEventHandler = (stream, response, next) => {
  console.log('<staticFileHandler dataEventHandler> Entry')
  stream.on('data', data => {
    console.log('<staticFileHandler, dataEventHandler> response[\'content\'] = ', response['content'], '  data=', data)
    stream.pipe(response['content'])
  })
}

const endEventHandler = (stream, response, next) => {
  stream.on('finish', error => {
    console.log('##################### <staticFileHandler, endEventHandler> Entry #################')
    if (!error) {
      response['status'] = 'HTTP/1.1 200 OK'
      response['Content-Type'] = contentType
      next('EOF')
    }
  })
}
const getContentType = uri => {
  let fileExtension = uri.match(/\.[0-9a-z]+$/i)
  if (fileExtension) {
    fileExtension = fileExtension[0].split('.')[1]
    return CONTENT_TYPE[fileExtension]
  }
  return null
}

module.exports = {
  handler
}
