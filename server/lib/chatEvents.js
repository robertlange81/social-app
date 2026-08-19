const { EventEmitter } = require('events')

const chatEvents = new EventEmitter()
chatEvents.setMaxListeners(500)

module.exports = chatEvents
