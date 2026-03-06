import React from 'react'
import { handleApiRequest } from './ApiService'


const ROOM_URL = "/api/rooms"

export const createRoom = async (isPublic = true) => {
    return handleApiRequest("post", `${ROOM_URL}/create`, { isPublic }, null)
}

export const getRoomDetails = async (roomCode) => {
    return handleApiRequest("get", `${ROOM_URL}/${roomCode}`, null, null)
}

export const getPublicRooms = async () => {
    return handleApiRequest("get", `${ROOM_URL}/public`, null, null)
}