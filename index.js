var {composeBundlesRaw, debugBundle, createReactorBundle, appTimeBundle} = require('redux-bundler')
var Connector = require('./lib/connector')
var types = require('./types')

var peersBundle = require('./peers/')
var schedulerBundle = require('./scheduler/')

function App (opts) {
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

  var createStore = composeBundlesRaw(debugBundle, createReactorBundle(), appTimeBundle, bundle, peersBundle, schedulerBundle)

  return createStore()
}

module.exports = Object.assign(App, types)
