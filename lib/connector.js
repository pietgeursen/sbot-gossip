module.exports = function Connector (connectToPeer) {
  var peers = {}

  return {
    connect: function (address, cb) {
      connectToPeer(address, function (err, connection) {
        if (err) return cb(err)

        peers[address] = connection
        cb(null)
      })
    },
    disconnect: function (address, cb) {
      if (!peers[address]) return cb(new Error('Peer not connected'))
      peers[address].close()
      cb(null)
    }
  }
}
