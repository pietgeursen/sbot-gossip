var Store = require('./store')
var types = require('./types')

module.exports = function Manager (opts) {
  var app = Store(opts)

  // TODO: what obs lib?
  // var peers = Obv()

  return {
    peer: {
      addRoute: function (opts) {
        app.doAddRoute(opts)
      },
      removeRoute: function (opts) {
        app.doRouteDisconnect(opts)
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
        app.doStartScheduler()
      },
      stop: function () {
        app.doStopScheduler()
      },
      setMaxByType: function (opts) {

      },
      setMax: function (max) {
        app.doSetMaxNumConnections(max)
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
