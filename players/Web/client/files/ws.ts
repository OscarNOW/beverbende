import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '../../wsProtocol';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();

function waitForMessages<messages extends (keyof ServerToClientEvents)[]>(messages: messages): Promise<[messages[number], ...unknown[]]> { //todo: type further (replace unknown with correct type)
    return new Promise(res => {

        const listeners: ((...args: unknown[]) => void)[] = [];
        let finished = false;

        for (const message of messages) {
            const listener = (...args: unknown[]) => {
                if (finished === true) throw new Error('Finished is true, but listener is not removed');
                finished = true;

                for (const loopMessage of messages)
                    for (const loopListener of listeners)
                        socket.removeListener(loopMessage, loopListener);

                res([message, ...args]);
            }
            socket.on(message, listener);
        }

    });
};

function handleFatalError(type: 'initFail', reason: Parameters<ServerToClientEvents['initFail']>[0]): void {
    console.error(type, reason);
    alert(`${type} ${reason}`);
    socket.disconnect();
}

; (async () => {
    // pathname: /id/123
    const id = window.location.pathname.split('/')[2];

    socket.emit('init', id);
    const [event, reason] = await waitForMessages(['initSuccess', 'initFail']);
    if (event === 'initFail') return handleFatalError(event, reason as Parameters<ServerToClientEvents['initFail']>[0]);

    //todo-imp

})();