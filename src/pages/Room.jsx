/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs";
import paperBgOld from "../assets/paper_background_old.jpg";
import webSocketService from "../service/WebSocketService";
import canvasWebSocketService from "../service/CanvasWebSocketService";
import { getRoomDetails } from "../service/RoomService";
import { getActiveSession } from "../service/SessionService";
import { useNavigate, useParams } from "react-router-dom";
import SketchTitleComponent from "../components/SketchTitleComponent";
import SketchButton from "../components/SketchButton";
import { useToast } from "../toast/CustomToastHook";
import { ROOM_CONFIG as CONFIG } from "../config/LabelConfig";
import { logger } from "../utils/Logger";
import CountdownTimer from "../components/CountdownTimer";
import SketchChatBox from "../components/SketchChatBox";
import SketchLeaderboard from "../components/SketchLeaderboard";
import Whiteboard from "../components/Whiteboard";
import SketchClipboard from "../components/SketchClipboard";
import SketchLoader from "../components/SketchLoader";
import SketchArrowToggle from "../components/SketchArrowToggle";
import AuthContext from "../auth/AuthContext";

const Room = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [room, setRoom] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [canvasWsConnected, setCanvasWsConnected] = useState(false);
  const [roomLoading, setRoomLoading] = useState(true);
  const { username, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [gameStarted, setGameStarted] = useState(false);
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [isHost, setIsHost] = useState(false);
  const wsInitialized = useRef(false);
  const hasJoined = useRef(false);
  const { showSuccessToast, showErrorToast } = useToast();
  const [disconnectedPlayers, setDisconnectedPlayers] = useState(new Set());
  const [reconnectionTimers, setReconnectionTimers] = useState({});
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [messages, setMessages] = useState([]);

  // Round state
  const [currentRound, setCurrentRound] = useState(null);
  const [totalRounds, setTotalRounds] = useState(null);
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [wordLength, setWordLength] = useState(0);
  const [roundTimer, setRoundTimer] = useState(null);
  const [scores, setScores] = useState([]);
  const [roundTransition, setRoundTransition] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [correctGuessers, setCorrectGuessers] = useState([]);
  const [totalGuessers, setTotalGuessers] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const sidebarOpenRef = useRef(false);

  const isDrawer =
    gameStarted && currentDrawer != null && currentDrawer === username;

  // Set body background to paper_background_old instantly on mount, restore on unmount
  useLayoutEffect(() => {
    const prev = document.body.style.backgroundImage;
    document.body.style.backgroundImage = `url(${paperBgOld})`;
    return () => {
      document.body.style.backgroundImage = prev;
    };
  }, []);

  const headerRef = useRef(null);
  const headerCanvasRef = useRef(null);
  const [headerDimensions, setHeaderDimensions] = useState({
    width: 0,
    height: 0,
  });

  const playersRef = useRef(null);
  const playersCanvasRef = useRef(null);
  const [playersDimensions, setPlayersDimensions] = useState({
    width: 0,
    height: 0,
  });

  const buttonsRef = useRef(null);
  const buttonsCanvasRef = useRef(null);
  const [buttonsDimensions, setButtonsDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setHeaderDimensions({ width, height });
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [roomLoading]);

  useEffect(() => {
    const canvas = headerCanvasRef.current;
    if (!canvas || headerDimensions.width === 0) return;
    const id = requestAnimationFrame(() => {
      const rc = rough.canvas(canvas);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rc.rectangle(5, 5, headerDimensions.width - 8, headerDimensions.height - 7, {
        roughness: 0.4,
        stroke: "#333",
        strokeWidth: 1.7,
        fill: "transparent",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [headerDimensions]);

  useEffect(() => {
    if (!playersRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setPlayersDimensions({ width, height });
    });
    observer.observe(playersRef.current);
    return () => observer.disconnect();
  }, [roomLoading]);

  useEffect(() => {
    const canvas = playersCanvasRef.current;
    if (!canvas || playersDimensions.width === 0) return;
    const id = requestAnimationFrame(() => {
      const rc = rough.canvas(canvas);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rc.rectangle(5, 5, playersDimensions.width - 10, playersDimensions.height - 10, {
        roughness: 0.8,
        stroke: "#333",
        strokeWidth: 1.7,
        fill: "transparent",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [playersDimensions]);

  useEffect(() => {
    if (!buttonsRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setButtonsDimensions({ width, height });
    });
    observer.observe(buttonsRef.current);
    return () => observer.disconnect();
  }, [roomLoading]);

  useEffect(() => {
    const canvas = buttonsCanvasRef.current;
    if (!canvas || buttonsDimensions.width === 0) return;
    const id = requestAnimationFrame(() => {
      const rc = rough.canvas(canvas);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rc.rectangle(5, 5, buttonsDimensions.width - 10, buttonsDimensions.height - 10, {
        roughness: 0.7,
        stroke: "#333",
        strokeWidth: 1.7,
        fill: "transparent",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [buttonsDimensions]);

  const handleWordReceived = (data) => {
    setCurrentWord(data.word);
    logger(CONFIG.fileName, "handleWordReceived", `Your word: ${data.word}`);
  };

  const handleRoundStateReceived = (data) => {
    setGameStarted(true);
    if (data.totalRounds) setTotalRounds(data.totalRounds);
    if (data.players) setScores(data.players);

    if (data.betweenRounds) {
      setCurrentRound(data.roundNumber);
      setCurrentDrawer(null);
      setRoundTimer(null);
      setRoundTransition({
        roundNumber: data.roundNumber,
        word: null,
        reason: "RECONNECTED",
      });
      logger(
        CONFIG.fileName,
        "handleRoundStateReceived",
        `Reconnected between rounds (last completed: ${data.roundNumber})`,
      );
      return;
    }

    setCurrentRound(data.roundNumber);
    setCurrentDrawer(data.drawerUsername);
    setWordLength(data.wordLength);
    setRoundTransition(null);
    if (data.totalGuessers != null) setTotalGuessers(data.totalGuessers);
    if (data.correctGuessers) setCorrectGuessers(data.correctGuessers);
    const duration = data.durationSeconds || 60;
    const remaining = duration - data.elapsedSeconds;
    if (remaining > 0) {
      setRoundTimer(Date.now() + remaining * 1000);
    }
    logger(
      CONFIG.fileName,
      "handleRoundStateReceived",
      `Reconnected to round ${data.roundNumber}, drawer: ${data.drawerUsername}`,
    );
  };

  const handleGameError = (data) => {
    showErrorToast(data.message || "Action blocked");
  };

  const handleRoomUpdate = (data) => {
    const roundEventTypes = [
      CONFIG.roomStatus.ROUND_STARTED,
      CONFIG.roomStatus.ROUND_ENDED,
      CONFIG.roomStatus.CORRECT_GUESS,
      CONFIG.roomStatus.CHAT_MESSAGE,
      CONFIG.roomStatus.ALL_ROUNDS_COMPLETE,
    ];
    if (data.players && !roundEventTypes.includes(data.type)) {
      setPlayers(data.players);
    }
    if (data.type === CONFIG.roomStatus.PLAYER_JOINED) {
      logger(
        CONFIG.fileName,
        CONFIG.methods.handleRoomUpdate,
        data.username + CONFIG.messages.playerJoinedMessage,
        data.username,
      );
      const playerJoinedChatMessage = {
        text: data.username + CONFIG.messages.playerJoinedMessage,
        isSystem: true,
      };
      setMessages((prevMessages) => [...prevMessages, playerJoinedChatMessage]);
      showSuccessToast(data.username + CONFIG.messages.playerJoinedMessage);
    } else if (data.type === CONFIG.roomStatus.PLAYER_DISCONNECTED) {
      logger(
        CONFIG.fileName,
        CONFIG.methods.handleRoomUpdate,
        data.username + CONFIG.messages.playerDisconnectedMessage,
        data.username,
      );
      setDisconnectedPlayers((prev) => new Set([...prev, data.username]));
      showErrorToast(data.username + CONFIG.messages.playerDisconnectedMessage);
      const playerDisconnectedChatMessage = {
        text: data.username + CONFIG.messages.playerDisconnectedMessage,
        isSystem: true,
      };
      setMessages((prevMessages) => [
        ...prevMessages,
        playerDisconnectedChatMessage,
      ]);
      const endTime = Date.now() + data.gracePeriod * 1000;
      setReconnectionTimers((prev) => ({
        ...prev,
        [data.username]: endTime,
      }));

      setTimeout(() => {
        setReconnectionTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[data.username];
          return newTimers;
        });
      }, data.gracePeriod * 1000);
    } else if (data.type === CONFIG.roomStatus.PLAYER_RECONNECTED) {
      logger(
        CONFIG.fileName,
        CONFIG.methods.handleRoomUpdate,
        data.username + CONFIG.messages.playerReconnectedMessage,
        data.username,
      );
      setDisconnectedPlayers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.username);
        return newSet;
      });

      setReconnectionTimers((prev) => {
        const newTimers = { ...prev };
        delete newTimers[data.username];
        return newTimers;
      });
      showSuccessToast(
        data.username + CONFIG.messages.playerReconnectedMessage,
      );
    } else if (data.type === CONFIG.roomStatus.PLAYER_LEFT) {
      logger(
        CONFIG.fileName,
        CONFIG.methods.handleRoomUpdate,
        data.username + CONFIG.messages.playerLeftMessage,
        data.username,
      );

      setDisconnectedPlayers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.username);
        return newSet;
      });
      const playerLeftChatMessage = {
        text: data.username + CONFIG.messages.playerLeftMessage,
        isSystem: true,
      };
      setMessages((prevMessages) => [...prevMessages, playerLeftChatMessage]);
      setReconnectionTimers((prev) => {
        const newTimers = { ...prev };
        delete newTimers[data.username];
        return newTimers;
      });

      showErrorToast(data.username + CONFIG.messages.playerLeftMessage);
    } else if (data.type === CONFIG.roomStatus.HOST_CHANGED) {
      logger(
        CONFIG.fileName,
        CONFIG.methods.handleRoomUpdate,
        data.newHost + CONFIG.messages.playerHostChangeMessage,
        data.newHost,
      );
      showSuccessToast(data.newHost + CONFIG.messages.playerHostChangeMessage);
      const hostChangedChatMessage = {
        text: data.newHost + CONFIG.messages.playerHostChangeMessage,
        isSystem: true,
      };
      setMessages((prevMessages) => [...prevMessages, hostChangedChatMessage]);
      if (data.newHost === username) {
        setIsHost(true);
      }
    } else if (data.type === CONFIG.roomStatus.GAME_STARTED) {
      setGameStarted(true);
      setSession(data);
      setTotalRounds(data.totalRounds);
      logger(
        CONFIG.fileName,
        CONFIG.methods.handleRoomUpdate,
        CONFIG.messages.gameStartedMessage,
      );

      const gameStartedChatMessage = {
        text: CONFIG.messages.gameStartedMessage,
        isSystem: true,
      };
      setMessages((prevMessages) => [...prevMessages, gameStartedChatMessage]);

      showSuccessToast(CONFIG.messages.gameStartedMessage);
    } else if (data.type === CONFIG.roomStatus.PLAYER_RECONNECTED_SESSION) {
      logger(
        CONFIG.fileName,
        CONFIG.methods.handleRoomUpdate,
        data.username + CONFIG.messages.playerReconnectedSessionMessage,
        data.username,
      );
      setDisconnectedPlayers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.username);
        return newSet;
      });
      setReconnectionTimers((prev) => {
        const newTimers = { ...prev };
        delete newTimers[data.username];
        return newTimers;
      });

      const playerReconnectedChatMessage = {
        text: data.username + CONFIG.messages.playerReconnectedSessionMessage,
        isSystem: true,
      };
      setMessages((prevMessages) => [
        ...prevMessages,
        playerReconnectedChatMessage,
      ]);
      showSuccessToast(
        `${data.username} ${CONFIG.messages.playerReconnectedSessionMessage}`,
      );
    } else if (data.type === CONFIG.roomStatus.PLAYER_LEFT_SESSION) {
      logger(
        CONFIG.fileName,
        CONFIG.methods.handleRoomUpdate,
        data.username + CONFIG.messages.playerLeftSessionMessage,
        data.username,
      );
      const playerLeftSessionChatMessage = {
        text: data.username + CONFIG.messages.playerLeftSessionMessage,
        isSystem: true,
      };
      setMessages((prevMessages) => [
        ...prevMessages,
        playerLeftSessionChatMessage,
      ]);
      showSuccessToast(
        data.username + CONFIG.messages.playerLeftSessionMessage,
      );
    } else if (data.type === CONFIG.roomStatus.PLAYER_DISCONNECTED_SESSION) {
      logger(
        CONFIG.fileName,
        CONFIG.methods.handleRoomUpdate,
        `${data.username} disconnected from game (${data.gracePeriod}s)`,
        data.username,
      );
      setDisconnectedPlayers((prev) => new Set([...prev, data.username]));
      const gameEndTime = Date.now() + data.gracePeriod * 1000;
      showErrorToast(
        `${data.username} disconnected (${data.gracePeriod}s to rejoin)`,
      );
      setReconnectionTimers((prev) => ({
        ...prev,
        [data.username]: gameEndTime,
      }));
      const playerDisconnectedSessionChatMessage = {
        text: data.username + CONFIG.messages.playerLeftSessionMessage,
        isSystem: true,
      };
      setMessages((prevMessages) => [
        ...prevMessages,
        playerDisconnectedSessionChatMessage,
      ]);
      setTimeout(() => {
        setReconnectionTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[data.username];
          return newTimers;
        });
      }, data.gracePeriod * 1000);

      // --- Round-related message types ---
    } else if (data.type === CONFIG.roomStatus.ROUND_STARTED) {
      setCurrentRound(data.roundNumber);
      setTotalRounds(data.totalRounds);
      setCurrentDrawer(data.drawerUsername);
      setWordLength(data.wordLength);
      setCurrentWord(null);
      setRoundTransition(null);
      setRoundTimer(
        data.durationSeconds ? Date.now() + data.durationSeconds * 1000 : null,
      );
      setCorrectGuessers([]);
      setTotalGuessers(data.players ? data.players.length - 1 : 0);
      if (data.players) {
        setScores(data.players);
      }
      const roundStartedMsg = {
        text: `Round ${data.roundNumber}! ${data.drawerUsername} is drawing`,
        isSystem: true,
      };
      setMessages((prev) => [...prev, roundStartedMsg]);
      showSuccessToast(
        `Round ${data.roundNumber} - ${data.drawerUsername} is drawing`,
      );
    } else if (data.type === CONFIG.roomStatus.ROUND_ENDED) {
      setRoundTimer(null);
      setCurrentWord(null);
      setCurrentDrawer(null);
      setCorrectGuessers([]);
      setRoundTransition({
        word: data.word,
        reason: data.reason,
        roundNumber: data.roundNumber,
      });
      const roundEndedMsg = {
        text: `Round ${data.roundNumber} ended! The word was: ${data.word}`,
        isSystem: true,
      };
      setMessages((prev) => [...prev, roundEndedMsg]);
    } else if (data.type === CONFIG.roomStatus.CORRECT_GUESS) {
      setCorrectGuessers((prev) => [...prev, data.username]);
      setScores((prev) =>
        prev.map((s) =>
          s.username === data.username
            ? { ...s, score: (s.score || 0) + data.score }
            : s,
        ),
      );
      const correctMsg = {
        text: `${data.username} guessed correctly! (+${data.score} points)`,
        isSystem: true,
        isCorrectGuess: true,
      };
      setMessages((prev) => [...prev, correctMsg]);
      showSuccessToast(`${data.username} guessed correctly!`);
    } else if (data.type === CONFIG.roomStatus.CHAT_MESSAGE) {
      const chatMsg = {
        text: data.message,
        username: data.username,
        isMe: data.username === username,
      };
      setMessages((prev) => [...prev, chatMsg]);
      if (!sidebarOpenRef.current) setUnreadCount((n) => n + 1);
    } else if (data.type === CONFIG.roomStatus.ALL_ROUNDS_COMPLETE) {
      setScores(data.finalScores || []);
      setRoundTimer(null);
      setCurrentRound(null);
      setCurrentWord(null);
      setCurrentDrawer(null);
      setRoundTransition(null);
      setGameStarted(false);
      setIsGameEnded(true);
      setGameOverData({
        finalScores: data.finalScores || [],
        winner: data.winner,
      });
      const gameOverMsg = {
        text: `Game over! Winner: ${data.winner || "No winner"}`,
        isSystem: true,
      };
      setMessages((prev) => [...prev, gameOverMsg]);
      showSuccessToast(`Game over! Winner: ${data.winner}`);
      canvasWebSocketService.disconnect();
      webSocketService.disconnect();
      setWsConnected(false);
      setCanvasWsConnected(false);
    } else if (data.type === CONFIG.roomStatus.GAME_ENDED) {
      canvasWebSocketService.disconnect();
      webSocketService.disconnect();
      setWsConnected(false);
      setCanvasWsConnected(false);
      setGameStarted(false);
      setIsGameEnded(true);
      setSession(null);
      setCurrentRound(null);
      setCurrentWord(null);
      setCurrentDrawer(null);
      setRoundTimer(null);
      setRoundTransition(null);
      if (data.finalScores) {
        setGameOverData({
          finalScores: data.finalScores,
          winner: data.winner,
        });
      }
      logger(
        CONFIG.fileName,
        CONFIG.methods.handleRoomUpdate,
        data.winner,
        data.winner,
      );
      const gameEndedChatMessage = {
        text: data.winner
          ? `Game ended! Winner: ${data.winner}`
          : `Game ended!`,
        isSystem: true,
      };
      setMessages((prevMessages) => [...prevMessages, gameEndedChatMessage]);
      showErrorToast(
        data.winner ? `Game ended! Winner: ${data.winner}` : "Game ended!",
      );
    } else {
      logger(
        CONFIG.fileName,
        CONFIG.methods.handleRoomUpdate,
        `Unhandled message type: ${data.type}`,
        data,
      );
    }
  };

  const handleCanvasError = useCallback(
    (errorData) => {
      showErrorToast(errorData.message || "A canvas error occurred");
      logger(CONFIG.fileName, "handleCanvasError", "Canvas Error", errorData);
    },
    [showErrorToast],
  );

  const handleWebSocketError = useCallback(
    (errorData) => {
      showErrorToast(`Error connecting to websocket !`);
      logger(
        CONFIG.fileName,
        CONFIG.methods.handleWebSocketError,
        "WS Error",
        errorData,
      );
      setTimeout(() => {
        canvasWebSocketService.disconnect();
        webSocketService.disconnect();
        setWsConnected(false);
        setCanvasWsConnected(false);
        navigate("/");
      });
    },
    [navigate, showErrorToast],
  );

  const handleLeave = () => {
    canvasWebSocketService.disconnect();
    webSocketService.disconnect();
    navigate("/");
  };

  const handleStartGame = () => {
    if (players.length < 2) {
      showErrorToast(CONFIG.messages.handleStartGameErrorMessage);
      return;
    }
    console.log("Starting session..");
    webSocketService.startGame(roomCode);
  };

  useEffect(() => {
    console.log(players);
    players.forEach((player) => {
      if (player.username == username && player.isHost) {
        setIsHost(true);
      }
    });
  }, [players]);

  // Track canvas WebSocket connection status
  useEffect(() => {
    const handleCanvasStatus = (status) => {
      setCanvasWsConnected(status === true);
    };
    canvasWebSocketService.on("connectionStatus", handleCanvasStatus);
    return () => {
      canvasWebSocketService.off("connectionStatus", handleCanvasStatus);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const init = async () => {
      try {
        const response = await getRoomDetails(roomCode);
        console.log("RESPONSE - > ");
        console.log(response);

        if (!response || !response.success) {
          navigate("/404");
          return;
        }

        setRoom(response.room);
        setPlayers(response.players);
        if (response.room.status === CONFIG.roomInitStatus.PLAYING) {
          setGameStarted(true);
          try {
            const sessionRes = await getActiveSession(roomCode);
            if (sessionRes && sessionRes.session) {
              setTotalRounds(sessionRes.session.totalRounds);
              if (sessionRes.session.currentRound > 0) {
                setCurrentRound(sessionRes.session.currentRound);
              }
            }
            if (sessionRes && sessionRes.players) {
              setScores(sessionRes.players);
            }
          } catch (e) {
            console.error("Failed to pre-load session data", e);
          }
        }
        if (!wsInitialized.current) {
          wsInitialized.current = true;
          webSocketService.on("roomUpdate", handleRoomUpdate);
          webSocketService.on("error", handleWebSocketError);
          webSocketService.on("word", handleWordReceived);
          webSocketService.on("roundState", handleRoundStateReceived);
          webSocketService.on("gameError", handleGameError);
          canvasWebSocketService.on("canvasError", handleCanvasError);
          if (!webSocketService.connected) {
            webSocketService.connect(
              () => {
                canvasWebSocketService.connect(
                  () => {
                    setWsConnected(true);
                    setRoomLoading(false);
                  },
                  (err) => {
                    console.error("Canvas WS error:", err);
                    setWsConnected(true);
                    setRoomLoading(false);
                  },
                );
              },
              (err) => {
                console.error(err);
                setRoomLoading(false);
              },
            );
          } else if (!canvasWebSocketService.connected) {
            canvasWebSocketService.connect(
              () => {
                setWsConnected(true);
                setRoomLoading(false);
              },
              (err) => {
                console.error("Canvas WS error:", err);
                setWsConnected(true);
                setRoomLoading(false);
              },
            );
          } else {
            setWsConnected(true);
            setRoomLoading(false);
          }
        }
      } catch (err) {
        logger(
          CONFIG.fileName,
          CONFIG.methods.init,
          "Error fetching room",
          err,
        );
        navigate("/404");
      }
    };

    init();

    return () => {
      webSocketService.off("roomUpdate", handleRoomUpdate);
      webSocketService.off("error", handleWebSocketError);
      webSocketService.off("word", handleWordReceived);
      webSocketService.off("roundState", handleRoundStateReceived);
      webSocketService.off("gameError", handleGameError);
      canvasWebSocketService.off("canvasError", handleCanvasError);
      canvasWebSocketService.disconnect();
      webSocketService.disconnect();
      wsInitialized.current = false;
      hasJoined.current = false;
    };
  }, [roomCode, isAuthenticated, authLoading]);

  // Join room after Whiteboard mounts so its canvasState listener is ready
  useEffect(() => {
    if (!roomLoading && wsConnected && !hasJoined.current) {
      hasJoined.current = true;
      webSocketService.joinRoom(roomCode);
    }
  }, [roomLoading, wsConnected, roomCode]);

  const handleChatSendMessage = (text) => {
    if (!text.trim()) return;
    if (gameStarted && isDrawer) return;
    webSocketService.sendGuess(roomCode, text);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      sidebarOpenRef.current = next;
      if (next) setUnreadCount(0);
      return next;
    });
  };

  const getPlayerScore = (playerUsername) => {
    const scoreEntry = scores.find((s) => s.username === playerUsername);
    return scoreEntry ? scoreEntry.score : 0;
  };

  if (roomLoading) {
    return <SketchLoader message="Connecting to room..." />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      <div ref={headerRef} className="shrink-0 relative font-gloria">
        <canvas
          ref={headerCanvasRef}
          width={headerDimensions.width}
          height={headerDimensions.height}
          className="absolute inset-0 -z-10"
        />
        <div className="flex items-center justify-between px-4 py-2">

          <div className="flex items-center gap-2 mr-3">
            <span className="text-sm sm:text-lg font-bold">{`Room: ${roomCode}`}</span>
            <div className="flex items-center gap-1.5">
              <div
                className={`h-2.5 w-2.5 hidden sm:block rounded-full ${wsConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                title="Game WebSocket"
              />
              <div
                className={`h-2.5 w-2.5 hidden sm:block rounded-full ${canvasWsConnected ? "bg-blue-500 animate-pulse" : "bg-red-500"}`}
                title="Canvas WebSocket"
              />
              <span className="text-xs hidden sm:block text-gray-500">
                {wsConnected && canvasWsConnected ? "Connected" : wsConnected ? "Canvas DC" : "Disconnected"}
              </span>
            </div>
            {gameStarted && !isGameEnded && (
              <span className="text-xs hidden sm:block  text-green-600 font-bold">
                LIVE
              </span>
            )}
            {isGameEnded && (
              <span className="text-xs text-red-600 font-bold">ENDED</span>
            )}
          </div>

          {/* Center: Round info (only during active game) */}
          {gameStarted && currentRound && !isGameEnded && (
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-3 text-xs sm:text-sm text-center">
              <span className="font-bold">
                Round {currentRound}{totalRounds ? `/${totalRounds}` : ""}
              </span>
              <span className="hidden sm:block text-gray-500">|</span>
              <span className="text-gray-700">
                <span className="text-black font-bold">{currentDrawer}</span>
                {" "}drawing
                {isDrawer && (
                  <span className="text-blue-600 font-bold"> (You)</span>
                )}
              </span>
              {totalGuessers > 0 && (
                <span className="hidden sm:flex items-center gap-3">
                  <span className="text-gray-500">|</span>
                  <span className="text-gray-500">
                    {correctGuessers.length}/{totalGuessers} guessed
                  </span>
                </span>
              )}
            </div>
          )}

  
        </div>
      </div>

      {/* Mobile backdrop — closes drawer when tapping canvas */}
      {sidebarOpen && !gameOverData && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={handleSidebarToggle}
        />
      )}

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        <div className={`relative min-h-0 flex flex-col items-center p-2 md:p-4 overflow-hidden h-[88dvh] md:h-auto md:flex-1 ${gameOverData ? 'justify-start overflow-y-auto' : 'justify-center'}`}>
          {!gameStarted && !isGameEnded && (
            <div className="flex-1 min-h-0 w-full flex flex-col items-center overflow-hidden">
              <div className="shrink-0 py-1 sm:py-2 font-gloria text-center">
                <span className="text-lg sm:text-xl md:text-2xl font-bold flex items-center justify-center gap-2 whitespace-nowrap">
                  Room : {roomCode}
                  <SketchClipboard roomCode={roomCode} height={28} width={28} />
                </span>
                <span className="text-gray-500 text-xs sm:text-sm">
                  Waiting for players... ({players.length})
                </span>
              </div>
              <div className="flex-1 min-h-0 w-full flex flex-row items-center justify-center overflow-hidden mt-1 px-2 sm:px-4 gap-2">
                <Whiteboard roomCode={roomCode} isDrawer={true} isLobby={true} />
              </div>
            </div>
          )}

          {gameStarted && currentRound && !isGameEnded && !roundTransition && (
            <div className="flex-1 min-h-0 w-full flex flex-col items-center overflow-hidden">
              <div className="shrink-0 flex flex-row flex-wrap justify-center py-1 sm:py-2 font-gloria text-center gap-1">
                {isDrawer && currentWord && (
                  <div className="relative inline-block px-4 sm:px-6 py-1 sm:py-2">
                    <span className="relative z-10 text-green-700 text-base sm:text-xl font-bold">
                      Your word is: {currentWord}
                    </span>
                    <div
                      className="absolute inset-0 -z-10 border-2 border-black"
                      style={{
                        borderRadius:
                          "255px 15px 225px 15px/15px 225px 15px 255px",
                      }}
                    />
                  </div>
                )}
                {!isDrawer && wordLength > 0 && (
                  <div className="relative inline-block px-4 sm:px-6 py-1 sm:py-2">
                    <span className="relative z-10 text-gray-700 text-sm sm:text-xl font-bold">
                      Guess the word! ({wordLength} letters)
                    </span>
                    <div
                      className="absolute inset-0 -z-10 border-2 border-black"
                      style={{
                        borderRadius:
                          "255px 15px 225px 15px/15px 225px 15px 255px",
                      }}
                    />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {roundTimer && (
                    <CountdownTimer endTime={roundTimer} enableIcon={true} />
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 w-full flex flex-row items-center justify-center overflow-hidden mt-1 sm:mt-3 px-2 sm:px-4 gap-2">

                <Whiteboard roomCode={roomCode} isDrawer={isDrawer} />

              </div>
            </div>
          )}

          {roundTransition && !isGameEnded && !gameOverData && (
            <div className="w-full max-w-md text-center font-gloria p-4 bg-yellow-50 border-2 border-black/20 rounded-lg">
              {roundTransition.word ? (
                <>
                  <div className="text-lg">
                    Round {roundTransition.roundNumber} ended!
                  </div>
                  <div className="text-xl font-bold mt-1">
                    The word was: {roundTransition.word}
                  </div>
                </>
              ) : (
                <div className="text-lg">Waiting for next round...</div>
              )}
              <div className="text-sm text-gray-500 mt-1">
                Next round starting soon...
              </div>
            </div>
          )}

          {/* Game Over Scoreboard */}
          {gameOverData && (
            <SketchLeaderboard
              finalScores={gameOverData.finalScores}
              winner={gameOverData.winner}
              onHome={() => navigate("/")}
            />
          )}

          {/* Mobile toggle button — floats over canvas bottom-right */}
          {!gameOverData && (
            <div className="absolute bottom-0 right-3 z-30 md:hidden">
              <SketchArrowToggle
                isOpen={sidebarOpen}
                onClick={handleSidebarToggle}
                unreadCount={unreadCount}
              />
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: right-side drawer on mobile, static column on desktop */}
        <div
          className={`
            fixed top-0 right-0 h-full z-50 w-[min(300px,85vw)] flex flex-col overflow-hidden
            transition-transform duration-300 ease-in-out
            md:relative md:top-auto md:right-auto md:h-auto md:w-80 md:z-auto md:translate-x-0 md:shrink-0
            ${gameOverData ? 'hidden md:flex' : sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
          style={{
            backgroundImage: `url(${paperBgOld})`,
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed',
            backgroundPosition: 'center',
            backgroundColor: '#e1e5e8',
          }}
        >
          {/* Players list */}
          <div ref={playersRef} className="shrink-0 relative">
            <canvas
              ref={playersCanvasRef}
              width={playersDimensions.width}
              height={playersDimensions.height}
              className="absolute inset-0 -z-10"
            />
            <div className="p-2 sm:p-3 overflow-y-auto max-h-[130px] sm:max-h-[200px]">
              <h2 className="font-gloria text-xs sm:text-sm font-bold mb-1 sm:mb-2 text-gray-600">
                Players ({players.length})
              </h2>
              <ul className="flex flex-col gap-0.5 sm:gap-1">
                {players.length > 0 ? (
                  players.map((player) => {
                    const playerUsername = player.username || player;
                    const isCurrentUser = playerUsername === username;
                    const isPlayerHost = player.isHost;
                    const isDisconnected =
                      disconnectedPlayers.has(playerUsername);
                    const timerEndTime = reconnectionTimers[playerUsername];
                    const isPlayerDrawing =
                      gameStarted && currentDrawer === playerUsername;

                    return (
                      <li
                        key={player.userId || playerUsername}
                        className={`font-gloria text-xs sm:text-sm px-2 py-0.5 sm:py-1 rounded flex items-center justify-between ${isPlayerDrawing
                            ? "bg-green-50/50 border border-green-300"
                            : "hover:bg-gray-10"
                          }`}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className={`truncate ${isDisconnected ? "line-through text-gray-600" : ""}`}
                          >
                            {playerUsername}
                          </span>
                          {isCurrentUser && (
                            <span className="text-blue-500 text-xs">(You)</span>
                          )}
                          {isPlayerHost && (
                            <span className="text-green-700 text-xs">
                              (Host)
                            </span>
                          )}
                          {isPlayerDrawing && (
                            <span className="text-black text-xs font-bold">
                              Drawing
                            </span>
                          )}
                          {gameStarted &&
                            currentRound &&
                            correctGuessers.includes(playerUsername) && (
                              <span className="text-green-500 text-xs font-bold">
                                Guessed!
                              </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {gameStarted && (
                            <span className="text-xs text-gray-500">
                              {getPlayerScore(playerUsername)}pts
                            </span>
                          )}
                          {isDisconnected && (
                            <span className="text-red-500 text-xs font-bold">
                              DC{" "}
                              {timerEndTime && (
                                <CountdownTimer endTime={timerEndTime} />
                              )}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="font-gloria text-gray-400 text-sm italic">
                    No players yet
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Chat (fills remaining space) */}
          <div className="flex-1 overflow-hidden">
            <SketchChatBox
              messages={messages}
              onSend={handleChatSendMessage}
              maxWidth="100%"
              maxHeight="100%"
              gameStarted={gameStarted}
              isDrawer={isDrawer}
              disabled={gameStarted && isDrawer}
            />
          </div>

          {/* Buttons */}
          <div ref={buttonsRef} className="shrink-0 relative">
            <canvas
              ref={buttonsCanvasRef}
              width={buttonsDimensions.width}
              height={buttonsDimensions.height}
              className="absolute inset-0 -z-10"
            />
            <div className="p-3 flex gap-2">
              {!isGameEnded && !gameStarted && isHost && (
                <div className="flex-1">
                  <SketchButton
                    text={CONFIG.ui.startGameButton.startGameButtonText}
                    color={CONFIG.ui.startGameButton.startGameButtonColor}
                    onClick={handleStartGame}
                    disableEffects={true}
                  />
                </div>
              )}
              <div
                className={
                  !isGameEnded && !gameStarted && isHost ? "flex-1" : "w-full"
                }
              >
                <SketchButton
                  text={CONFIG.ui.leaveButton.leaveButtonText}
                  color={CONFIG.ui.leaveButton.leaveButtonColor}
                  onClick={handleLeave}
                  disableEffects={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
