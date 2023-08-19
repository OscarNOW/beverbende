const port = 4000;

import { init as wsInit, addPlayer as wsAddPlayer, removePlayer as wsRemovePlayer, performAction as wsPerformAction, declareLastRound as wsDeclareLastRound, acceptExtraDrawCard as wsAcceptExtraDrawCard } from './ws';
import express from 'express';
import http from 'http';
import { Web as WebPlayer } from './index';

const app = express();
app.use('/files', express.static('./client/files'));
const server = http.createServer(app);
wsInit(server);

app.get('/', (req, res) => {
    res.sendFile('./client/home.html', { root: __dirname });
});

const activeWebPlayerIds: string[] = [];
app.get('/player/:id', (req, res) => {
    const id = req.params.id;
    if (!activeWebPlayerIds.includes(id)) return res.sendStatus(404);

    res.sendFile('./client/player.html', { root: __dirname });
});

server.listen(port, () => {
    console.log('Web player listening on port 4000')
});

export const addPlayer = (webPlayer: WebPlayer) => { activeWebPlayerIds.push(webPlayer.id); wsAddPlayer(webPlayer); };
export const removePlayer = wsRemovePlayer;

export const performAction = wsPerformAction;
export const declareLastRound = wsDeclareLastRound;
export const acceptExtraDrawCard = wsAcceptExtraDrawCard;
