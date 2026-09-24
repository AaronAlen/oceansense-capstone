// ==============================================================================
// OceanSense — Real-Time WebSocket Client & Differential Event Listener
// Demonstrates: Resilient WebSocket Auto-Reconnect & Delta Subscription
// ==============================================================================

type MessageHandler = (data: any) => void;

class OceanSenseWebSocketClient {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectDelay = 5000;

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:3000';
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('[WebSocket] Connected to OceanSense Real-Time Mesh.');
        this.emit('connection_status', { connected: true });
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type) {
            this.emit(message.type, message.data);
          }
        } catch (e) {
          console.error('[WebSocket] Error parsing message payload:', e);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.emit('connection_status', { connected: false });
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.warn('[WebSocket] Socket encountered error:', err);
        this.socket?.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    setTimeout(() => this.connect(), delay);
  }

  on(eventType: string, handler: MessageHandler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);
    return () => this.off(eventType, handler);
  }

  off(eventType: string, handler: MessageHandler) {
    this.listeners.get(eventType)?.delete(handler);
  }

  private emit(eventType: string, data: any) {
    this.listeners.get(eventType)?.forEach((handler) => handler(data));
  }

  send(type: string, data: any = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, timestamp: Date.now(), data }));
    }
  }
}

export const wsClient = new OceanSenseWebSocketClient();
