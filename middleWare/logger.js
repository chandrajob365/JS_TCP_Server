const fs = require('fs')
const mode = process.env.NODE_ENV || 'debug'
let logStream = fs.createWriteStream('../logs/log.txt')
let log = ''

const logger = (request, response, next) => {
  let ip = request.header['Host'].split(':')[0]
  let date = new Date().toISOString()
  let method = request['METHOD']
  let path = request['URI']
  log = ip + ' -- [' + date + '] ' + method + ' , ' + path
  console.log('<logger> log = ', log)
}

const logMsg = (level, msg) => {
  // if (mode !== 'debug' && level !== 1) {
    let message = getLevel(level) + ': ' + log + ' : ' + msg + ' \n'
    logStream.write(message)
  // }
}

const getLevel = level => {
  if (level === 1) return 'info'
  if (level === 2) return 'warning'
  if (level === 3) return 'error'
}
module.exports = {
  logger,
  logMsg
}
