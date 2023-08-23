import http from 'http';
import { Socket, Server as WsServer } from 'socket.io';
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, request, requestType } from './wsProtocol';
import { Web as WebPlayer } from './index';
import { parse, stringifyStrict as stringify } from 'circular-json-es6';
import { ActivePlayer } from '../../src/statics';

const webPlayers: {
    webPlayer: WebPlayer;
    activePlayer: ActivePlayer;
    sockets: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>[];
    requests: request[];
}[] = [];

export function init(server: http.Server): void {
    const ws = new WsServer<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >(server, { pingInterval: 3000, pingTimeout: 7000 });

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

            socket.emit('initSuccess', stringify(webPlayer.activePlayer));

            setTimeout(() => {
                for (const request of webPlayer.requests)
                    emitRequest(socket,
                        request.type,
                        request.requestId,
                        request.args
                    );
            }, 500);
        });
    });
}

export function addPlayer(webPlayer: WebPlayer, activePlayer: ActivePlayer): void {
    webPlayers.push({ webPlayer, activePlayer, sockets: [], requests: [] });
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
        const listeners: ((givenRequestType: requestType, givenRequestId: string, value: unknown) => void)[] = [];

        for (const socket of sockets) {
            const listener = (givenRequestType: requestType, givenRequestId: string, rawValue: string) => {
                if (givenRequestType !== requestType) return;
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

                const value = parse(rawValue);
                res(value);
            };
            listeners.push(listener);
            socket.on('request', listener);
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
