import { defaultHandSize, defaultDeck } from './defaults';
import { Card, CardSlot, ActivePlayer, Player, action } from './statics';

export class Game {
    cards: Card[];
    activePlayers: ActivePlayer[];
    handSize: number;

    deck: Card[];
    disposePile: Card[];
    previousActions: action<ActivePlayer, Card, true, 'finished'>[];
    currentActivePlayer: ActivePlayer;

    constructor(players: Player[], handSize: number = defaultHandSize, cards: Card[] = defaultDeck) {
        this.handSize = handSize;

        this.cards = cards;
        this.deck = shuffle(cards);

        this.activePlayers = [];
        for (const player of players) {
            const activePlayer = new ActivePlayer(player);

            for (let i = 0; i < handSize; i++)
                activePlayer.addCardSlot(new CardSlot(this.deck.pop(), activePlayer, i));

            this.activePlayers.push(activePlayer);
        }
    }

    nextAction(): void {
        if (this.deck.length === 0) return this.finish();

        let newActivePlayerIndex = this.activePlayers.indexOf(this.currentActivePlayer) + 1;
        if (newActivePlayerIndex > this.activePlayers.length - 1) newActivePlayerIndex = 0;

        this.currentActivePlayer = this.activePlayers[newActivePlayerIndex];

        const drawnCard = this.deck.pop();
        const newAction = this.currentActivePlayer.player.performAction(drawnCard, this.previousActions, this.currentActivePlayer.privateInformation, this.disposePile); //todo: privateInformation is private

        if (drawnCard.isActionCard && drawnCard.action === 'extraDraw') {
            const firstExtraCard = this.deck.pop();
            const accepted = this.currentActivePlayer.player.acceptExtraDrawCard(firstExtraCard, this.previousActions, newAction, this.currentActivePlayer.privateInformation, this.disposePile); //todo: privateInformation is private
            //todo-imp

            //todo: make action complete
            this.previousActions.push(newAction);
        } else {
            //todo: make action complete
            this.previousActions.push(newAction);
        }

        //todo-imp: call declareLastRound
    }

    //todo-imp: implement lastRound method

    finish(): void {
        //todo-imp
    }
}

function shuffle<element>(array: element[]) {
    let currentIndex = array.length

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {

        // Pick a remaining element.
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
};