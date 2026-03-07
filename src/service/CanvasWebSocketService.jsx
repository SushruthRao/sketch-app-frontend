import { store } from '../store/store';

// ---------------------------------------------------------------------------
// Binary protocol constants
// ---------------------------------------------------------------------------
const MSG_STROKE        = 0x01;
const MSG_CLEAR         = 0x02;
const MSG_REQUEST_STATE = 0x03; // client → server
const MSG_STATE         = 0x03; // server → client

// ---------------------------------------------------------------------------
// URL builder — converts http(s) API base to ws(s) raw canvas endpoint
// ---------------------------------------------------------------------------
function buildCanvasBinaryUrl(roomCode) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const wsBase = apiUrl.replace(/^http/, 'ws');
    const token = store.getState().auth.accessToken;
    return `${wsBase}/ws-canvas-binary?token=${encodeURIComponent(token)}&roomCode=${encodeURIComponent(roomCode)}`;
}

// ---------------------------------------------------------------------------
// Encode helpers (client → server)
// ---------------------------------------------------------------------------

function hexToRgb(hex) {
    const h = hex.startsWith('#') ? hex.slice(1) : hex;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r, g, b) {
    return '#' + r.toString(16).padStart(2, '0')
               + g.toString(16).padStart(2, '0')
               + b.toString(16).padStart(2, '0');
}

/**
 * Client → server STROKE:
 *   [0] 0x01 | [1] tool | [2-4] RGB | [5] lineWidth | [6-7] pointCount | [8..] x,y pairs
 */
function encodeClientStroke(strokeData) {
    const { tool, color, lineWidth, points } = strokeData;
    const [r, g, b] = hexToRgb(color);
    const n = points.length;
    const buf = new ArrayBuffer(1 + 1 + 3 + 1 + 2 + n * 4);
    const view = new DataView(buf);
    let o = 0;
    view.setUint8(o++, MSG_STROKE);
    view.setUint8(o++, tool === 'eraser' ? 0x01 : 0x00);
    view.setUint8(o++, r);
    view.setUint8(o++, g);
    view.setUint8(o++, b);
    view.setUint8(o++, lineWidth);
    view.setUint16(o, n, false); o += 2;
    for (const pt of points) {
        view.setUint16(o, pt.x, false); o += 2;
        view.setUint16(o, pt.y, false); o += 2;
    }
    return buf;
}

// ---------------------------------------------------------------------------
// Decode helpers (server → client)
// ---------------------------------------------------------------------------

/**
 * Server → client STROKE:
 *   [0] 0x01 | [1] tool | [2-4] RGB | [5] lineWidth | [6-7] pointCount
 *   [8..] x,y pairs | [n] usernameLen | [n+1..] username UTF-8
 */
function decodeServerStroke(view, bytes) {
    let o = 1; // skip msg_type
    const tool = view.getUint8(o++) === 0x01 ? 'eraser' : 'pen';
    const r = view.getUint8(o++), g = view.getUint8(o++), b = view.getUint8(o++);
    const color = rgbToHex(r, g, b);
    const lineWidth = view.getUint8(o++);
    const n = view.getUint16(o, false); o += 2;
    const points = [];
    for (let i = 0; i < n; i++) {
        const x = view.getUint16(o, false); o += 2;
        const y = view.getUint16(o, false); o += 2;
        points.push({ x, y });
    }
    const usernameLen = view.getUint8(o++);
    const senderUsername = new TextDecoder().decode(new Uint8Array(bytes, o, usernameLen));
    return { type: 'STROKE', tool, color, lineWidth, points, senderUsername };
}

/**
 * Server → client STATE:
 *   [0] 0x03 | [1-2] strokeCount | per stroke: tool,RGB,lineWidth,pointCount,x,y pairs
 */
function decodeCanvasState(view) {
    let o = 1; // skip msg_type
    const strokeCount = view.getUint16(o, false); o += 2;
    const strokes = [];
    for (let s = 0; s < strokeCount; s++) {
        const tool = view.getUint8(o++) === 0x01 ? 'eraser' : 'pen';
        const r = view.getUint8(o++), g = view.getUint8(o++), b = view.getUint8(o++);
        const color = rgbToHex(r, g, b);
        const lineWidth = view.getUint8(o++);
        const n = view.getUint16(o, false); o += 2;
        const points = [];
        for (let i = 0; i < n; i++) {
            const x = view.getUint16(o, false); o += 2;
            const y = view.getUint16(o, false); o += 2;
            points.push({ x, y });
        }
        strokes.push({ type: 'STROKE', tool, color, lineWidth, points });
    }
    return { type: 'CANVAS_STATE', strokes };
}

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

