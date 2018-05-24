var test = require('tape')
var App = require('../')

function connectToPeer (address) {

}

test('simple', function (t) {
  var app = App({connectToPeer})
  t.ok(app, 'app is a thing')
  t.end()
})

test('throws if connectToPeer not passed in opts', function (t) {
  t.throws(() => App({}), 'throws')
  t.end()
})

test('Set Max Peers', function (t) {
  var app = App({connectToPeer})
  var expected = 3
  app.doSetMaxNumConnections(expected)

  var newState = app.getState()
  t.equal(newState.scheduler.get('maxConnectedPeers'), expected, 'Peers max is set')
  t.end()
})

test('Adds peers', function (t) {
  var app = App({connectToPeer})
  var peer = '123'
  app.doAddPeer(peer)
  var newState = app.getState()
  t.ok(newState.peers.has(peer), 'Peer 1 is added')

  // we just need to modify the state somehow so we can tell that it's different
  app.doSetPeerLongtermConnection(peer, true)
  newState = app.getState()
  t.ok(newState.peers.getIn([peer, 'isLongterm']), 'Peer 1 is now long term')

  app.doAddPeer(peer)
  newState = app.getState()
  t.ok(newState.peers.getIn([peer, 'isLongterm']), 'Peer 1 is not overwritten')

  t.end()
})
