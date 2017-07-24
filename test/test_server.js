const Server = require('../lib/server')

Server.start()

Server.addRoute('GET', '/', print)

function print (request, response) {
  Server.sendHtml(request, response, ` <HTML>
    <head> </head>
    <title> Test </title>
    <body>
    <h1> Hello </h1>
    <input type = 'text' placeholder = 'Enter any thing' />
    </body>
    </HTML>`)
}
