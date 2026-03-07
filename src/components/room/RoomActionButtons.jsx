import React from 'react';
import SketchPanel from '../SketchPanel';
import SketchButton from '../SketchButton';
import { ROOM_CONFIG as CONFIG } from '../../config/LabelConfig';

const RoomActionButtons = ({ isGameEnded, gameStarted, isHost, onStartGame, onLeave }) => {
  const showStart = !isGameEnded && !gameStarted && isHost;

  return (
    <SketchPanel roughness={0.7} className="shrink-0">
      <div className="p-3 flex gap-2">
        {showStart && (
          <div className="flex-1">
            <SketchButton
              text={CONFIG.ui.startGameButton.startGameButtonText}
              color={CONFIG.ui.startGameButton.startGameButtonColor}
              onClick={onStartGame}
              disableEffects={true}
            />
          </div>
        )}
        <div className={showStart ? 'flex-1' : 'w-full'}>
          <SketchButton
            text={CONFIG.ui.leaveButton.leaveButtonText}
            color={CONFIG.ui.leaveButton.leaveButtonColor}
            onClick={onLeave}
            disableEffects={true}
          />
        </div>
      </div>
    </SketchPanel>
  );
};

export default RoomActionButtons;
