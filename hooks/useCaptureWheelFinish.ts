import { useRef, useEffect, useState } from 'react';

const useCaptureWheelFinish = (cb: () => void, timeout = 300) => {
    const lastWheelEventTimestampRef = useRef(0);
    const [isWheeling, setIsWheeling] = useState(false);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;

        if (isWheeling) {
            intervalId = setInterval(() => {
                const currentTime = Date.now();

                // Check if the last wheel event occurred within the last interval
                if (currentTime - lastWheelEventTimestampRef.current > timeout) {
                    // No wheel event occurred within the specified time (e.g., 300 milliseconds)
                    cb();

                    setIsWheeling(false);
                }
            }, timeout);
        }

        // Cleanup: Remove the event listener and clear the interval
        return () => {
            clearInterval(intervalId);
        };
    }, [cb, isWheeling, timeout]);

    return {
        lastWheelEventTimestampRef,
        setIsWheeling,
    };
};

export default useCaptureWheelFinish;
