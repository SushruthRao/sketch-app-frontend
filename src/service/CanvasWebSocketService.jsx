import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const CANVAS_WS_URL = import.meta.env.VITE_CANVAS_WS_URL || import.meta.env.VITE_WS_URL.replace('/ws', '/ws-canvas');

class CanvasWebSocketService {
    constructor() {
        console.log("[CanvasWebSocketService] constructor called")
        this.client = null;
        this.connected = false;
        this.listeners = {};
        this.pendingCanvasState = null;
    }

    connect(onConnected, onError) {
        const token = localStorage.getItem("userToken");
        if (!token) {
            onError(new Error("Token not found"));
            return;
        }
        this.client = new Client(
            {
                webSocketFactory: () => new SockJS(CANVAS_WS_URL),
                connectHeaders: {
                    Authorization: `Bearer ${token}`
                },
                debug: (str) => console.log("CANVAS-STOMP: ", str),
                onConnect: () => {
                    this.connected = true;
                    this.notify('connectionStatus', true);
                    this.subscribeToCanvasState();
                    console.log("canvas ws connected");
                    onConnected();
                },
                onStompError: (frame) => {
                    console.log("canvas ws error ", frame);
                    onError(frame);
                },
                onWebSocketClose: () => {
                    this.connected = false;
                    console.log("canvas ws connection closed");
                },
                reconnectDelay: 5000
            }
        );
        this.client.activate();
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
            this.listeners = {};
            this.connected = false;
            this.pendingCanvasState = null;
        }
    }

    subscribeToCanvasState() {
        if (!this.connected) {
            console.error("subscribeToCanvasState : not connected to canvas ws")
            return;
        }
        this.client.subscribe('/user/canvas-queue/canvas-state', (message) => {
            const data = JSON.parse(message.body);
            console.log('Canvas state received (canvas ws)', data);
            this.pendingCanvasState = data;
            this.notify('canvasState', data);
        })
    }

    consumePendingCanvasState() {
        const state = this.pendingCanvasState;
        this.pendingCanvasState = null;
        return state;
    }

    subscribeToDraw(roomCode, callback) {
        if (!this.connected) {
            console.error("subscribeToDraw: not connected to canvas ws");
            return null;
        }
        const subscription = this.client.subscribe(`/canvas-topic/room/${roomCode}/draw`, (message) => {
            const data = JSON.parse(message.body);
            callback(data);
        });
        console.log(`Canvas subscribed to draw for room ${roomCode}`);
        return subscription;
    }

    sendDrawStroke(roomCode, strokeData) {
        if (!this.connected) {
            console.log("error in canvaswebsocketservice - not connected")
            return;
        }
        this.client.publish({
            destination: `/app/canvas/room/${roomCode}/draw`,
            body: JSON.stringify(strokeData)
        });
    }

    requestCanvasState(roomCode) {
        if (!this.connected) return;
        this.client.publish({
            destination: `/app/canvas/room/${roomCode}/request-state`,
            body: JSON.stringify({})
        });
    }

    sendCanvasClear(roomCode) {
        if (!this.connected) return;
        this.client.publish({
            destination: `/app/canvas/room/${roomCode}/clear`,
            body: JSON.stringify({})
        });
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        if (this.listeners[event].includes(callback)) {
            console.warn(`Canvas listener callback warning for ${event}`)
        }
        this.listeners[event].push(callback);
        console.log(`Canvas: Added listener to ${event}`)
    }

    off(event, callback) {
        if (!this.listeners[event])
            return;
        const initialLength = this.listeners[event].length;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        const removedCount = initialLength - this.listeners[event].length;
        console.log(`Canvas: removed ${removedCount} listeners for ${event}`);
        if (this.listeners[event].length === 0) {
            delete this.listeners[event];
        }
    }

    notify(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(evnt => evnt(data));
        }
    }
}

export default new CanvasWebSocketService();
