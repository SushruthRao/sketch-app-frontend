import React from 'react'
import { handleApiRequest } from './ApiService'


const ROOM_URL = "/api/rooms"

export const createRoom = async () => {
    return handleApiRequest("post", `${ROOM_URL}/create`, null, null)
}

export const getRoomDetails = async (roomCode) => {
    return handleApiRequest("get", `${ROOM_URL}/${roomCode}`, null, null)
}