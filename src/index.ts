import { defaultHandSize, defaultDeck } from './defaults';
import { Card, CardSlot, ActivePlayer, Player, action, ActionCard, ValueCard } from './statics';

export class Game {
    cards: Card[];
    activePlayers: ActivePlayer[];
    handSize: number;

    deck: Card[];
    disposePile: Card[];
    previousActions: action<ActivePlayer, Card, true, 'finished'>[];
    currentActivePlayer: ActivePlayer;

    state: 'active' | 'lastRound' | 'finished';
    activePlayerPoints: null | number[];

    private handCards: { [handCardId: string]: Card };

    constructor(players: Player[], handSize: number = defaultHandSize, cards: Card[] = defaultDeck) {
        this.handSize = handSize;
        this.activePlayerPoints = null;

        this.cards = cards;
        this.deck = shuffle(cards);

        if (this.deck.length < handSize * players.length)
            throw new Error('There are not enough cards for all the players');

        this.activePlayers = [];
        for (const player of players) {
            const activePlayer = new ActivePlayer(player);

            for (let i = 0; i < handSize; i++) {
                const card = this.deck.pop();
                const handCardId = `${Math.floor(Math.random() * 1000)}`;
                this.handCards[handCardId] = card;

                activePlayer.addCardSlot(new CardSlot(handCardId, activePlayer, i));
            }

            this.activePlayers.push(activePlayer);
        }
    }

    nextAction(): void {
        if (this.state === 'finished') throw new Error('Game already finished');

        if (this.deck.length === 0) this.addDisposePileToDeck();
        const drawnCard = this.deck.pop();

        let newActivePlayerIndex = this.activePlayers.indexOf(this.currentActivePlayer) + 1;
        if (newActivePlayerIndex > this.activePlayers.length - 1) newActivePlayerIndex = 0;

        this.currentActivePlayer = this.activePlayers[newActivePlayerIndex];

        let action = createAction(this, this.addDisposePileToDeck, this.handCards, this.replaceHandCard, drawnCard);

        this.previousActions.push(action);

        const declaresLastRound = this.currentActivePlayer.declareLastRound(this.previousActions, this.state === 'lastRound', this.disposePile);
        if (declaresLastRound) this.lastRound();
    }

    private addDisposePileToDeck() {
        this.deck = this.deck.concat(this.disposePile);
        this.disposePile = [];

        this.deck = shuffle(this.deck);

        if (this.deck.length === 0)
            throw new Error('There are no cards left in the dispose pile for the deck');
    }

    private replaceHandCard(cardSlot: CardSlot<ActivePlayer>, newCard: Card): Card {
        const oldCard = this.handCards[cardSlot.handCardId];

        cardSlot.previousCards.push(oldCard);
        this.handCards[cardSlot.handCardId] = newCard;

        return oldCard;
    }

    private lastRound(): void {
        if (this.state === 'finished') throw new Error('Game already finished');
        if (this.state === 'lastRound') throw new Error('Game is already in lastRound state');

        this.state = 'lastRound';
    }

    private finish(): void { //todo-imp: actually call this when lastRound finishes
        if (this.state === 'finished') throw new Error('Game already finished');

        this.state = 'finished';

        let activePlayerPoints: number[] = [];

        for (const activePlayer of this.activePlayers) {
            const cards = activePlayer.hand.map(cardSlot => this.handCards[cardSlot.handCardId]);
            let valueCards: ValueCard<number>[] = [];

            for (let card of cards) {
                if (card.isActionCard === false && !this.deck.find(card => card.isActionCard === false))
                    throw new Error('No valueCards left in the deck')

                while (card.isActionCard === true) {
                    if (this.deck.length === 0) this.addDisposePileToDeck();
                    card = this.deck.pop();
                };

                valueCards.push(card);
            };

            activePlayerPoints.push(sum(valueCards.map(card => card.value)));
        };

        this.activePlayerPoints = activePlayerPoints;
    }
}

