import React from 'react'
import { handleApiRequest } from './ApiService'


const SESSION_URL = "/api/sessions"

export const getActiveSession = async (roomCode) => {
    return handleApiRequest("get", `${SESSION_URL}/room/${roomCode}`, null, null)
}
