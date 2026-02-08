import React, { useEffect, useState } from 'react';

const CountdownTimer = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState(() => 
        Math.max(0, Math.floor((endTime - Date.now()) / 1000))
    );

    useEffect(() => {
        if (timeLeft <= 0) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime, timeLeft]);

    if (timeLeft <= 0) return null;

    return (
        <span className="text-red-500 text-sm font-bold"> ({timeLeft}s) </span>
    );
};

export default CountdownTimer;
