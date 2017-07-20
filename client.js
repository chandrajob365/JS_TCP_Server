const net = require('net')
const clientSocket = net.connect({port: 9000, host: 'localhost'})

clientSocket.on('connect', () => {
  console.log('Client connected')
})

/* Sends data on the socket */
/* Callback parameter will be executed when the data
  is finally written out - this may not be immediately */
clientSocket.on('data', (msg) => {
  console.log('In client socket ', msg.toString())
})

setTimeout(() => {
  clientSocket.end(() => {
    console.log('disconnected from server')
  })
}, 10000)
