export class VayujivSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number = 2000;
  private onDataCallback: ((data: any) => void) | null = null;

  constructor(url?: string) {
    if (url) {
      this.url = url;
    } else {
      const isBrowser = typeof window !== 'undefined';
      const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const wsProto = isBrowser && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const defaultHost = isLocalhost
        ? 'ws://localhost:5001'
        : (isBrowser ? `${wsProto}//${window.location.host}` : 'ws://localhost:5001');

      this.url = (import.meta as any).env?.VITE_WS_URL || defaultHost;
    }
  }

  public connect(onData: (data: any) => void) {
    this.onDataCallback = onData;
    this.initSocket();
  }

  private initSocket() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[VAYUJIV-WS] Connected to Command Gateway');
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (this.onDataCallback) {
            this.onDataCallback(parsed);
          }
        } catch (err) {
          console.error('VAYUJIV-WS Parse Error:', err);
        }
      };

      this.ws.onclose = () => {
        console.warn('[VAYUJIV-WS] Lost connection. Reconnecting in 2s...');
        setTimeout(() => this.initSocket(), this.reconnectInterval);
      };

      this.ws.onerror = (err) => {
        console.error('[VAYUJIV-WS] Error:', err);
        this.ws?.close();
      };
    } catch (e) {
      setTimeout(() => this.initSocket(), this.reconnectInterval);
    }
  }

  public sendAction(action: string, payload: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...payload }));
    }
  }
}

export const socketService = new VayujivSocket();