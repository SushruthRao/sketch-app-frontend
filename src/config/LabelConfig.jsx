
/*
    PAGES CONFIG
*/
export const LOGIN_CONFIG = {
  fileName: "Login.jsx",

  methods: {
    handleSubmit: "handleSubmit",
  },

  fields: [
    { id: "email", type: "email", placeholder: "Email" },
    { id: "password", type: "password", placeholder: "Password" },
  ],

  ui: {
    loginButton: {
      loginButtonText: "Login !",
      loginButtonColor: "rgba(22, 210, 25, 0.73)",
    },
  },

  messages: {
    success: "Logged in !",
    error: "Login Error !",
    uiError: "Login Failed !",
    logSuccess: "Login Successful",
    logFail: "Login Failed",
  },
};

export const REGISTER_CONFIG = {
  fileName: "Register.jsx",

  methods: {
    handleSubmit: "handleSubmit",
  },

  fields: [
    { id: "username", type: "text", placeholder: "Username" },
    { id: "email", type: "email", placeholder: "Email" },
    { id: "passwordHash", type: "password", placeholder: "Password" },
  ],

  ui: {
    registerButton: {
      registerButtonText: "Register !",
      registerButtonColor: "rgba(44, 22, 210, 0.73)",
    },
  },

  messages: {
    success: "Registration Successful !",
    error: "Registration Error",
    logSuccess: "Register Success",
    logFail: "Register Failed",
  },
};

export const HOME_CONFIG = {
  fileName: "Home.jsx",

  methods: {
    handleCreateRoom: "handleCreateRoom",
    handleJoinRoom: "handleJoinRoom",
  },

  fields: [
    { id: "username", type: "text", placeholder: "Username" },
    { id: "email", type: "email", placeholder: "Email" },
    { id: "password", type: "password", placeholder: "Password" },
  ],

  ui: {
    joinRoomInput: {
      joinRoomInputText: "Enter Room Code",
    },
    loginButton: {
      loginButtonText: "Login !",
      loginButtonColor: "rgba(22, 210, 25, 0.73)",
    },
    registerButton: {
      registerButtonText: "Register",
      registerButtonColor: "rgba(44, 22, 210, 0.73)",
    },
    logoutButton: {
      logoutButtonText: "Logout",
      logoutButtonColor: "rgba(207, 13, 26, 0.73)",
    },
    joinRoomButton: {
      joinRoomButtonText: "Join Room",
      joinRoomButtonColor: "rgba(22, 110, 210, 0.4)",
    },
  },

  roomStatus: {
    FINISHED: "FINISHED",
    PLAYING: "PLAYING",
  },

  messages: {
    createRoomSuccess: "Joined Room !",
    createRoomFailure: "Create room failure ! ",
    handleJoinRoomErrorToast: "Enter room code",
    roomHasFinishedToast: "Room has finished!",
    roomIsInProgressToast: "Room is in progress!",
  },
};

export const ROOM_CONFIG = {
    fileName : "Room.jsx",

    methods : {
        handleRoomUpdate : "handleRoomUpdate",
        handleStartGame : "handleStartGame",
        init : "useEffect init()",
        handleWebSocketError : "handleWebSocketError"
    },
    ui : {
        leaveButton : {
            leaveButtonText : "Leave",
            leaveButtonColor : "rgba(207, 13, 26, 0.73)"
        },
        startGameButton : {
            startGameButtonText : "Start",
            startGameButtonColor : "rgba(22, 210, 25, 0.73)"
        }
    },

    roomStatus:{
        PLAYER_JOINED : "PLAYER_JOINED",
        PLAYER_DISCONNECTED : "PLAYER_DISCONNECTED",
        PLAYER_RECONNECTED : "PLAYER_RECONNECTED",
        PLAYER_LEFT : "PLAYER_LEFT",
        HOST_CHANGED : "HOST_CHANGED",
        GAME_STARTED : "GAME_STARTED",
        PLAYER_DISCONNECTED_SESSION : "PLAYER_DISCONNECTED_SESSION",
        PLAYER_RECONNECTED_SESSION : "PLAYER_RECONNECTED_SESSION",
        PLAYER_LEFT_SESSION : "PLAYER_LEFT_SESSION",
        GAME_ENDED : "GAME_ENDED",
        ROUND_STARTED : "ROUND_STARTED",
        ROUND_ENDED : "ROUND_ENDED",
        CORRECT_GUESS : "CORRECT_GUESS",
        CHAT_MESSAGE : "CHAT_MESSAGE",
        ALL_ROUNDS_COMPLETE : "ALL_ROUNDS_COMPLETE",
        CANVAS_CLEAR : "CANVAS_CLEAR",
    },

    roomInitStatus : {
        PLAYING : "PLAYING"
    },

    messages : {
        playerJoinedMessage : " joined !",
        playerDisconnectedMessage : " disconnected !",
        playerReconnectedMessage : " reconnected !",
        playerLeftMessage : " left room !",
        playerHostChangeMessage : " is now the host !",
        gameStartedMessage : "Game Started !",
        playerReconnectedSessionMessage : " reconnected to game",
        playerLeftSessionMessage : " left session !",
        winnerMessage : "Game ended with winner",
        noWinnerMessage : "Game ended without winner",
        handleStartGameErrorMessage : "Need atleast 2 users to start session",
        roomFullMessage : "Room is full!"
    }
}


/*
    WHITEBOARD CONFIG
*/

export const WHITEBOARD_CONFIG = {
    colors : [
      "#000000", "#FF0000", "#00AA00", "#0000FF"
    ],
    canvas : {
      width : 800,
      height : 600,
      sendInterval : 130, 
    }
}




/*
    TOAST CONFIG
*/

export const TOAST_CONFIG = {
    default : {
        color : 'rgba(228, 225, 225, 0.80)',
        stroke : '#333',
        text : "Notification!",
        fillStyle : 'hachure',
        font : "'Gloria Hallelujah', cursive",
        successFillColor : 'rgba(14, 168, 14, 0.50)',
        errorFillColor : 'rgba(183, 25, 25, 0.50)'
    }
}
