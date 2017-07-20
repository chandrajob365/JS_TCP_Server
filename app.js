const net = require('net')

const server = net.createServer(socket => {
  console.log('Server connected ')
  socket.on('data', msg => {
    console.log('<data event > msg from client @ ', socket.remoteAddress, '  = ', msg.toString())
    socket.write('You said ' + msg + ' ')
  })
  socket.on('close', () => {
    console.log('CLOSED ' + socket.remoteAddress + ' @ ' + socket.remotePort)
  })
}).listen(3000, () => {
  console.log('SERVER listening @ ', JSON.stringify(server.address()))
})
