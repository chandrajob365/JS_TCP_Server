const Server = require('../lib/server')
Server.start(7000)
Server.addRoute('GET', '/', home)

function home (request, response) {
  console.log('<CORS_test.js  home >, ENTRY')
  Server.sendHtml(request, response, `
    <HTML>
      <head> </head>
      <title> CORS FEATURE </title>
      <body>
         <button onclick="sendCORSReq()">Click </button>
         <H2> Test for CORS request made to app runningon port 3000
         <script>
        function createCORSRequest(method, url) {
                var xhr = new XMLHttpRequest();
                 if ("withCredentials" in xhr) {
                   console.log("In if")
                   xhr.open(method, url, true);
                 }
                 else {
                // Otherwise, CORS is not supported by the browser.
                        xhr = null;
                }
                return xhr;
        }
        function sendCORSReq() {
          console.log("Clicked");
                var url = 'http://localhost:3000/';
                console.log(url)
                var xhr = createCORSRequest('GET', url)
                xhr.onreadystatechange = function() {
                        if (xhr.readyState == XMLHttpRequest.DONE) {
                               alert(xhr.response);
                                }
                        }
                xhr.setRequestHeader('Content-Type', 'text/html');
                console.log('xhr= ', xhr)
                xhr.send();
        }
        </script>
      </body>
      </HTML>`)
}
