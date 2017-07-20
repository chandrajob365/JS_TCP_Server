const net = require('net')
const clientSocket = net.connect({port: 3000, host: 'localhost'})

clientSocket.on('connect', () => {
  console.log('Client connected @ ', JSON.stringify(clientSocket.address()))
  clientSocket.write('Hello Server')
})

clientSocket.on('data', (msg) => {
  console.log('In client socket ', msg.toString())
  clientSocket.destroy()
})

clientSocket.on('close', () => {
  console.log('Client connection closed')
})
