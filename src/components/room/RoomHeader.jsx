import React from 'react';
import SketchPanel from '../SketchPanel';

const RoomHeader = ({
  roomCode,
  wsConnected,
  canvasWsConnected,
  gameStarted,
  isGameEnded,
  currentRound,
  totalRounds,
  currentDrawer,
  isDrawer,
  correctGuessers,
  totalGuessers,
}) => (
  <SketchPanel roughness={0.4} wInset={8} hInset={7} className="shrink-0 font-gloria">
    <div className="flex items-center justify-between px-4 py-2">

      {/* Left: room code + connection status */}
      <div className="flex items-center gap-2 mr-3">
        <span className="text-sm sm:text-lg font-bold">{`Room: ${roomCode}`}</span>
        <div className="flex items-center gap-1.5">
          <div
            className={`h-2.5 w-2.5 hidden sm:block rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
            title="Game WebSocket"
          />
          <div
            className={`h-2.5 w-2.5 hidden sm:block rounded-full ${canvasWsConnected ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}
            title="Canvas WebSocket"
          />
          <span className="text-xs hidden sm:block text-gray-500">
            {wsConnected && canvasWsConnected ? 'Connected' : wsConnected ? 'Canvas DC' : 'Disconnected'}
          </span>
        </div>
        {gameStarted && !isGameEnded && (
          <span className="text-xs hidden sm:block text-green-600 font-bold">LIVE</span>
        )}
        {isGameEnded && (
          <span className="text-xs text-red-600 font-bold">ENDED</span>
        )}
      </div>

      {/* Center: round info (only during active game) */}
      {gameStarted && currentRound && !isGameEnded && (
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-3 text-xs sm:text-sm text-center">
          <span className="font-bold">
            Round {currentRound}{totalRounds ? `/${totalRounds}` : ''}
          </span>
          <span className="hidden sm:block text-gray-500">|</span>
          <span className="text-gray-700">
            <span className="text-black font-bold">{currentDrawer}</span>
            {' '}drawing
            {isDrawer && <span className="text-blue-600 font-bold"> (You)</span>}
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
  </SketchPanel>
);

export default RoomHeader;
