var {composeBundlesRaw, debugBundle, createReactorBundle, appTimeBundle} = require('redux-bundler')
var Connector = require('./lib/connector')
var types = require('./types')

var peersBundle = require('./peers/')
var routesBundle = require('./routes/')
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

  var createStore = composeBundlesRaw(debugBundle, createReactorBundle(), appTimeBundle, bundle, peersBundle, schedulerBundle, routesBundle)

  return createStore()
}

// module.exports = Object.assign(App, types)

module.exports = function Manager (opts) {
  var app = App(opts)

  // TODO: what obs lib?
  // var peers = Obv()

  return {
    peer: {
      addRoute: function (opts) {
        app.doAddRoute(opts)
      },
      removeRoute: function (opts) {
        app.doRemoveRoute(opts)
      },
      setPriority: function (opts) {
        app.doSetRoutePriority(opts)
      },
      remotePeerConnected: function (opts) {
        app.doInboundRouteConnected(opts)
      }
    },
    connections: {
      start: function () {

      },
      stop: function () {

      },
      setMaxByType: function (opts) {

      },
      setLifetime: function (ms) {

      },
      errors: function () {

      }
    },
    initialSync: {
      start: function () {

      },
      stop: function () {

      }
    },
    types
    // TODO:
    // peers
  }
}

module.exports.App = App
