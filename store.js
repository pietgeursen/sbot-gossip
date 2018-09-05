var {composeBundlesRaw, debugBundle, createReactorBundle} = require('redux-bundler')
var Connector = require('./lib/connector')

var peersBundle = require('./peers/')
var routesBundle = require('./routes/')
var schedulerBundle = require('./scheduler/')

module.exports = function Store (opts) {
  if (!opts.connectToPeer) { throw new Error("opts.connectToPeer must be defined. Normally it's the sbot.connect function") }

  var {connect, disconnect} = Connector(opts.connectToPeer)
  var notifyChanges = opts.notifyChanges || function () {

  }

  // yuck hack for selector testing to set an intial state
  if (opts && opts.routes && opts.routes.initialState) {
    routesBundle.initialState = opts.routes.initialState
  }

  var bundle = {
    name: 'sbot-connection-manager',
    getExtraArgs: function () {
      return {
        connect,
        disconnect,
        notifyChanges
      }
    }
  }

  var createStore = composeBundlesRaw(debugBundle, createReactorBundle(), bundle, peersBundle, schedulerBundle, routesBundle)

  return createStore()
}
