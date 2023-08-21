console.log('Web Player loaded')

import { ActivePlayer, Player } from '../../src/statics';
import { addPlayer, performAction, declareLastRound, acceptExtraDrawCard } from './site';

export class Web extends Player {
    id: string;
    url: null | string;
    initFinishedCallbacks: (() => void)[];

    constructor() {
        super('Web');

        this.id = `${Math.floor(Math.random() * 10000)}`;
        this.url = null;
        this.initFinishedCallbacks = [];

        this.init = async (activePlayer: ActivePlayer) => {
            this.url = addPlayer(this, activePlayer);
            for (const callback of this.initFinishedCallbacks) callback();
        };
        this.performAction = (...args) => performAction(this, ...args);
        this.declareLastRound = (...args) => declareLastRound(this, ...args);
        this.acceptExtraDrawCard = (...args) => acceptExtraDrawCard(this, ...args);
    }

    gerUrl(): Promise<string> {
        if (this.url !== null) return Promise.resolve(this.url);
        else
            return new Promise(res => {
                this.initFinishedCallbacks.push(() => res(this.url));
            });
    }
}