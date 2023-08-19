const port = 4000;

import express from 'express';
import { ActionCard, ActivePlayer, Card, action, privateInformation } from '../../src/statics';
import { Game } from '../../src';
import { Web as WebPlayer } from './index';

const app = express();
app.use('/files', express.static('./client/files'));

app.get('/', (req, res) => {
    res.sendFile('./client/home.html', { root: __dirname });
});

app.get('/player/:id', (req, res) => {
    res.sendFile('./client/player.html', { root: __dirname });
});

app.listen(port, () => {
    console.log('Web player listening on port 4000')
});

const webPlayers: WebPlayer[] = [];
export function addPlayer(webPlayer: WebPlayer): void {
    webPlayers.push(webPlayer);
}

export async function performAction<canDisposeValueCard extends boolean, activePlayer extends ActivePlayer, drawnCard extends Card>(
    webPlayer: WebPlayer,
    drawnCard: drawnCard,
    canDisposeValueCard: canDisposeValueCard,
    activePlayer: activePlayer,
    privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
    game: Game
): Promise<action<activePlayer, drawnCard, canDisposeValueCard, 'new'>> {
    throw new Error('Not implemented');
}

export async function declareLastRound<activePlayer extends ActivePlayer>(
    webPlayer: WebPlayer,
    activePlayer: activePlayer,
    privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
    game: Game
): Promise<boolean> {
    throw new Error('Not implemented');
}

export async function acceptExtraDrawCard<activePlayer extends ActivePlayer, drawnCard extends Card>(
    webPlayer: WebPlayer,
    drawnCard: drawnCard,
    activePlayer: activePlayer,
    currentAction: action<activePlayer, ActionCard<'extraDraw'>, true, 'current'>,
    privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
    game: Game
): Promise<boolean> {
    throw new Error('Not implemented');
}
