import { joinRoom, leaveRoom, leaveAllRooms, broadcastToRoom } from '../../utils/wsHub'

export default defineWebSocketHandler({
  open(peer) {
    broadcastToRoom('__internal__', { type: 'peer_open' })
    void peer
  },

  message(peer, message) {
    try {
      const data = JSON.parse(message.text())

      if (data.type === 'subscribe' && typeof data.room === 'string') {
        joinRoom(data.room, peer)
        peer.send(JSON.stringify({ type: 'subscribed', room: data.room }))
      }

      if (data.type === 'unsubscribe' && typeof data.room === 'string') {
        leaveRoom(data.room, peer)
        peer.send(JSON.stringify({ type: 'unsubscribed', room: data.room }))
      }

      if (data.type === 'ping') {
        peer.send(JSON.stringify({ type: 'pong' }))
      }
    } catch {
    }
  },

  close(peer) {
    leaveAllRooms(peer)
  },

  error(peer) {
    leaveAllRooms(peer)
  },
})
