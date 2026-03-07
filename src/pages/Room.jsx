/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import paperBgOld from '../assets/paper_background_old.jpg';
import webSocketService from '../service/WebSocketService';
import canvasWebSocketService from '../service/CanvasWebSocketService';
import { getRoomDetails } from '../service/RoomService';
import { getActiveSession } from '../service/SessionService';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../toast/CustomToastHook';
import { ROOM_CONFIG as CONFIG } from '../config/LabelConfig';
import { logger } from '../utils/Logger';
import AuthContext from '../auth/AuthContext';

import SketchChatBox from '../components/SketchChatBox';
import SketchLeaderboard from '../components/SketchLeaderboard';
import SketchLoader from '../components/SketchLoader';
import SketchArrowToggle from '../components/SketchArrowToggle';
import RoomHeader from '../components/room/RoomHeader';
import RoomPlayerList from '../components/room/RoomPlayerList';
import RoomActionButtons from '../components/room/RoomActionButtons';
import RoomLobby from '../components/room/RoomLobby';
import RoundView from '../components/room/RoundView';
import RoundTransition from '../components/room/RoundTransition';

// ---------------------------------------------------------------------------
// Room page — owns all state and WebSocket event handling.
// Layout and visual sub-sections are delegated to components in /room/.
// ---------------------------------------------------------------------------

