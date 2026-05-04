import { onBeforeUnmount, onMounted } from 'vue'

interface UseRealtimeWsOptions {
  onUpdate?: (data: Record<string, unknown>) => void
}

export function useRealtimeWs(room: string, onUpdate: () => void, options: UseRealtimeWsOptions = {}) {
  if (!import.meta.client) return

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let intentionalClose = false
  let pingTimer: ReturnType<typeof setInterval> | null = null
  const RECONNECT_DELAY_MS = 3000
  const PING_INTERVAL_MS = 25000

  const getWsUrl = () => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${location.host}/_ws/realtime`
  }

  const clearReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  const clearPing = () => {
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
  }

  const startPing = () => {
    clearPing()
    pingTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, PING_INTERVAL_MS)
  }

  const connect = () => {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return

    try {
      ws = new WebSocket(getWsUrl())
    } catch {
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      ws!.send(JSON.stringify({ type: 'subscribe', room }))
      startPing()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'update') {
          onUpdate()
        }
      } catch {
      }
    }

    ws.onclose = () => {
      clearPing()
      if (!intentionalClose) {
        scheduleReconnect()
      }
    }

    ws.onerror = () => {
      clearPing()
      ws?.close()
    }
  }

  const scheduleReconnect = () => {
    clearReconnect()
    reconnectTimer = setTimeout(() => {
      if (!intentionalClose) connect()
    }, RECONNECT_DELAY_MS)
  }

  const disconnect = () => {
    intentionalClose = true
    clearReconnect()
    clearPing()
    if (ws) {
      ws.close()
      ws = null
    }
  }

  onMounted(() => {
    intentionalClose = false
    connect()
  })

  onBeforeUnmount(() => {
    disconnect()
  })

  return { disconnect, connect }
}
