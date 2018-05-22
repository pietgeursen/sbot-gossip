const PEERS_MAX_NUM_CONNECTIONS_SET = 'PEERS_MAX_NUM_CONNECTIONS_SET'
const PEERS_ADDED = 'PEERS_ADDED'

function peersMaxConnectionsSet (max) {
  return {
    type: PEERS_MAX_NUM_CONNECTIONS_SET,
    payload: max
  }
}

function peersAdded (peers) {
  return {
    type: PEERS_ADDED,
    payload: peers
  }
}

module.exports = {
  PEERS_MAX_NUM_CONNECTIONS_SET,
  peersMaxConnectionsSet,
  PEERS_ADDED,
  peersAdded

}
