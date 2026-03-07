import React from 'react';
import SketchPanel from '../SketchPanel';
import CountdownTimer from '../CountdownTimer';

const RoomPlayerList = ({
  players,
  username,
  disconnectedPlayers,
  reconnectionTimers,
  gameStarted,
  currentDrawer,
  currentRound,
  correctGuessers,
  scores,
}) => {
  const getScore = (playerUsername) => {
    const entry = scores.find((s) => s.username === playerUsername);
    return entry ? entry.score : 0;
  };

  return (
    <SketchPanel roughness={0.8} className="shrink-0">
      <div className="p-2 sm:p-3 overflow-y-auto max-h-[130px] sm:max-h-[200px]">
        <h2 className="font-gloria text-xs sm:text-sm font-bold mb-1 sm:mb-2 text-gray-600">
          Players ({players.length})
        </h2>
        <ul className="flex flex-col gap-0.5 sm:gap-1">
          {players.length > 0 ? (
            players.map((player) => {
              const playerUsername = player.username || player;
              const isCurrentUser = playerUsername === username;
              const isDisconnected = disconnectedPlayers.has(playerUsername);
              const timerEndTime = reconnectionTimers[playerUsername];
              const isPlayerDrawing = gameStarted && currentDrawer === playerUsername;

              return (
                <li
                  key={player.userId || playerUsername}
                  className={`font-gloria text-xs sm:text-sm px-2 py-0.5 sm:py-1 rounded flex items-center justify-between ${
                    isPlayerDrawing ? 'bg-green-50/50 border border-green-300' : 'hover:bg-gray-10'
                  }`}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span className={`truncate ${isDisconnected ? 'line-through text-gray-600' : ''}`}>
                      {playerUsername}
                    </span>
                    {isCurrentUser && <span className="text-blue-500 text-xs">(You)</span>}
                    {player.isHost && <span className="text-green-700 text-xs">(Host)</span>}
                    {isPlayerDrawing && <span className="text-black text-xs font-bold">Drawing</span>}
                    {gameStarted && currentRound && correctGuessers.includes(playerUsername) && (
                      <span className="text-green-500 text-xs font-bold">Guessed!</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {gameStarted && (
                      <span className="text-xs text-gray-500">{getScore(playerUsername)}pts</span>
                    )}
                    {isDisconnected && (
                      <span className="text-red-500 text-xs font-bold">
                        DC{' '}
                        {timerEndTime && <CountdownTimer endTime={timerEndTime} />}
                      </span>
                    )}
                  </div>
                </li>
              );
            })
          ) : (
            <li className="font-gloria text-gray-400 text-sm italic">No players yet</li>
          )}
        </ul>
      </div>
    </SketchPanel>
  );
};

export default RoomPlayerList;
