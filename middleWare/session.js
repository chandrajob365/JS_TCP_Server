const uuidv4 = require('uuid/v4')
const SESSION = {}
/* Session Handler Start */
const sessionHandler = (request, response, next) => {
  let browserCookies = request.header.Cookie
  if (browserCookies) {
    console.log('<sessionHandler> sessionHasCookie(browserCookies)=', sessionHasCookie(browserCookies))
    if (sessionHasCookie(browserCookies)) return
    if (!sessionHasCookie(browserCookies)) {
      setSessionCookie(response)
    }
  }
  setSessionCookie(response)
  next()
}

const setSessionCookie = response => {
  let cookie = uuidv4()
  response['Set-Cookie'] = cookie
  SESSION[cookie] = {}
}

const addSession = (request, content) => {
  let browserCookies = request.header.Cookie
  if (browserCookies && sessionHasCookie(browserCookies)) {
    SESSION[browserCookies] = content
  }
}

const getSession = (request, response, next) => {
  let browserCookies = request.header.Cookie
  if (browserCookies && sessionHasCookie(browserCookies)) {
    return SESSION[browserCookies]
  }
}

const deleteSession = request => {
  let browserCookies = request.header.Cookie
  if (browserCookies && sessionHasCookie(browserCookies)) {
    delete SESSION[browserCookies]
  }
}

const sessionHasCookie = browserCookies => {
  for (let key in SESSION) {
    if (key === browserCookies) return true
  }
  return false
}
/* Session Handler End */

module.exports = {
  sessionHandler,
  addSession,
  getSession,
  deleteSession
}
