const Server = require('../lib/server')

Server.start()

Server.addRoute('GET', '/about', displayForm)
Server.addRoute('POST', '/about', showName)

function displayForm (request, response) {
  Server.sendHtml(request, response, ` <HTML>
    <head> </head>
    <title> Test </title>
    <body>
    <h1> Hello </h1>
    <form method='POST' action='/about'>
      <input type = 'text' placeholder = 'Enter First Name' name = 'FName'/>
      <input type = 'text' placeholder = 'Enter Last Name' name = 'LName'/>
      <button value = 'SendName'> Get Full Name </button>
    </form>
    </body>
    </HTML>`)
}

function showName (request, response) {
  console.log('<test_server.js showName > showName Entry')
  console.log('<displayForm> request bodyparam =', request.body)
  Server.sendHtml(request, response, (request.body.FName + ' ' + request.body.LName))
}
