const fs = require('fs')

const fileIO = () => {
  let readStream = fs.createReadStream('test1.txt')
  let writeStream = fs.createWriteStream('test2.txt')
  errorEventHandler(readStream)
  dataEventHandler(readStream, writeStream)
  endEventHandler(readStream)
}

const errorEventHandler = readStream => {
  readStream.on('error', error => {
    if (error) throw new Error(error)
  })
}

const dataEventHandler = (readStream, writeStream) => {
  console.log('<dataEventHandler> ENTRY......')
  readStream.on('data', data => {
    console.log('!! chunk recieved !! data.length = ', data.length, '  data = ', data)
    readStream.pipe(writeStream)
  })
}

const endEventHandler = readStream => {
  readStream.on('end', error => {
    if (!error) console.log('Read is complete')
  })
}

fileIO()