const Room = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { username, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const { showSuccessToast, showErrorToast } = useToast();

  // Connection
  const [wsConnected, setWsConnected] = useState(false);
  const [canvasWsConnected, setCanvasWsConnected] = useState(false);
  const [roomLoading, setRoomLoading] = useState(true);

  // Room / lobby
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);

  // Game state
  const [session, setSession] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [gameOverData, setGameOverData] = useState(null);

  // Round state
  const [currentRound, setCurrentRound] = useState(null);
  const [totalRounds, setTotalRounds] = useState(null);
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [wordLength, setWordLength] = useState(0);
  const [roundTimer, setRoundTimer] = useState(null);
  const [roundTransition, setRoundTransition] = useState(null);
  const [scores, setScores] = useState([]);
  const [correctGuessers, setCorrectGuessers] = useState([]);
  const [totalGuessers, setTotalGuessers] = useState(0);

  // Chat / sidebar
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Disconnect grace periods
  const [disconnectedPlayers, setDisconnectedPlayers] = useState(new Set());
  const [reconnectionTimers, setReconnectionTimers] = useState({});

  const wsInitialized = useRef(false);
  const hasJoined = useRef(false);
  const sidebarOpenRef = useRef(false);

  const isDrawer = gameStarted && currentDrawer != null && currentDrawer === username;

  // ---------------------------------------------------------------------------
  // Background override for this page
  // ---------------------------------------------------------------------------

  useLayoutEffect(() => {
    const prev = document.body.style.backgroundImage;
    document.body.style.backgroundImage = `url(${paperBgOld})`;
    return () => { document.body.style.backgroundImage = prev; };
  }, []);

  // ---------------------------------------------------------------------------
  // WebSocket event handlers
  // ---------------------------------------------------------------------------

  const handleWordReceived = (data) => {
    setCurrentWord(data.word);
    logger(CONFIG.fileName, 'handleWordReceived', `Your word: ${data.word}`);
  };

  const handleRoundStateReceived = (data) => {
    setGameStarted(true);
    if (data.totalRounds) setTotalRounds(data.totalRounds);
    if (data.players) setScores(data.players);

    if (data.betweenRounds) {
      setCurrentRound(data.roundNumber);
      setCurrentDrawer(null);
      setRoundTimer(null);
      setRoundTransition({ roundNumber: data.roundNumber, word: null, reason: 'RECONNECTED' });
      logger(CONFIG.fileName, 'handleRoundStateReceived', `Reconnected between rounds (last: ${data.roundNumber})`);
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
    if (remaining > 0) setRoundTimer(Date.now() + remaining * 1000);
    logger(CONFIG.fileName, 'handleRoundStateReceived', `Reconnected to round ${data.roundNumber}, drawer: ${data.drawerUsername}`);
  };

  const handleGameError = (data) => {
    showErrorToast(data.message || 'Action blocked');
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

    switch (data.type) {
      case CONFIG.roomStatus.PLAYER_JOINED:
        logger(CONFIG.fileName, CONFIG.methods.handleRoomUpdate, data.username + CONFIG.messages.playerJoinedMessage, data.username);
        setMessages((prev) => [...prev, { text: data.username + CONFIG.messages.playerJoinedMessage, isSystem: true }]);
        showSuccessToast(data.username + CONFIG.messages.playerJoinedMessage);
        break;

      case CONFIG.roomStatus.PLAYER_LEFT:
        logger(CONFIG.fileName, CONFIG.methods.handleRoomUpdate, data.username + CONFIG.messages.playerLeftMessage, data.username);
        setDisconnectedPlayers((prev) => { const s = new Set(prev); s.delete(data.username); return s; });
        setReconnectionTimers((prev) => { const t = { ...prev }; delete t[data.username]; return t; });
        setMessages((prev) => [...prev, { text: data.username + CONFIG.messages.playerLeftMessage, isSystem: true }]);
        showErrorToast(data.username + CONFIG.messages.playerLeftMessage);
        break;

      case CONFIG.roomStatus.HOST_CHANGED:
        logger(CONFIG.fileName, CONFIG.methods.handleRoomUpdate, data.newHost + CONFIG.messages.playerHostChangeMessage, data.newHost);
        setMessages((prev) => [...prev, { text: data.newHost + CONFIG.messages.playerHostChangeMessage, isSystem: true }]);
        showSuccessToast(data.newHost + CONFIG.messages.playerHostChangeMessage);
        if (data.newHost === username) setIsHost(true);
        break;

      case CONFIG.roomStatus.GAME_STARTED:
        setGameStarted(true);
        setSession(data);
        setTotalRounds(data.totalRounds);
        setMessages((prev) => [...prev, { text: CONFIG.messages.gameStartedMessage, isSystem: true }]);
        showSuccessToast(CONFIG.messages.gameStartedMessage);
        logger(CONFIG.fileName, CONFIG.methods.handleRoomUpdate, CONFIG.messages.gameStartedMessage);
        break;

      case CONFIG.roomStatus.PLAYER_RECONNECTED_SESSION:
        logger(CONFIG.fileName, CONFIG.methods.handleRoomUpdate, data.username + CONFIG.messages.playerReconnectedSessionMessage, data.username);
        setDisconnectedPlayers((prev) => { const s = new Set(prev); s.delete(data.username); return s; });
        setReconnectionTimers((prev) => { const t = { ...prev }; delete t[data.username]; return t; });
        setMessages((prev) => [...prev, { text: data.username + CONFIG.messages.playerReconnectedSessionMessage, isSystem: true }]);
        showSuccessToast(`${data.username} ${CONFIG.messages.playerReconnectedSessionMessage}`);
        break;

      case CONFIG.roomStatus.PLAYER_LEFT_SESSION:
        logger(CONFIG.fileName, CONFIG.methods.handleRoomUpdate, data.username + CONFIG.messages.playerLeftSessionMessage, data.username);
        setMessages((prev) => [...prev, { text: data.username + CONFIG.messages.playerLeftSessionMessage, isSystem: true }]);
        showSuccessToast(data.username + CONFIG.messages.playerLeftSessionMessage);
        break;

      case CONFIG.roomStatus.PLAYER_DISCONNECTED_SESSION:
        logger(CONFIG.fileName, CONFIG.methods.handleRoomUpdate, `${data.username} disconnected from game (${data.gracePeriod}s)`, data.username);
        setDisconnectedPlayers((prev) => new Set([...prev, data.username]));
        setReconnectionTimers((prev) => ({ ...prev, [data.username]: Date.now() + data.gracePeriod * 1000 }));
        setMessages((prev) => [...prev, { text: data.username + CONFIG.messages.playerLeftSessionMessage, isSystem: true }]);
        showErrorToast(`${data.username} disconnected (${data.gracePeriod}s to rejoin)`);
        setTimeout(() => {
          setReconnectionTimers((prev) => { const t = { ...prev }; delete t[data.username]; return t; });
        }, data.gracePeriod * 1000);
        break;

      case CONFIG.roomStatus.ROUND_STARTED:
        setCurrentRound(data.roundNumber);
        setTotalRounds(data.totalRounds);
        setCurrentDrawer(data.drawerUsername);
        setWordLength(data.wordLength);
        setCurrentWord(null);
        setRoundTransition(null);
        setRoundTimer(data.durationSeconds ? Date.now() + data.durationSeconds * 1000 : null);
        setCorrectGuessers([]);
        setTotalGuessers(data.players ? data.players.length - 1 : 0);
        if (data.players) setScores(data.players);
        setMessages((prev) => [...prev, { text: `Round ${data.roundNumber}! ${data.drawerUsername} is drawing`, isSystem: true }]);
        showSuccessToast(`Round ${data.roundNumber} - ${data.drawerUsername} is drawing`);
        break;

      case CONFIG.roomStatus.ROUND_ENDED:
        setRoundTimer(null);
        setCurrentWord(null);
        setCurrentDrawer(null);
        setCorrectGuessers([]);
        setRoundTransition({ word: data.word, reason: data.reason, roundNumber: data.roundNumber });
        setMessages((prev) => [...prev, { text: `Round ${data.roundNumber} ended! The word was: ${data.word}`, isSystem: true }]);
        break;

      case CONFIG.roomStatus.CORRECT_GUESS:
        setCorrectGuessers((prev) => [...prev, data.username]);
        setScores((prev) => prev.map((s) => s.username === data.username ? { ...s, score: (s.score || 0) + data.score } : s));
        setMessages((prev) => [...prev, { text: `${data.username} guessed correctly! (+${data.score} points)`, isSystem: true, isCorrectGuess: true }]);
        showSuccessToast(`${data.username} guessed correctly!`);
        break;

      case CONFIG.roomStatus.CHAT_MESSAGE:
        setMessages((prev) => [...prev, { text: data.message, username: data.username, isMe: data.username === username }]);
        if (!sidebarOpenRef.current) setUnreadCount((n) => n + 1);
        break;

      case CONFIG.roomStatus.ALL_ROUNDS_COMPLETE:
        setScores(data.finalScores || []);
        setRoundTimer(null);
        setCurrentRound(null);
        setCurrentWord(null);
        setCurrentDrawer(null);
        setRoundTransition(null);
        setGameStarted(false);
        setIsGameEnded(true);
        setGameOverData({ finalScores: data.finalScores || [], winner: data.winner });
        setMessages((prev) => [...prev, { text: `Game over! Winner: ${data.winner || 'No winner'}`, isSystem: true }]);
        showSuccessToast(`Game over! Winner: ${data.winner}`);
        canvasWebSocketService.disconnect();
        webSocketService.disconnect();
        setWsConnected(false);
        setCanvasWsConnected(false);
        break;

      case CONFIG.roomStatus.GAME_ENDED:
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
        if (data.finalScores) setGameOverData({ finalScores: data.finalScores, winner: data.winner });
        setMessages((prev) => [...prev, { text: data.winner ? `Game ended! Winner: ${data.winner}` : 'Game ended!', isSystem: true }]);
        showErrorToast(data.winner ? `Game ended! Winner: ${data.winner}` : 'Game ended!');
        logger(CONFIG.fileName, CONFIG.methods.handleRoomUpdate, data.winner, data.winner);
        break;

      default:
        logger(CONFIG.fileName, CONFIG.methods.handleRoomUpdate, `Unhandled message type: ${data.type}`, data);
    }
  };

  const handleCanvasError = useCallback((errorData) => {
    showErrorToast(errorData.message || 'A canvas error occurred');
    logger(CONFIG.fileName, 'handleCanvasError', 'Canvas Error', errorData);
  }, [showErrorToast]);

  const handleWebSocketError = useCallback((errorData) => {
    showErrorToast('Error connecting to websocket!');
    logger(CONFIG.fileName, CONFIG.methods.handleWebSocketError, 'WS Error', errorData);
    setTimeout(() => {
      canvasWebSocketService.disconnect();
      webSocketService.disconnect();
      setWsConnected(false);
      setCanvasWsConnected(false);
      navigate('/');
    });
  }, [navigate, showErrorToast]);

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  const handleLeave = () => {
    canvasWebSocketService.disconnect();
    webSocketService.disconnect();
    navigate('/');
  };

  const handleStartGame = () => {
    if (players.length < 2) {
      showErrorToast(CONFIG.messages.handleStartGameErrorMessage);
      return;
    }
    webSocketService.startGame(roomCode);
  };

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

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Sync isHost from players list
  useEffect(() => {
    players.forEach((player) => {
      if (player.username === username && player.isHost) setIsHost(true);
    });
  }, [players]);

  // Track canvas WebSocket connection status
  useEffect(() => {
    const handleCanvasStatus = (status) => setCanvasWsConnected(status === true);
    canvasWebSocketService.on('connectionStatus', handleCanvasStatus);
    return () => canvasWebSocketService.off('connectionStatus', handleCanvasStatus);
  }, []);

  // Auth guard + room init + WebSocket setup
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }

    const connectCanvas = (onDone) => {
      canvasWebSocketService.connect(
        roomCode,
        () => { setWsConnected(true); setRoomLoading(false); onDone?.(); },
        (err) => { console.error('Canvas WS error:', err); setWsConnected(true); setRoomLoading(false); },
      );
    };

    const init = async () => {
      try {
        const response = await getRoomDetails(roomCode);
        if (!response || !response.success) { navigate('/404'); return; }

        setRoom(response.room);
        setPlayers(response.players);

        if (response.room.status === CONFIG.roomInitStatus.PLAYING) {
          setGameStarted(true);
          try {
            const sessionRes = await getActiveSession(roomCode);
            if (sessionRes?.session) {
              setTotalRounds(sessionRes.session.totalRounds);
              if (sessionRes.session.currentRound > 0) setCurrentRound(sessionRes.session.currentRound);
            }
            if (sessionRes?.players) setScores(sessionRes.players);
          } catch (e) {
            console.error('Failed to pre-load session data', e);
          }
        }

        if (!wsInitialized.current) {
          wsInitialized.current = true;
          webSocketService.on('roomUpdate', handleRoomUpdate);
          webSocketService.on('error', handleWebSocketError);
          webSocketService.on('word', handleWordReceived);
          webSocketService.on('roundState', handleRoundStateReceived);
          webSocketService.on('gameError', handleGameError);
          canvasWebSocketService.on('canvasError', handleCanvasError);

          if (!webSocketService.connected) {
            webSocketService.connect(() => connectCanvas(), (err) => { console.error(err); setRoomLoading(false); });
          } else if (!canvasWebSocketService.connected) {
            connectCanvas();
          } else {
            setWsConnected(true);
            setRoomLoading(false);
          }
        }
      } catch (err) {
        logger(CONFIG.fileName, CONFIG.methods.init, 'Error fetching room', err);
        navigate('/404');
      }
    };

    init();

    return () => {
      webSocketService.off('roomUpdate', handleRoomUpdate);
      webSocketService.off('error', handleWebSocketError);
      webSocketService.off('word', handleWordReceived);
      webSocketService.off('roundState', handleRoundStateReceived);
      webSocketService.off('gameError', handleGameError);
      canvasWebSocketService.off('canvasError', handleCanvasError);
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (roomLoading) return <SketchLoader message="Connecting to room..." />;

  const sidebarBg = {
    backgroundImage: `url(${paperBgOld})`,
    backgroundSize: 'cover',
    backgroundAttachment: 'fixed',
    backgroundPosition: 'center',
    backgroundColor: '#e1e5e8',
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      <RoomHeader
        roomCode={roomCode}
        wsConnected={wsConnected}
        canvasWsConnected={canvasWsConnected}
        gameStarted={gameStarted}
        isGameEnded={isGameEnded}
        currentRound={currentRound}
        totalRounds={totalRounds}
        currentDrawer={currentDrawer}
        isDrawer={isDrawer}
        correctGuessers={correctGuessers}
        totalGuessers={totalGuessers}
      />

      {/* Mobile backdrop — closes sidebar when tapping the canvas area */}
      {sidebarOpen && !gameOverData && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={handleSidebarToggle} />
      )}

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">

        {/* CENTER — lobby / active round / transition / game over */}
        <div className={`relative min-h-0 flex flex-col items-center p-2 md:p-4 overflow-hidden h-[88dvh] md:h-auto md:flex-1 ${gameOverData ? 'justify-start overflow-y-auto' : 'justify-center'}`}>

          {!gameStarted && !isGameEnded && (
            <RoomLobby roomCode={roomCode} players={players} />
          )}

          {gameStarted && currentRound && !isGameEnded && !roundTransition && (
            <RoundView
              roomCode={roomCode}
              isDrawer={isDrawer}
              currentWord={currentWord}
              wordLength={wordLength}
              roundTimer={roundTimer}
            />
          )}

          {roundTransition && !isGameEnded && !gameOverData && (
            <RoundTransition roundTransition={roundTransition} />
          )}

          {gameOverData && (
            <SketchLeaderboard
              finalScores={gameOverData.finalScores}
              winner={gameOverData.winner}
              onHome={() => navigate('/')}
            />
          )}

          {/* Mobile chat toggle — floats bottom-right over canvas */}
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

        {/* RIGHT SIDEBAR — drawer on mobile, static column on desktop */}
        <div
          className={`
            fixed top-0 right-0 h-full z-50 w-[min(300px,85vw)] flex flex-col overflow-hidden
            transition-transform duration-300 ease-in-out
            md:relative md:top-auto md:right-auto md:h-auto md:w-80 md:z-auto md:translate-x-0 md:shrink-0
            ${gameOverData ? 'hidden md:flex' : sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
          style={sidebarBg}
        >
          <RoomPlayerList
            players={players}
            username={username}
            disconnectedPlayers={disconnectedPlayers}
            reconnectionTimers={reconnectionTimers}
            gameStarted={gameStarted}
            currentDrawer={currentDrawer}
            currentRound={currentRound}
            correctGuessers={correctGuessers}
            scores={scores}
          />

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

          <RoomActionButtons
            isGameEnded={isGameEnded}
            gameStarted={gameStarted}
            isHost={isHost}
            onStartGame={handleStartGame}
            onLeave={handleLeave}
          />
        </div>

      </div>
    </div>
  );
};

export default Room;
