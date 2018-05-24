var {composeBundlesRaw, debugBundle, createReactorBundle} = require('redux-bundler')
var Connector = require('./lib/connector')

var peersBundle = require('./peers/bundle')
var schedulerBundle = require('./scheduler/bundle')

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

  var createStore = composeBundlesRaw(debugBundle, createReactorBundle(), bundle, peersBundle, schedulerBundle)

  return createStore()
}

module.exports = App
module.exports.PRIORITY_HIGH = 'PRIORITY_HIGH'
module.exports.PRIORITY_MED = 'PRIORITY_MED'
module.exports.PRIORITY_LOW = 'PRIORITY_LOW'
module.exports.PRIORITY_BANNED = 'PRIORITY_BANNED'
