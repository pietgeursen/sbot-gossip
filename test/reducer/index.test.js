var test = require('tape')

var {doSetMaxNumConnections, doAddPeers} = require('../../actions/')
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
  var peers = ['123', '456']
  var action = doAddPeers(peers)
  var newState = reducer(initialState, action)
  t.ok(newState.hasIn(['peers', peers[0]]), 'Peer 1 is added')
  t.ok(newState.hasIn(['peers', peers[1]]), 'Peer 2 is added')
  newState = newState.setIn(['peers', peers[0], 'connectionStatus'], 'CONNECTING')
  t.equal(newState.getIn(['peers', peers[0], 'connectionStatus']), 'CONNECTING', 'Peer is updated')
  newState = reducer(newState, action)
  t.equal(newState.getIn(['peers', peers[0], 'connectionStatus']), 'CONNECTING', 'Existing peer state is not over written')
  t.end()
})
