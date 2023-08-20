console.log('Web Player loaded')

import { ActivePlayer, Player } from '../../src/statics';
import { addPlayer, performAction, declareLastRound, acceptExtraDrawCard } from './site';

export class Web extends Player {
    id: string;
    url: null | string;

    constructor() {
        super('Web');

        this.id = `${Math.floor(Math.random() * 10000)}`;
        this.url = null;

        this.init = (activePlayer: ActivePlayer) => this.url = addPlayer(this, activePlayer); //todo-imp: implement this
        this.performAction = (...args) => performAction(this, ...args);
        this.declareLastRound = (...args) => declareLastRound(this, ...args);
        this.acceptExtraDrawCard = (...args) => acceptExtraDrawCard(this, ...args);
    }
}