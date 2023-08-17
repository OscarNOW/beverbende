import { defaultHandSize, defaultDeck } from './defaults';
import { Card, CardSlot, ActivePlayer, Player, action, ActionCard, ValueCard } from './statics';

export class Game {
    cards: Card[];
    activePlayers: ActivePlayer[];
    handSize: number;

    deck: Card[]; //todo: make private
    disposePile: Card[];
    previousActions: action<ActivePlayer, Card, true, 'finished'>[];
    currentActivePlayer: ActivePlayer;

    state: 'active' | 'lastRound' | 'finished';
    activePlayerPoints: null | number[];
    lastRoundCaller: null | ActivePlayer;

    private handCards: { [handCardId: string]: Card };

    constructor(players: Player[], handSize: number = defaultHandSize, cards: Card[] = defaultDeck) {
        this.handSize = handSize;
        this.cards = cards;

        this.activePlayerPoints = null;
        this.lastRoundCaller = null;
        this.handCards = {};
        this.previousActions = [];
        this.disposePile = [];

        this.deck = shuffle(cards);

        if (this.deck.length < handSize * players.length)
            throw new Error('There are not enough cards for all the players');

        this.activePlayers = [];
        for (const player of players) {
            const cards = [];
            for (let i = 0; i < handSize; i++) {
                const card = this.deck.pop();
                cards.push(card);
            }

            const activePlayer = new ActivePlayer(player, cards[0], cards[cards.length - 1]);

            for (const i in cards) {
                const index = parseInt(i);
                const card = cards[i];

                const handCardId = `${Math.floor(Math.random() * 1000)}`;
                this.handCards[handCardId] = card;

                activePlayer.addCardSlot(new CardSlot(handCardId, activePlayer, index));
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

        if (this.lastRoundCaller !== null && this.currentActivePlayer === this.lastRoundCaller)
            return this.finish();

        let action = createAction(this, this.addDisposePileToDeck.bind(this), this.handCards, this.replaceHandCard.bind(this), drawnCard, true);

        this.previousActions.push(action);

        if (this.state !== 'lastRound') {
            const declaresLastRound = this.currentActivePlayer.declareLastRound(this.previousActions, this.disposePile);
            if (declaresLastRound) this.lastRound(this.currentActivePlayer);
        }
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

    private lastRound(activePlayer: ActivePlayer): void {
        if (this.state === 'finished') throw new Error('Game already finished');
        if (this.state === 'lastRound') throw new Error('Game is already in lastRound state');

        this.state = 'lastRound';
        this.lastRoundCaller = activePlayer;
    }

    private finish(): void {
        if (this.state === 'finished') throw new Error('Game already finished');

        this.state = 'finished';

        let activePlayerPoints: number[] = [];

        for (const activePlayer of this.activePlayers) {
            const cards = activePlayer.hand.map(cardSlot => this.handCards[cardSlot.handCardId]);
            let valueCards: ValueCard<number>[] = [];

            for (let card of cards) {
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

function createAction<canDisposeValueCard extends boolean>(game: Game, addDisposePileToDeck: Game['addDisposePileToDeck'], handCards: Game['handCards'], replaceHandCard: Game['replaceHandCard'], drawnCard: Card, canDisposeValueCard: canDisposeValueCard): action<ActivePlayer, Card, canDisposeValueCard, 'finished'> {
    const newAction: action<ActivePlayer, Card, canDisposeValueCard, 'new'>
        = game.currentActivePlayer.performAction(drawnCard, canDisposeValueCard, game.previousActions, game);

    //todo: verify that newAction is correct

    if (newAction.performer !== game.currentActivePlayer)
        throw new Error('Performer of returned action isn\'t self');

    let currentAction: action<ActivePlayer, Card, canDisposeValueCard, 'current'> = newActionToCurrent(game, handCards, replaceHandCard, newAction, drawnCard);
    let finishedAction: action<ActivePlayer, Card, canDisposeValueCard, 'finished'> = currentActionToFinished(game, addDisposePileToDeck, handCards, replaceHandCard, currentAction);

    return finishedAction;
}

function newActionToCurrent<canDisposeValueCard extends boolean>(game: Game, handCards: Game['handCards'], replaceHandCard: Game['replaceHandCard'], newAction: action<ActivePlayer, Card, canDisposeValueCard, 'new'>, drawnCard: Card): action<ActivePlayer, Card, canDisposeValueCard, 'current'> {
    if (newAction.type === 'look') {
        const card = handCards[newAction.cardSlot.handCardId];

        const privateInformationId = game.currentActivePlayer.addToPrivateInformation(card);

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
    if (currentAction.drawnCardLocation === 'dispose')
        game.disposePile.push(currentAction.drawnCard);
    else if (currentAction.type === 'use')
        game.disposePile.push(currentAction.disposedCard);

    if (currentAction.type !== 'extraDraw' || currentAction.drawnCard.action !== 'extraDraw')
        return currentAction as action<ActivePlayer, Card, canDisposeValueCard, 'finished'>;
    else {
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
            const action = createAction(game, addDisposePileToDeck, handCards, replaceHandCard, firstExtraCard, false);

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
                const action = createAction(game, addDisposePileToDeck, handCards, replaceHandCard, secondExtraCard, false);

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
    let shuffled = [...array];
    let currentIndex = shuffled.length

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {

        // Pick a remaining element.
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [shuffled[currentIndex], shuffled[randomIndex]] = [
            shuffled[randomIndex], shuffled[currentIndex]];
    }

    return shuffled;
};