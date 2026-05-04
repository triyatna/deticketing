type PeerLike = { send: (data: string) => void }

const rooms = new Map<string, Set<PeerLike>>()

export function joinRoom(room: string, peer: PeerLike) {
  if (!rooms.has(room)) rooms.set(room, new Set())
  rooms.get(room)!.add(peer)
}

export function leaveRoom(room: string, peer: PeerLike) {
  rooms.get(room)?.delete(peer)
}

export function leaveAllRooms(peer: PeerLike) {
  for (const peers of rooms.values()) {
    peers.delete(peer)
  }
}

export function broadcastToRoom(room: string, payload: Record<string, unknown>) {
  const peers = rooms.get(room)
  if (!peers || peers.size === 0) return
  const msg = JSON.stringify(payload)
  for (const peer of peers) {
    try {
      peer.send(msg)
    } catch {
    }
  }
}
