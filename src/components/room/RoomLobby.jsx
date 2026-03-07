import React from 'react';
import SketchClipboard from '../SketchClipboard';
import Whiteboard from '../Whiteboard';

const RoomLobby = ({ roomCode, players }) => (
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
);

export default RoomLobby;
