var test = require('tape')

var {doSetMaxNumConnections, doAddPeer} = require('../../actions/')
var reducer = require('../../reducers/')
var {initialState} = require('../../reducers/')

test('Set Peers Max', function (t) {
  var expected = 3
  var action = doSetMaxNumConnections(expected)
  var newState = reducer(initialState, action)
  t.equal(newState.get('maxConnectedPeers'), expected, 'Peers max is set')
  t.end()
})

test('Adds peers', function (t) {
  var peer = '123'
  var action = doAddPeer(peer)
  var newState = reducer(initialState, action)
  t.ok(newState.hasIn(['peers', peer]), 'Peer 1 is added')
  newState = newState.setIn(['peers', peer, 'connectionStatus'], 'CONNECTING')
  t.equal(newState.getIn(['peers', peer, 'connectionStatus']), 'CONNECTING', 'Peer is updated')
  newState = reducer(newState, action)
  t.equal(newState.getIn(['peers', peer, 'connectionStatus']), 'CONNECTING', 'Existing peer state is not over written')
  t.end()
})
