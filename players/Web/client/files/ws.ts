import { io, Socket } from 'socket.io-client'; // this import path gets magically replaced by a batch file at build time
import { ServerToClientEvents, ClientToServerEvents, request as serverRequest, requestType } from '../../wsProtocol';
import { acceptExtraDrawCard, declareLastRound, performAction, cancel, init } from './player'; // this import path gets magically replaced by a batch file at build time
import { parse } from 'circular-json-es6'; // this import path gets magically replaced by a batch file at build time
import { ActivePlayer } from '../../../../src/statics';

function waitForMessages<messages extends (keyof ServerToClientEvents)[]>(
    messages: messages,
    check?: ((message: messages[number], ...args: unknown[]) => boolean)
): Promise<[messages[number], ...any[]]> { //todo: type further (replace any with correct type)
    return new Promise(res => {

        const listeners: ((...args: unknown[]) => void)[] = [];
        let finished = false;

        for (const message of messages) {
            const listener = (...args: unknown[]) => {
                if (finished === true) throw new Error('Finished is true, but listener is not removed');
                if (check !== undefined && !check(message, ...args)) return; //todo: test if this works
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

function handleError(type: string, reason: string): void {
    console.error(new Error(`${type} ${reason}`));
    alert(`${type} ${reason}`);
}

function handleFatalError(type: 'initFail', reason: Parameters<ServerToClientEvents['initFail']>[0]): void {
    handleError(type, reason);
    socket.disconnect();
}

type request = Omit<serverRequest, 'finished'> & {
    started: boolean;
    canceled: boolean;
    cancel: null | (() => void);
};

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();
const pendingRequests: request[] = [];

; (async () => {

    const id = window.location.pathname.split('/')[2];
    socket.emit('init', id);
    console.debug('Initializing...')

    const [event, arg] = await waitForMessages(['initSuccess', 'initFail']);
    if (event === 'initFail') return handleFatalError(event, arg as Parameters<ServerToClientEvents['initFail']>[0]);
    else if (event === 'initSuccess') init(parse(arg) as ActivePlayer);

    console.debug('Initialize successful');

    socket.on('requestCancel', (requestId: string) => {
        const request = pendingRequests.find(({ requestId: a }) => a === requestId);
        if (!request) throw new Error(`requestCancel gave id "${requestId}", but no pendingRequest with that id found`);

        if (request.canceled) throw new Error(`requestCancel gave id "${requestId}", but request was already canceled`);

        request.cancel();
    });

    const listener = async (requestId: string, type: requestType, rawArgs: string) => { //todo: type
        const args = parse(rawArgs); //todo: type

        pendingRequests.push({
            type,
            requestId,
            args,
            started: false,
            canceled: false,
            cancel: null
        });

        await handlePendingRequests();
    };

    socket.on('request', listener);

    console.debug('Waiting for requests...');
})();

async function handlePendingRequests() {
    while (pendingRequests.length > 0) {
        const request = pendingRequests.shift();

        let value: any; //todo: type
        try {
            value = await new Promise(async (res, rej) => {
                request.cancel = async () => {
                    await cancel();
                    request.canceled = true;
                    pendingRequests.splice(pendingRequests.indexOf(request), 1);
                    rej(new Error('Cancelled'));
                };
                request.started = true;

                const v = await callRequest(request.type, ...request.args);
                request.cancel = async () => {
                    await cancel();
                    request.canceled = true;
                    pendingRequests.splice(pendingRequests.indexOf(request), 1);
                };
                res(v);
            })
        } catch (e) {
            if (request.canceled)
                continue;
            else
                throw e;
        }

        if (request.canceled)
            continue;

        socket.emit('request', request.requestId, request.type, value);
        //todo: remove eslint-disable and change eslint rule
        // eslint-disable-next-line no-unused-vars
        const [message, _, reason] = await waitForMessages(['requestSuccess', 'requestFail'], (message, messageRequestId, reason) => messageRequestId === request.requestId);
        if (message === 'requestFail')
            if (reason === 'requestCanceled') {
                request.cancel();
                continue;
            } else {
                handleError(message, reason);
                pendingRequests.splice(pendingRequests.indexOf(request), 1);
            }

        pendingRequests.splice(pendingRequests.indexOf(request), 1);
    }
}

async function callRequest(requestType: requestType, ...args: any[]): Promise<any> {
    // @ts-ignore //todo: don't ignore errors
    return await ({
        performAction,
        acceptExtraDrawCard,
        declareLastRound
    })[requestType](...args);
}