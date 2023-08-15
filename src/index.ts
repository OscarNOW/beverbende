import { defaultHandSize, defaultDeck } from './defaults';
import { Card, CardSlot, ActivePlayer, Player, action, ActionCard } from './statics';

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

        //todo: check if there are enough cards in the deck for all the players

        this.activePlayers = [];
        for (const player of players) {
            const activePlayer = new ActivePlayer(player);

            for (let i = 0; i < handSize; i++)
                activePlayer.addCardSlot(new CardSlot(this.deck.pop(), activePlayer, i));

            this.activePlayers.push(activePlayer);
        }
    }

    nextAction(): void {
        if (this.deck.length === 0) this.addDisposePileToDeck();
        const drawnCard = this.deck.pop();

        let newActivePlayerIndex = this.activePlayers.indexOf(this.currentActivePlayer) + 1;
        if (newActivePlayerIndex > this.activePlayers.length - 1) newActivePlayerIndex = 0;

        this.currentActivePlayer = this.activePlayers[newActivePlayerIndex];

        let action: action<ActivePlayer, Card, true, 'finished'>;
        try {
            action = createAction(this, drawnCard);
        } catch (e) {
            if (e.message === 'noCardsInNewDeck') //todo: test if this works
                return this.finish();
        }

        this.previousActions.push(action);

        //todo-imp: call declareLastRound
    }

    private addDisposePileToDeck() {
        this.deck = this.deck.concat(this.disposePile);
        this.disposePile = [];

        this.deck = shuffle(this.deck);

        if (this.deck.length === 0)
            throw new Error('noCardsInNewDeck');
    }

    //todo-imp: implement lastRound method

    finish(): void {
        //todo-imp
    }
}

function createAction<canDisposeValueCard extends boolean>(game: Game, drawnCard: Card): action<ActivePlayer, Card, canDisposeValueCard, 'finished'> {
    const newAction: action<ActivePlayer, Card, canDisposeValueCard, 'new'> //todo: ActivePlayer and Card could be any ActivePlayer or Card
        = game.currentActivePlayer.performAction(drawnCard, this.previousActions, game.disposePile); //todo: privateInformation is private

    let currentAction: action<ActivePlayer, Card, canDisposeValueCard, 'current'> = newActionToCurrent(newAction, drawnCard);
    let finishedAction: action<ActivePlayer, Card, canDisposeValueCard, 'finished'> = currentActionToFinished(game, currentAction);

    return finishedAction;
}

function newActionToCurrent<canDisposeValueCard extends boolean>(newAction: action<ActivePlayer, Card, canDisposeValueCard, 'new'>, drawnCard: Card): action<ActivePlayer, Card, canDisposeValueCard, 'current'> {
    if (newAction.type === 'look') {
        const card = newAction.cardSlot.currentCard; //todo: is private
        const privateInformationId = Math.floor(Math.random() * 10000);

        this.currentActivePlayer.privateInformation[privateInformationId] = card;
        this.currentActivePlayer.privateInformationKeys.push(privateInformationId);

        return {
            ...newAction,
            privateInformationId
        };
    } else if (newAction.type === 'use') {
        const oldCard = newAction.cardSlot.replace(drawnCard);
        return {
            ...newAction,
            disposedCard: oldCard
        };
    }
    return newAction;
}

function currentActionToFinished<canDisposeValueCard extends boolean, activePlayer extends ActivePlayer>(game: Game, currentAction: action<activePlayer, Card, canDisposeValueCard, 'current'>): action<ActivePlayer, Card, canDisposeValueCard, 'finished'> {
    if (currentAction.type === 'extraDraw' && currentAction.drawnCard.action === 'extraDraw') {
        if (game.deck.length === 0) game.addDisposePileToDeck(); //todo: addDisposePileToDeck is private
        const firstExtraCard = game.deck.pop();

        const firstExtraCardAccepted = game.currentActivePlayer.acceptExtraDrawCard(
            firstExtraCard,
            game.previousActions,
            currentAction as action<ActivePlayer, ActionCard<'extraDraw'>, canDisposeValueCard, 'current'>,
            game.disposePile
        );

        if (firstExtraCardAccepted) {
            const action = createAction<false>(game, firstExtraCard);

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

            if (game.deck.length === 0) game.addDisposePileToDeck(); //todo: addDisposePileToDeck is private
            const secondExtraCard = game.deck.pop();

            const secondExtraCardAccepted = game.currentActivePlayer.acceptExtraDrawCard(
                firstExtraCard,
                game.previousActions,
                currentAction as action<ActivePlayer, ActionCard<'extraDraw'>, canDisposeValueCard, 'current'>,
                game.disposePile
            );

            if (secondExtraCardAccepted) {
                const action = createAction<false>(game, secondExtraCard);

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