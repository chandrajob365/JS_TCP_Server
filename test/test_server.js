const Server = require('../lib/server')

Server.start()

Server.addRoute('GET', '/', print)

function print (request, response) {
  Server.sendHtml(request, response, 'Consider it as HTML')
}
