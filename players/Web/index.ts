console.log('Web Player loaded')

import { ActivePlayer, Player } from '../../src/statics';
import { addPlayer, performAction, declareLastRound, acceptExtraDrawCard } from './site';

export class Web extends Player {
    id: string;
    url: null | string;
    initClassCallbacks: (() => void)[];

    constructor() {
        super('Web');

        this.id = `${Math.floor(Math.random() * 10000)}`;
        this.url = null;
        this.initClassCallbacks = [];

        this.init = async (activePlayer: ActivePlayer) => {
            this.url = addPlayer(this, activePlayer);
            for (const callback of this.initClassCallbacks) callback();
        };
        this.performAction = (...args) => performAction(this, ...args);
        this.declareLastRound = (...args) => declareLastRound(this, ...args);
        this.acceptExtraDrawCard = (...args) => acceptExtraDrawCard(this, ...args);
    }

    initClass(): Promise<void> {
        if (this.url) return Promise.resolve();
        else
            return new Promise(res => {
                this.initClassCallbacks.push(res);
            });
    }
}