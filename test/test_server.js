const Server = require('../lib/server')
const server = new Server()

server.startServer(3000)

server.addRoute('GET', '/', print)

function print (request, response) {
  server.sendHTML(request, response, 'Consider it as HTML')
}
