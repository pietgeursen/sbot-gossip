var {composeBundlesRaw, debugBundle, createReactorBundle} = require('redux-bundler')
var Connector = require('./lib/connector')

var peersBundle = require('./peers/')
var routesBundle = require('./routes/')
var schedulerBundle = require('./scheduler/')

module.exports = function Store (opts) {
  if (!opts.connectToPeer) { throw new Error("opts.connectToPeer must be defined. Normally it's the sbot.connect function") }

  var {connect, disconnect} = Connector(opts.connectToPeer)

  var bundle = {
    name: 'sbot-connection-manager',
    getExtraArgs: function () {
      return {
        connect,
        disconnect
      }
    }
  }

  var createStore = composeBundlesRaw(debugBundle, createReactorBundle(), bundle, peersBundle, schedulerBundle, routesBundle)

  return createStore()
}
