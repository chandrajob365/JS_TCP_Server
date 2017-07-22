const Server = require('../lib/server')
const inst = new Server()
inst.startServer(3000)

inst.addRoute('GET', '/', print)

function print () {
  console.log('**** From Client ***** HELLO WORLD ******')
}
