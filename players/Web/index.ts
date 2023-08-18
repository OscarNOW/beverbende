import { Player } from '../../src/statics';
import { addPlayer, performAction, declareLastRound, acceptExtraDrawCard } from './site';

export class Web extends Player {
    id: string;

    constructor() {
        super('Web');

        this.id = `${Math.floor(Math.random() * 10000)}`;
        addPlayer(this);

        this.performAction = (...args) => performAction(this, ...args);
        this.declareLastRound = (...args) => declareLastRound(this, ...args);
        this.acceptExtraDrawCard = (...args) => acceptExtraDrawCard(this, ...args);
    }
}