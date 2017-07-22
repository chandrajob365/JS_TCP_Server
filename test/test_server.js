const server = require('../live/server')
const app = server.startServer(3000)

server.addRoute('GET', '/', print)

function print () {
  console.log('**** From Client ***** HELLO WORLD ******')
}
