const Server = require('../lib/server')
const Session = require('../middleWare/session')
const logger = require('../middleWare/logger')
const staticFileHandler = require('../middleWare/staticFileHandler')
Server.start()

Server.use(Session.sessionHandler)
Server.use(logger.logger)
Server.use(staticFileHandler.handler)

staticFileHandler.setViewLookUp('../public/views')

Server.addRoute('GET', '/', login)
Server.addRoute('POST', '/loginValidation', loginValidation)
Server.addRoute('GET', '/home', home)
Server.addRoute('POST', '/success', success)
Server.addRoute('GET', '/logout', logout)
Server.addAllowedOrigin('http://localhost:7000', ['GET', 'POST'])

function login (request, response) {
  let sessionData = Session.getSession(request)
  logger.logMsg(1, sessionData)
  if (sessionData && Object.keys(sessionData).length !== 0) {
    Server.redirect(request, response, '/home')
  } else {
    staticFileHandler.renderView(request, response, 'index.html', () => {
      Server.send(request, response)
    })
  }
}

function loginValidation (request, response) {
  // Do some DB check for entered credentials
  Session.addSession(request, {userName: request.body.userName})
  Server.redirect(request, response, '/home')
}

function home (request, response) {
  let sessionData = Session.getSession(request)
  logger.logMsg(1, sessionData)
  if (Object.keys(sessionData).length === 0) {
    console.log('<home> Session cookie doesn\'t exist..............')
    Server.redirect(request, response, '/')
  } else {
    staticFileHandler.renderView(request, response, 'form.html', () => {
      Server.send(request, response)
    })
  }
}

function logout (request, response) {
  Session.deleteSession(request)
  Server.redirect(request, response, '/')
}

function success (request, response) {
  let sessionData = Session.getSession(request)
  console.log('<success> sessionData = ', sessionData)
  if (Object.keys(sessionData).length === 0) {
    Server.redirect(request, response, '/')
  } else {
    staticFileHandler.renderView(request, response, 'success.html', () => {
      Server.send(request, response)
    })
  }
}
