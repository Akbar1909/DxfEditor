export function DxfWorker() {
    if (typeof Worker !== 'undefined') {
        const worker = new Worker(
            new URL('components/DxfEditor/workers/prepareFileToDisplay.worker.ts', import.meta.url),
        );
        return worker;
    }
    return null;
}
