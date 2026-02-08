import React from 'react'
import { handleApiRequest } from './ApiService'


const USER_URL = "/user"

export const loginUser = async (loginDetails) => {
    return handleApiRequest("post", `${USER_URL}/login`, loginDetails, null)
}

export const registerUser = async (registrationDetails) => {
    return handleApiRequest("post", `${USER_URL}/register`, registrationDetails, null)
}