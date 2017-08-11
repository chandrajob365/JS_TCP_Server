const fs = require('fs')
const mode = process.env.NODE_ENV || 'debug'
let logStream = fs.createWriteStream('./logs/logs.txt')
let log = ''

const logger = (request, response, next) => {
  let ip = request.header['Host'].split(':')[0]
  let date = new Date().toISOString()
  let method = request.header['METHOD']
  let path = request.header['URI']
  log = ip + ' -- [' + date + '] ' + method + ' , ' + path
  next()
}

const logMsg = (level, msg) => {
  if (mode === 'debug') { // All level logs should be logged in debug mode
    createAndLogMsg(level, msg)
  } else if (mode !== 'debug' && level !== 1 || level !== 2) { // In prod mode only error should be logged
    createAndLogMsg(level, msg)
  }
}

const createAndLogMsg = (level, msg) => {
  let message = (getLevel(level) || 'INFO') + ': ' + log + ' : ' + (msg || '') + ' \n'
  logStream.write(message)
}
const getLevel = level => {
  if (level === 1) return 'INFO'
  if (level === 2) return 'WARNING'
  if (level === 3) return 'ERROR'
}
module.exports = {
  logger,
  logMsg
}
