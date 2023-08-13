import { defaultHandSize, defaultDeck } from "./defaults";
import { Card, ActionCard, ValueCard } from "./statics";

export class Game {
    startingDeck: Card[];
    deck: Card[];
    activePlayers: ActivePlayer[];
    handSize: number;

    constructor(players: Player[], handSize: number = defaultHandSize, deck: Card[] = defaultDeck) {
        this.handSize = handSize;

        this.startingDeck = deck;
        this.deck = shuffle(deck);

        this.activePlayers = [];
        for (const player of players) {
            let playerHand: ActiveCard[] = [];

            for (let i = 0; i < handSize; i++)
                playerHand.push(new ActiveCard(this.deck.pop()));

            this.activePlayers.push(new ActivePlayer(player, playerHand));
        }
    }
}

export class ActivePlayer {
    player: Player;
    hand: ActiveCard[];

    constructor(player: Player, hand: ActiveCard[]) {
        this.player = player;
        this.hand = hand;
    }
}

export class ActiveCard {
    private card: Card;
    inDiscardPile: boolean;

    constructor(card: Card) {
        this.card = card;
    };

    getCard(): Card {
        if (this.inDiscardPile)
            return this.card;
        else
            throw new Error("Card is private, because it's not in the discard pile")
    }

    discard() {
        this.inDiscardPile = true;
    }
}

export class Player {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    performAction: <drawnCard extends Card>(previousActions: action<Player, Card>[], drawnCard: drawnCard) => action<this, drawnCard>;
}

export type action<performer extends Player, drawnCard extends Card> =
    drawnCard extends ActionCard ?
    drawnCard['action'] extends 'switch' ? {
        performer: performer;
        //todo
    } :
    drawnCard['action'] extends 'look' ? {} :
    drawnCard['action'] extends 'extraDraw' ? {} :
    never :
    drawnCard extends ValueCard ? {} :
    never;

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