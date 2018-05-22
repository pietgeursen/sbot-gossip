const PEERS_MAX_NUM = 'PEERS_MAX_NUM'

function peersMaxNum (max) {
  return {
    type: PEERS_MAX_NUM,
    payload: max
  }
}

module.exports = {
  PEERS_MAX_NUM, peersMaxNum
}
