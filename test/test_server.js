const Server = require('../lib/server')

Server.start()

Server.addRoute('GET', '/about', displayForm)
Server.addRoute('POST', '/about', showName)

function displayForm (request, response) {
  Server.sendHtml(request, response, ` <HTML>
    <head> </head>
    <title> Test </title>
    <body>
    <h2>Upload File</h2>
    <form method="post" enctype="multipart/form-data" action="/about">
      Who are you: <input type="text" name="username" /><br />
      What's your age: <input type="text" name="age" /><br />
      <!-- Choose the file to upload:
      <input type="file" name="fileID" /><br /> -->
      <input type="submit" value="SEND" />
    </form>
    </body>
    </HTML>`)
}
//
function showName (request, response) {
  console.log('<test_server.js showName > showName Entry')
  console.log('<displayForm> request bodyparam =', request.body)
  Server.sendHtml(request, response, JSON.stringify(request.body))
}