function createAction<canDisposeValueCard extends boolean>(game: Game, addDisposePileToDeck: Game['addDisposePileToDeck'], handCards: Game['handCards'], replaceHandCard: Game['replaceHandCard'], drawnCard: Card): action<ActivePlayer, Card, canDisposeValueCard, 'finished'> {
    const newAction: action<ActivePlayer, Card, canDisposeValueCard, 'new'>
        = game.currentActivePlayer.performAction(drawnCard, this.previousActions, game.state === 'lastRound', game.disposePile);

    if (newAction.performer !== game.currentActivePlayer)
        throw new Error('Performer of returned action isn\'t self');

    let currentAction: action<ActivePlayer, Card, canDisposeValueCard, 'current'> = newActionToCurrent(game, handCards, replaceHandCard, newAction, drawnCard);
    let finishedAction: action<ActivePlayer, Card, canDisposeValueCard, 'finished'> = currentActionToFinished(game, addDisposePileToDeck, handCards, replaceHandCard, currentAction);

    return finishedAction;
}

function newActionToCurrent<canDisposeValueCard extends boolean>(game: Game, handCards: Game['handCards'], replaceHandCard: Game['replaceHandCard'], newAction: action<ActivePlayer, Card, canDisposeValueCard, 'new'>, drawnCard: Card): action<ActivePlayer, Card, canDisposeValueCard, 'current'> {
    if (newAction.type === 'look') {
        const card = handCards[newAction.cardSlot.handCardId];
        const privateInformationId = `${Math.floor(Math.random() * 10000)}`;

        game.currentActivePlayer.addToPrivateInformation(privateInformationId, card);

        return {
            ...newAction,
            privateInformationId
        };
    } else if (newAction.type === 'use') {
        const oldCard = replaceHandCard(newAction.cardSlot, drawnCard);

        return {
            ...newAction,
            disposedCard: oldCard
        };
    }
    return newAction;
}

function currentActionToFinished<canDisposeValueCard extends boolean, activePlayer extends ActivePlayer>(game: Game, addDisposePileToDeck: Game['addDisposePileToDeck'], handCards: Game['handCards'], replaceHandCard: Game['replaceHandCard'], currentAction: action<activePlayer, Card, canDisposeValueCard, 'current'>): action<ActivePlayer, Card, canDisposeValueCard, 'finished'> {
    if (currentAction.type === 'extraDraw' && currentAction.drawnCard.action === 'extraDraw') {
        if (game.deck.length === 0) addDisposePileToDeck();
        const firstExtraCard = game.deck.pop();

        const firstExtraCardAccepted = game.currentActivePlayer.acceptExtraDrawCard(
            firstExtraCard,
            game.previousActions,
            game.state === 'lastRound',
            currentAction as action<ActivePlayer, ActionCard<'extraDraw'>, canDisposeValueCard, 'current'>,
            game.disposePile
        );

        if (firstExtraCardAccepted) {
            const action = createAction<false>(game, addDisposePileToDeck, handCards, replaceHandCard, firstExtraCard);

            return {
                ...currentAction,
                actions: [
                    {
                        accepted: true,
                        action
                    }
                ]
            }
        } else {
            const firstExtraCardDisposeAction = {
                performer: game.currentActivePlayer,
                type: 'dispose' as const,
                drawnCardLocation: 'dispose' as const,
                drawnCard: firstExtraCard
            };

            if (game.deck.length === 0) addDisposePileToDeck();
            const secondExtraCard = game.deck.pop();

            const secondExtraCardAccepted = game.currentActivePlayer.acceptExtraDrawCard(
                firstExtraCard,
                game.previousActions,
                game.state === 'lastRound',
                currentAction as action<ActivePlayer, ActionCard<'extraDraw'>, canDisposeValueCard, 'current'>,
                game.disposePile
            );

            if (secondExtraCardAccepted) {
                const action = createAction<false>(game, addDisposePileToDeck, handCards, replaceHandCard, secondExtraCard);

                return {
                    ...currentAction,
                    actions: [
                        {
                            accepted: false,
                            action: firstExtraCardDisposeAction
                        },
                        {
                            accepted: true,
                            action
                        }
                    ]
                }
            } else {
                const secondExtraCardDisposeAction = {
                    performer: game.currentActivePlayer,
                    type: 'dispose' as const,
                    drawnCardLocation: 'dispose' as const,
                    drawnCard: secondExtraCard
                };

                return {
                    ...currentAction,
                    actions: [
                        {
                            accepted: false,
                            action: firstExtraCardDisposeAction
                        },
                        {
                            accepted: false,
                            action: secondExtraCardDisposeAction
                        }
                    ]
                }
            }
        }
    }
}

function sum(array: number[]): number {
    return array.reduce((a, b) => a + b, 0);
}

function shuffle<element>(array: element[]): element[] {
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