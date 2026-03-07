import React from 'react';
import CountdownTimer from '../CountdownTimer';
import Whiteboard from '../Whiteboard';

const sketchBadgeStyle = {
  borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
};

const RoundView = ({ roomCode, isDrawer, currentWord, wordLength, roundTimer }) => (
  <div className="flex-1 min-h-0 w-full flex flex-col items-center overflow-hidden">

    {/* Word hint / timer bar */}
    <div className="shrink-0 flex flex-row flex-wrap justify-center py-1 sm:py-2 font-gloria text-center gap-1">
      {isDrawer && currentWord && (
        <div className="relative inline-block px-4 sm:px-6 py-1 sm:py-2">
          <span className="relative z-10 text-green-700 text-base sm:text-xl font-bold">
            Your word is: {currentWord}
          </span>
          <div className="absolute inset-0 -z-10 border-2 border-black" style={sketchBadgeStyle} />
        </div>
      )}
      {!isDrawer && wordLength > 0 && (
        <div className="relative inline-block px-4 sm:px-6 py-1 sm:py-2">
          <span className="relative z-10 text-gray-700 text-sm sm:text-xl font-bold">
            Guess the word! ({wordLength} letters)
          </span>
          <div className="absolute inset-0 -z-10 border-2 border-black" style={sketchBadgeStyle} />
        </div>
      )}
      <div className="flex items-center gap-1">
        {roundTimer && <CountdownTimer endTime={roundTimer} enableIcon={true} />}
      </div>
    </div>

    {/* Whiteboard */}
    <div className="flex-1 min-h-0 w-full flex flex-row items-center justify-center overflow-hidden mt-1 sm:mt-3 px-2 sm:px-4 gap-2">
      <Whiteboard roomCode={roomCode} isDrawer={isDrawer} />
    </div>

  </div>
);

export default RoundView;
