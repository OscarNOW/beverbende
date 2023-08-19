import http from 'http';
import { Socket, Server as WsServer } from 'socket.io';
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from './wsProtocol';
import { Web as WebPlayer } from './index';

const webPlayers: { webPlayer: WebPlayer, sockets: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>[] }[] = [];

export function init(server: http.Server): void {
    const ws = new WsServer<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >(server);

    ws.on('connection', socket => {
        console.log('Socket connected');

        socket.on('init', id => {
            const webPlayer = webPlayers.find(({ webPlayer }) => webPlayer.id === id);
            if (!webPlayer) return socket.emit('initFail', 'invalidId');

            webPlayer.sockets.push(socket);
            socket.on('disconnect', () => {
                webPlayer.sockets.splice(webPlayer.sockets.indexOf(socket), 1);
                console.log(`Socket with WebPlayer id "${id}" disconnected`);
            });

            socket.emit('initSuccess');
            console.log(`Socket initialized with WebPlayer id "${id}"`);
        });
    });
}

export function addPlayer(webPlayer: WebPlayer): void {
    webPlayers.push({ webPlayer, sockets: [] });
}

export function removePlayer(removeWebPlayer: WebPlayer): void {
    webPlayers.splice(webPlayers.findIndex(({ webPlayer }) => webPlayer === removeWebPlayer), 1);
}

function sendRequest(webPlayer: WebPlayer, type: 'performAction' | 'declareLastRound' | 'acceptExtraDrawCard', ...args: unknown[]) {
    if (!webPlayers.find(({ webPlayer: a }) => a.id === webPlayer.id))
        throw new Error(`webPlayer with id "${webPlayer.id}" not found`)

    for (const socket of webPlayers.find(({ webPlayer: a }) => a.id === webPlayer.id).sockets)
        socket.emit(type,
            // @ts-ignore
            ...args
        );
}

export function performAction(
    webPlayer: WebPlayer,
    ...args: unknown[]
): void {
    sendRequest(webPlayer, 'performAction', ...args);
}

export function declareLastRound(
    webPlayer: WebPlayer,
    ...args: unknown[]
): void {
    sendRequest(webPlayer, 'declareLastRound', ...args);
}

export function acceptExtraDrawCard(
    webPlayer: WebPlayer,
    ...args: unknown[]
): void {
    sendRequest(webPlayer, 'acceptExtraDrawCard', ...args);
}