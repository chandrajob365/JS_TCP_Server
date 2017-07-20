const net = require('net')
const server = net.createServer()
server.on('connection', (serverSocket) => {
  console.log('Connection event emitted ')
  serverSocket.write('Hello World')
  server.close() // Close the connection. Emits close event and calls cb
})
server.getConnections((err, clientCount) => {
  if (err) throw new Error(err)
  console.log('clientCount = ', clientCount++)
})
/* Note that if connections exist, this event is not emitted until all
    connections are ended. */
server.on('close', () => {
  console.log('server will close and will not emit any event')
})
server.listen(9000, () => (
  console.log('Server started listening @ ', JSON.stringify(server.address()))
))
