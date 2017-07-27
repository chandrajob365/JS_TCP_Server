const Server = require('../lib/server')
const fs = require('fs')
Server.start()

Server.addRoute('GET', '/', displayForm)
Server.addRoute('POST', '/', showFileContent)

function displayForm (request, response) {
  Server.sendHtml(request, response, ` <HTML>
    <head> </head>
    <title> Test </title>
    <body>
    <h2>Upload File</h2>
    <form method="post" enctype="multipart/form-data" action="/">
      Who are you: <input type="text" name="username" /><br />
      What's your age: <input type="text" name="age" /><br />
      Choose the file to upload:
      <input type="file" name="fileID" /><br />
      <input type="submit" value="SEND" />
    </form>
    </body>
    </HTML>`)
}
//
function showFileContent (request, response) {
  console.log('<test_server.js showName > showName Entry')
  console.log('<showName> request bodyparam =', request.body)
  console.log('<showName> request.files=', request.files)
  fs.readFile(request.files.fileID.location, (err, data) => {
    if (err) throw new Error(err)
    console.log('<showName> Inside readFile data =', data)
    Server.sendHtml(request, response, data + JSON.stringify(request.body))
  })
}
