'use strict'

function Osc (client) {
  const osc = require('node-osc')

  this.stack = []
  this.socket = null
  this.server = null
  this.inPort = 49163
  this.port = null
  this.options = { default: 49162, tidalCycles: 6010, sonicPi: 4559, superCollider: 57120, norns: 10111 }

  this.start = function () {
    if (!osc) { console.warn('OSC', 'Could not start.'); return }
    console.info('OSC', 'Starting..')
    this.setup()
    this.select()
  }

  this.clear = function () {
    this.stack = []
  }

  this.run = function () {
    for (const item of this.stack) {
      this.play(item)
    }
  }

  this.push = function (path, msg) {
    this.stack.push({ path, msg })
  }

  this.play = function ({ path, msg }) {
    if (!this.socket) { console.warn('OSC', 'Unavailable socket'); return }
    const oscMsg = new osc.Message(path)
    for (let i = 0; i < msg.length; i++) {
      oscMsg.append(client.orca.valueOf(msg.charAt(i)))
    }
    this.socket.send(oscMsg, (err) => {
      if (err) { console.warn(err) }
    })
  }

  this.select = function (port = this.options.default) {
    if (parseInt(port) === this.port) { console.warn('OSC', 'Already selected'); return }
    if (isNaN(port) || port < 1000) { console.warn('OSC', 'Unavailable port'); return }
    console.info('OSC', `Selected port: ${port}`)
    this.port = parseInt(port)
    this.setup()
  }

  this.setup = function () {
    if (!this.port) { return }
    if (this.socket) { this.socket.close() }
    this.socket = new osc.Client(client.io.ip, this.port)
    console.info('OSC', `Started socket at ${client.io.ip}:${this.port}`)

    this.server = new osc.Server(this.inPort, client.io.ip)
    console.info('OSC', `Started server at ${client.io.ip}:${this.inPort}`)

    this.server.on('message',(message) => {
      // console.log('Incoming OSC message: ', message)
      const address = message[0]
      switch (address) {
        case '/input':
          const input = parseInt(message[1])
          const value = parseInt(message[2])
          if (input.isNan || value.isNaN) {
            console.info('OSC','Ignoring invalid message')
          }
          const key = client.orca.keyOf(input)
          client.orca.oscIn[key] = clamp(value,0,255)
          break;
        default:
          console.info('OSC','Ignoring unknown message')
          break
      }
    })
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v
  }
}
