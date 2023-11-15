/**
 * PerformanceChecker class for measuring code execution time.
 */
class PerformanceChecker {
    /**
     * The start time in milliseconds.
     */
    started = 0;

    /**
     * The end time in milliseconds.
     */
    ended = 0;

    /**
     * Starts the performance measurement.
     */
    start() {
        this.started = performance.now();
    }

    /**
     * Ends the performance measurement and logs the result.
     */
    end() {
        this.ended = performance.now();
        this.log();
    }

    /**
     * Logs the time spent in seconds.
     */
    log() {
        console.log(`Time spent: ${((this.ended - this.started) / 1000).toFixed(1)}s`);
    }
}

/**
 * The instance of PerformanceChecker for measuring performance.
 */
const pChecker = new PerformanceChecker();

export { pChecker };
