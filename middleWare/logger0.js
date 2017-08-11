const fs = require('fs')
const Logger = exports.Logger = {}

let infoStream = fs.createWriteStream('../logs/info.txt')

let errorStream = fs.createWriteStream('../logs/error.txt')

let warningStream = fs.createWriteStream('../logs/warning.txt')

Logger.info = msg => {
  let message = 'INFO : ' + new Date().toISOString() + ' : ' + msg + ' \n'
  infoStream.write(message)
}

Logger.error = msg => {
  let message = 'ERROR : ' + new Date().toISOString() + ' : ' + msg + ' \n'
  infoStream.write(message)
}

Logger.warning = msg => {
  let message = 'WARNING : ' + new Date().toISOString() + ' : ' + msg + ' \n'
  infoStream.write(message)
}
