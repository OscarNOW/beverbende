import http from 'http';
import { Socket, Server as WsServer } from 'socket.io';
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, requestType } from './wsProtocol';
import { Web as WebPlayer } from './index';
import { parse, stringifyStrict as stringify } from 'circular-json-es6';
import { ActivePlayer } from '../../src/statics';

type typedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

type requestListener = (givenRequestType: requestType, givenRequestId: string, value: unknown) => void;
type request = {
    type: requestType,
    requestId: string,
    finished: boolean,
    args: unknown[],
    listeners: Map<typedSocket, requestListener[]>,
    callback: (value: unknown) => void
};

const webPlayerInfos: {
    webPlayer: WebPlayer;
    activePlayer: ActivePlayer;
    sockets: typedSocket[];
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
            const webPlayerInfo = webPlayerInfos.find(({ webPlayer }) => webPlayer.id === id);
            if (!webPlayerInfo) return socket.emit('initFail', 'invalidId');

            webPlayerInfo.sockets.push(socket);
            socket.on('disconnect', () => {
                webPlayerInfo.sockets.splice(webPlayerInfo.sockets.indexOf(socket), 1);
            });

            socket.on('request', (requestId: string, requestType: requestType) => {
                if (!webPlayerInfo.requests.find(({ requestId: checkRequestId, type: checkRequestType }) => checkRequestId === requestId && checkRequestType === requestType))
                    return socket.emit('requestFail', requestId, 'invalidRequestId');

                else if (webPlayerInfo.requests.find(({ requestId: checkRequestId }) => checkRequestId === requestId).finished)
                    return socket.emit('requestFail', requestId, 'requestCanceled');

                else return; // there is a different handler that will handle this
            });

            socket.emit('initSuccess', stringify(webPlayerInfo.activePlayer));

            setTimeout(() => {
                for (const request of webPlayerInfo.requests) {
                    emitRequest(socket,
                        request.type,
                        request.requestId,
                        request.args
                    );

                    listenForRequest(socket, webPlayerInfo.webPlayer, request.type, request.requestId);
                }
            }, 500);
        });
    });
}

export function addPlayer(webPlayer: WebPlayer, activePlayer: ActivePlayer): void {
    webPlayerInfos.push({ webPlayer, activePlayer, sockets: [], requests: [] });
}

export function removePlayer(removeWebPlayer: WebPlayer): void {
    webPlayerInfos.splice(webPlayerInfos.findIndex(({ webPlayer }) => webPlayer === removeWebPlayer), 1);
}

function emitRequest(socket: typedSocket, type: requestType, requestId: string, stringifyArgs: unknown[]) {
    socket.emit('request',
        requestId,
        type,
        stringify(stringifyArgs)
    )
}

function listenForRequest(socket: typedSocket, webPlayer: WebPlayer, requestType: requestType, requestId: string): void {
    const request = webPlayerInfos.find(({ webPlayer: a }) => a.id === webPlayer.id).requests.find(({ requestId: a }) => a === requestId);

    const listener = (givenRequestId: string, givenRequestType: requestType, rawValue: string) => {
        if (givenRequestType !== requestType) return;
        if (requestId !== givenRequestId) return;

        if (request.finished) throw new Error('Request already finished, but listener was not removed');
        request.finished = true;

        for (const [loopSocket, listeners] of request.listeners.entries()) {
            for (const loopListener of listeners)
                loopSocket.removeListener(requestType, loopListener);

            if (loopSocket === socket) loopSocket.emit('requestSuccess', requestId);
            else loopSocket.emit('requestCancel', requestId);
        }

        const value = parse(rawValue);
        request.callback(value);
    };

    if (!request.listeners.has(socket)) request.listeners.set(socket, []);
    request.listeners.get(socket).push(listener);
    socket.on('request', listener);
}

function sendRequest(webPlayer: WebPlayer, requestType: requestType, callback: ((value: unknown) => void), ...args: unknown[]): string {
    if (!webPlayerInfos.find(({ webPlayer: checkWebPlayer }) => checkWebPlayer.id === webPlayer.id))
        throw new Error(`webPlayer with id "${webPlayer.id}" not found`);

    const { requests } = webPlayerInfos.find(({ webPlayer: checkWebPlayer }) => checkWebPlayer.id === webPlayer.id);
    const requestId = `${Math.floor(Math.random() * 10000)}`;

    requests.push({
        type: requestType,
        requestId,
        args,
        finished: false,
        listeners: new Map(),
        callback
    });

    for (const socket of webPlayerInfos.find(({ webPlayer: a }) => a.id === webPlayer.id).sockets)
        emitRequest(socket,
            requestType,
            requestId,
            args
        );

    return requestId;
}

function performRequest(webPlayer: WebPlayer, requestType: requestType, ...args: unknown[]): Promise<any> { //todo: type
    return new Promise(res => {

        if (!webPlayerInfos.find(({ webPlayer: checkWebPlayer }) => checkWebPlayer.id === webPlayer.id))
            throw new Error(`webPlayer with id "${webPlayer.id}" not found`);

        const requestId = sendRequest(webPlayer, 'performAction', res, ...args);
        const { sockets } = webPlayerInfos.find(({ webPlayer: a }) => a.id === webPlayer.id);

        for (const socket of sockets)
            listenForRequest(socket, webPlayer, requestType, requestId);

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
