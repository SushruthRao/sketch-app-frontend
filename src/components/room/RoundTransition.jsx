import React from 'react';

const RoundTransition = ({ roundTransition }) => (
  <div className="w-full max-w-md text-center font-gloria p-4 bg-yellow-50 border-2 border-black/20 rounded-lg">
    {roundTransition.word ? (
      <>
        <div className="text-lg">Round {roundTransition.roundNumber} ended!</div>
        <div className="text-xl font-bold mt-1">The word was: {roundTransition.word}</div>
      </>
    ) : (
      <div className="text-lg">Waiting for next round...</div>
    )}
    <div className="text-sm text-gray-500 mt-1">Next round starting soon...</div>
  </div>
);

export default RoundTransition;
