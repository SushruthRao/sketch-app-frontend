import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    username: null,
    isAuthenticated: false,
    accessToken: null,
  },
  reducers: {
    setCredentials(state, action) {
      state.username = action.payload.username;
      state.isAuthenticated = true;
      if (action.payload.accessToken) {
        state.accessToken = action.payload.accessToken;
      }
    },
    setAccessToken(state, action) {
      state.accessToken = action.payload;
    },
    clearCredentials(state) {
      state.username = null;
      state.isAuthenticated = false;
      state.accessToken = null;
    },
  },
});

export const { setCredentials, setAccessToken, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
