# sbot-connection-manager

> improved gossip manager for sbot

Module that manages making connections to other sbots (peers).
Module uses redux as a data store. Hopefully redux is a commonly understood pattern that makes it easy for others to contribute.

Info given to gossip manager:
max number of peer connections at a time
a list of peers
which peers to prioritise
which peers to maintain a long term connection with
connect immediately to this peer
never connect to this peer
network wakeup change has a bug at the moment. In new one, if have been sleeping just kill all the connections.
Add ping function to help keep connections alive.

## Usage

## API

### Start initial sync

Starts an initial sync with one (optionally provided) peer.
When initial sync is happening we don't need or want to be trying to connecting to multiple peers.

```js
startInitialSync([peer])
```

### Stop initial sync

Stops an initial sync, may be resumed with `startInitialSync()`

```js
stopInitialSync()
```

### Prioritise peer

```js
setPeerPriority(peers)
```
Where `peers` is an array of objects with shape:
```js
  {
    address: multiserverAddress 
    priority: priorities.HIGH
  }
```
Where priority is an enum of HIGH, MED, LOW, BANNED.

### Add peers

```js
addPeers(peers)
```
Where `peers` is an array of objects with shape:
```js
  {
    address: multiserverAddress 
  }  
```

### Start making connections 

```js
startConnecting()
```

### Stop all connections 

```js
stopConnecting()
```

### Set maximum number of connections 

```js
setMaxConnections(max)
```
where `max` is an integer


```js
var sbotGossip = require('sbot-gossip')
```

See [api_formatting.md](api_formatting.md) for tips.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install sbot-gossip
```

## Acknowledgments

sbot-gossip was inspired by..

## See Also

- [`noffle/common-readme`](https://github.com/noffle/common-readme)
- ...

## License

MIT

