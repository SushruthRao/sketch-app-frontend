import React from 'react'
import {Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'


class WebSocketService {
    constructor() {
        console.log("[WebSocketService] constructor called for websocketservice")
        this.client = null;
        this.connected = false;
        this.listeners = {};
    }

    connect(onConnected , onError) {
        const token = localStorage.getItem("userToken");
        if(!token) {
            onError(new Error("Token not found"));
            return;
        }
        this.client = new Client(
            {
                webSocketFactory : () => new SockJS("http://localhost:8080/ws"),
                connectHeaders : {
                    Authorization : `Bearer ${token}`
                },
                debug : (str) => console.log("STOMP: ", str),
                onConnect : () => {
                    this.connected = true;
                    this.subscribeToErrors();
                    this.subscribeToWord();
                    this.subscribeToRoundState();
                    console.log("ws connected");
                    onConnected();
                },
                onStompError : (frame) => {
                    console.log("ws error ", frame);
                    onError(frame);
                },
                onWebSocketClose: () => {
                    this.connected = false;
                    console.log("ws connection closed");
                },
                reconnectDelay : 5000
            }
        );
        this.client.activate();
    }

    disconnect() {
        if(this.client)
        {
            this.client.deactivate();
            this.client = null;
            this.listeners = {};
            this.connected = false;
        }
    }

    subscribeToErrors() {
        if(!this.connected)
        {
            console.error("subscribeToErrors : not connected to ws")
            return;
        }
        this.client.subscribe('/user/queue/errors', (message) => {
            try {
                const data = JSON.parse(message.body);
                if (data.type === 'GUESS_BLOCKED') {
                    this.notify('gameError', data);
                } else {
                    this.notify('error', data);
                }
            } catch(e) {
                this.notify('error', message);
            }
        })
    }

    subscribeToWord() {
        if(!this.connected)
        {
            console.error("subscribeToWord : not connected to ws")
            return;
        }
        this.client.subscribe('/user/queue/word', (message) => {
            const data = JSON.parse(message.body);
            console.log('Word received', data);
            this.notify('word', data);
        })
    }

    subscribeToRoundState() {
        if(!this.connected)
        {
            console.error("subscribeToRoundState : not connected to ws")
            return;
        }
        this.client.subscribe('/user/queue/round-state', (message) => {
            const data = JSON.parse(message.body);
            console.log('Round state received', data);
            this.notify('roundState', data);
        })
    }

    joinRoom(roomCode)
    {
        if(!this.connected)
        {
            console.error("Not connected");
            return;
        }
        this.client.subscribe(`/topic/room/${roomCode}`, (message) => {
            const data = JSON.parse(message.body);
            console.log('Room update', data);
            this.notify('roomUpdate', data);
        })
        this.client.publish({
            destination : `/app/room/${roomCode}/join`,
            body : JSON.stringify({})
        });
        console.log(`joined room ${roomCode}`);
    }

    startGame(roomCode)
    {
        if(!this.connected)
        {
            console.log("error in websocketservice")
            return;
        }
        this.client.publish({
            destination : `/app/room/${roomCode}/start`,
            body : JSON.stringify({})
        });
        console.log(`Sent startGame client message for ${roomCode}`)
    }

    sendGuess(roomCode, message)
    {
        if(!this.connected)
        {
            console.log("error in websocketservice - not connected")
            return;
        }
        this.client.publish({
            destination : `/app/room/${roomCode}/guess`,
            body : JSON.stringify({ message: message })
        });
    }

    on(event, callback) {
        if(!this.listeners[event])
        {
            this.listeners[event] = [];
        }
        if(this.listeners[event].includes(callback))
        {
            console.warn(`Listener callback warning for ${event}`)
        }
        this.listeners[event].push(callback);
        console.log(`Added listener to ${event}`)
    }
    off(event, callback)
    {
        if(!this.listeners[event])
            return;
        const initialLength = this.listeners[event].length;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback );
        const removedCount = initialLength - this.listeners[event].length;

        console.log(`removed ${removedCount} listeners for ${event}`);
        if(this.listeners[event].length === 0)
        {
            delete this.listeners[event];
        }
    }

    notify(event, data)
    {
        if(this.listeners[event])
        {
            this.listeners[event].forEach(evnt => evnt(data));
        }
    }
}

export default new WebSocketService();