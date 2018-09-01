'use strict'
var {Record, List, fromJS} = require('immutable')
var {createSelector} = require('redux-bundler')
var { parseAddress, feedIdRegex: FeedIdRegex } = require('ssb-ref')

// peerRecords are keyed in `peers` by their pubKey.
var PeerRecord = Record({
  id: '', // The public key of the peer.
  routes: List([]), // List of ids of routes.
  blocked: false
  // eg:
  // {
  // <multiserver-address>: <routeRecord>
  // }

})

const initialState = fromJS({})

module.exports = {
  name: 'peers',
  reducer: function (state = initialState, action) {
    switch (action.type) {
      case PEER_ADDED: {
        const { address } = action.payload
        const key = getKeyFromAddress(address)

        return state.update(key, function (peer) {
          // If we don't have a peerRecord we need to make one
          if (!peer) {
            peer = PeerRecord({id: key})
          }
          return peer
        })
      }
      case PEER_REMOVED: {
        const { address } = action.payload
        const key = getKeyFromAddress(address)

        return state.delete(key)
      }
      default:
        return state
    }
  },
  doAddPeer,
  doRemovePeer,

  // TODO: should the peer selector give you the address as well? Selectors and action creators should have arg names updated to reflect if they're the peer address or the actual peer.
  selectPeers
}

function selectPeers (state) {
  return state.peers
}

const PEER_ADDED = 'PEER_ADDED'
const PEER_REMOVED = 'PEER_REMOVED'
const PEER_BLOCKED = 'PEER_BLOCKED'
const PEER_ALLOWED = 'PEER_ALLOWED'

function doAddPeer (route) {
  return {
    type: PEER_ADDED,
    payload: route
  }
}

function doRemovePeer (route) {
  return {
    type: PEER_REMOVED,
    payload: route
  }
}

var feedIdRegex = new RegExp(FeedIdRegex)

function getKeyFromAddress (address) {
  var {key} = parseAddress(address)
  return key.match(feedIdRegex)[1]
}
