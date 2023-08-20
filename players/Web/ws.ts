import http from 'http';
import { Socket, Server as WsServer } from 'socket.io';
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, request, requestType } from './wsProtocol';
import { Web as WebPlayer } from './index';
import { stringifyStrict as stringify } from 'circular-json-es6';

const webPlayers: {
    webPlayer: WebPlayer,
    sockets: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>[],
    requests: request[]
}[] = [];

export function init(server: http.Server): void {
    const ws = new WsServer<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >(server);

    ws.on('connection', socket => {
        socket.on('init', id => {
            const webPlayer = webPlayers.find(({ webPlayer }) => webPlayer.id === id);
            if (!webPlayer) return socket.emit('initFail', 'invalidId');

            webPlayer.sockets.push(socket);
            socket.on('disconnect', () => {
                webPlayer.sockets.splice(webPlayer.sockets.indexOf(socket), 1);
            });

            socket.on('request', (requestId: string) => {
                if (!webPlayer.requests.find(({ requestId: checkRequestId }) => checkRequestId === requestId))
                    return socket.emit('requestFail', requestId, 'invalidRequestId');

                else if (webPlayer.requests.find(({ requestId: checkRequestId }) => checkRequestId === requestId).finished)
                    return socket.emit('requestFail', requestId, 'requestCanceled');

                else return; // there is a different handler that will handle this
            });

            socket.emit('initSuccess');

            for (const request of webPlayer.requests)
                emitRequest(socket, request.type,
                    request.requestId,
                    request.args
                );
        });
    });
}

export function addPlayer(webPlayer: WebPlayer): void {
    webPlayers.push({ webPlayer, sockets: [], requests: [] });
}

export function removePlayer(removeWebPlayer: WebPlayer): void {
    webPlayers.splice(webPlayers.findIndex(({ webPlayer }) => webPlayer === removeWebPlayer), 1);
}

function emitRequest(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, type: requestType, requestId: string, stringifyArgs: unknown[]) {
    socket.emit('request',
        requestId,
        type,
        stringify(stringifyArgs)
    )
}

function sendRequest(webPlayer: WebPlayer, type: requestType, ...args: unknown[]): string {
    if (!webPlayers.find(({ webPlayer: checkWebPlayer }) => checkWebPlayer.id === webPlayer.id))
        throw new Error(`webPlayer with id "${webPlayer.id}" not found`);

    const { requests } = webPlayers.find(({ webPlayer: checkWebPlayer }) => checkWebPlayer.id === webPlayer.id);
    const requestId = `${Math.floor(Math.random() * 10000)}`;

    requests.push({
        type,
        requestId,
        args,
        finished: false
    });

    for (const socket of webPlayers.find(({ webPlayer: a }) => a.id === webPlayer.id).sockets)
        emitRequest(socket,
            type,
            requestId,
            args
        );

    return requestId;
}

function performRequest(webPlayer: WebPlayer, requestType: requestType, ...args: unknown[]): Promise<any> { //todo: type
    return new Promise(res => {

        if (!webPlayers.find(({ webPlayer: checkWebPlayer }) => checkWebPlayer.id === webPlayer.id))
            throw new Error(`webPlayer with id "${webPlayer.id}" not found`);

        const requestId = sendRequest(webPlayer, 'performAction', ...args);
        const { sockets } = webPlayers.find(({ webPlayer: a }) => a.id === webPlayer.id);
        const listeners: ((givenRequestId: string, value: unknown) => void)[] = [];

        for (const socket of sockets) {
            const listener = (givenRequestId: string, value: unknown) => {
                if (requestId !== givenRequestId) return;

                if (webPlayers.find(({ webPlayer: a }) => a.id === webPlayer.id).requests.find(({ requestId: a }) => a === requestId).finished)
                    throw new Error('Request already finished, but listener was not removed');
                webPlayers.find(({ webPlayer: a }) => a.id === webPlayer.id).requests.find(({ requestId: a }) => a === requestId).finished = true;

                for (const loopSocket of sockets) {
                    for (const loopListener of listeners)
                        loopSocket.removeListener(requestType, loopListener);

                    if (loopSocket === socket) loopSocket.emit('requestSuccess', requestId);
                    else loopSocket.emit('requestCancel', requestId);
                }

                res(value);
            };
            listeners.push(listener);
            socket.addListener(requestType, listener);
        }

    });
}

export async function performAction(
    webPlayer: WebPlayer,
    ...args: unknown[]
): Promise<any> { //todo: type
    return await performRequest(webPlayer, 'performAction', ...args);
}

export async function declareLastRound(
    webPlayer: WebPlayer,
    ...args: unknown[]
): Promise<any> { //todo: type
    return await performRequest(webPlayer, 'declareLastRound', ...args);
}

export async function acceptExtraDrawCard(
    webPlayer: WebPlayer,
    ...args: unknown[]
): Promise<any> { //todo: type
    return await performRequest(webPlayer, 'acceptExtraDrawCard', ...args);
}