class CanvasWebSocketService {
    constructor() {
        console.log("[CanvasWebSocketService] constructor called");
        this.ws = null;
        this.connected = false;
        this.listeners = {};
        this.pendingCanvasState = null;
    }

    /**
     * @param {string} roomCode  - room to connect to (embedded in WS URL)
     * @param {function} onConnected
     * @param {function} onError
     */
    connect(roomCode, onConnected, onError) {
        if (this.ws) {
            this.ws.onclose = null; // prevent stale close handlers
            this.ws.close();
            this.ws = null;
        }

        const url = buildCanvasBinaryUrl(roomCode);
        const ws = new WebSocket(url);
        ws.binaryType = 'arraybuffer';
        this.ws = ws;

        ws.onopen = () => {
            this.connected = true;
            this.notify('connectionStatus', true);
            console.log('[CanvasWS] connected');
            onConnected();
        };

        ws.onmessage = (event) => {
            if (event.data instanceof ArrayBuffer) {
                this._handleBinary(event.data);
            } else {
                // Text frame = error JSON from server
                try {
                    const data = JSON.parse(event.data);
                    this.notify('canvasError', data);
                } catch {
                    this.notify('canvasError', { type: 'CANVAS_ERROR', message: 'Unexpected canvas message' });
                }
            }
        };

        ws.onerror = (err) => {
            console.error('[CanvasWS] error', err);
            onError(err);
        };

        ws.onclose = () => {
            this.connected = false;
            this.notify('connectionStatus', false);
            console.log('[CanvasWS] closed');
        };
    }

    _handleBinary(buffer) {
        const bytes = buffer;
        const view = new DataView(bytes);
        if (view.byteLength === 0) return;

        const msgType = view.getUint8(0);
        if (msgType === MSG_STROKE) {
            const stroke = decodeServerStroke(view, bytes);
            this.notify('draw', stroke);
        } else if (msgType === MSG_CLEAR) {
            this.notify('draw', { type: 'CANVAS_CLEAR' });
        } else if (msgType === MSG_STATE) {
            const state = decodeCanvasState(view);
            console.log('[CanvasWS] state received:', state.strokes.length, 'strokes');
            this.pendingCanvasState = state;
            this.notify('canvasState', state);
        } else {
            console.warn('[CanvasWS] unknown msg_type:', msgType);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        this.listeners = {};
        this.pendingCanvasState = null;
    }

    /**
     * Subscribe to draw events (STROKE and CANVAS_CLEAR) for a room.
     * Returns an unsubscribe function (mirrors the old STOMP subscription object shape).
     */
    subscribeToDraw(roomCode, callback) {
        this.on('draw', callback);
        return { unsubscribe: () => this.off('draw', callback) };
    }

    sendDrawStroke(roomCode, strokeData) {
        if (!this.connected || !this.ws) return;
        this.ws.send(encodeClientStroke(strokeData));
    }

    requestCanvasState(roomCode) {
        if (!this.connected || !this.ws) return;
        const buf = new ArrayBuffer(1);
        new DataView(buf).setUint8(0, MSG_REQUEST_STATE);
        this.ws.send(buf);
    }

    sendCanvasClear(roomCode) {
        if (!this.connected || !this.ws) return;
        const buf = new ArrayBuffer(1);
        new DataView(buf).setUint8(0, MSG_CLEAR);
        this.ws.send(buf);
    }

    consumePendingCanvasState() {
        const state = this.pendingCanvasState;
        this.pendingCanvasState = null;
        return state;
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        if (this.listeners[event].includes(callback)) {
            console.warn(`Canvas listener duplicate for ${event}`);
        }
        this.listeners[event].push(callback);
        console.log(`Canvas: added listener for ${event}`);
    }

    off(event, callback) {
        if (!this.listeners[event]) return;
        const before = this.listeners[event].length;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        console.log(`Canvas: removed ${before - this.listeners[event].length} listeners for ${event}`);
        if (this.listeners[event].length === 0) delete this.listeners[event];
    }

    notify(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
}

export default new CanvasWebSocketService();
