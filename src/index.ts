import { defaultHandSize, defaultDeck } from "./defaults";
import { Card, CardSlot, ActivePlayer, Player } from "./statics";

export class Game {
    cards: Card[];
    deck: Card[];

    activePlayers: ActivePlayer[];
    handSize: number;

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

        //todo: implement a way so the player can see the two outer cards
    }
}

function shuffle<element extends any>(array: element[]) {
    let currentIndex = array.length

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
};