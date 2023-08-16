import { ActionCard, ActivePlayer, Card, Player, ValueCard, action, privateInformation } from '../src/statics';
import { Game } from '../src/index';

type handCards = ('action' | 'good' | 'bad' | 'unknown' | number)[];

const activePlayerInfo: WeakMap<ActivePlayer, {
    handCards: handCards;
}> = new WeakMap();

export class OscarNoStop extends Player {
    constructor() {
        super('OscarNoStop');
    }

    performAction<canDisposeValueCard extends boolean, activePlayer extends ActivePlayer, drawnCard extends Card>(
        drawnCard: drawnCard,
        canDisposeValueCard: canDisposeValueCard,
        activePlayer: activePlayer,
        previousActions: action<ActivePlayer, Card, true, 'finished'>[],
        isLastRound: boolean,
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        disposePile: Card[],
        game: Game
    ): action<activePlayer, drawnCard, canDisposeValueCard, 'new'> {
        //todo-imp: implement setting of activePlayerInfo based on previousActions

        if (drawnCard.isActionCard)
            if (drawnCard.action === 'extraDraw')
                return {
                    performer: activePlayer,
                    type: 'extraDraw',
                    drawnCardLocation: 'dispose',
                    drawnCard: drawnCard,
                    actions: []
                } as action<activePlayer, drawnCard, canDisposeValueCard, 'new'> //todo: remove
            else if (drawnCard.action === 'look') {
                let index: number;

                index ??= activePlayerInfo.get(activePlayer).handCards.findIndex(c => c === 'unknown');
                index ??= activePlayerInfo.get(activePlayer).handCards.findIndex(c => c === 'bad');
                index ??= activePlayerInfo.get(activePlayer).handCards.findIndex(c => c === 'good');
                index ??= activePlayerInfo.get(activePlayer).handCards.findIndex(c => typeof c === 'number');
                index ??= activePlayerInfo.get(activePlayer).handCards.findIndex(c => c === 'action');
                index ??= 0;

                return {
                    performer: activePlayer,
                    type: 'look',
                    drawnCardLocation: 'dispose',
                    drawnCard,

                    cardSlot: activePlayer.hand[index]
                } as action<activePlayer, drawnCard, canDisposeValueCard, 'new'> //todo: remove
            } else if (drawnCard.action === 'switch') {
                const otherActivePlayers = game.activePlayers.filter(p => p !== activePlayer);
                if (otherActivePlayers.length === 0) throw new Error('There are no other activePlayers');

                let ourIndex = findLowestCardIndex(game, activePlayerInfo.get(activePlayer).handCards);

                let other: ActivePlayer | null = null;
                let otherValue: handCards[number] | null = null;

                for (const otherActivePlayer of otherActivePlayers) {
                    if (!activePlayerInfo.has(otherActivePlayer)) continue;

                    const otherHandCards = activePlayerInfo.get(otherActivePlayer).handCards;
                    const highestOtherHandCard = getHighestHandCard(game, otherHandCards);

                    if (otherValue === null || highestOtherHandCard > otherValue) {
                        otherValue = highestOtherHandCard;
                        other = otherActivePlayer;
                    }
                }

                let otherIndex: number;

                if (other === null) {
                    other = otherActivePlayers[Math.floor(Math.random() * otherActivePlayers.length)];
                    otherIndex = Math.floor(Math.random() * other.hand.length);
                } else
                    otherIndex = activePlayerInfo.get(other).handCards.indexOf(otherValue);

                return {
                    performer: activePlayer,
                    type: 'switch',
                    drawnCardLocation: 'dispose',
                    drawnCard,

                    ownCardSlot: activePlayer.hand[ourIndex],
                    otherCardSlot: other.hand[otherIndex]
                } as action<activePlayer, drawnCard, canDisposeValueCard, 'new'> //todo: remove
            }
            else
                throw new Error(`Unknown action: "${drawnCard.action}"`)
        else if (drawnCard.isActionCard === false) //todo-imp: implement
            if (!canDisposeValueCard)
                return {
                    performer: activePlayer,
                    type: 'use',
                    drawnCardLocation: 'hand',
                    cardSlot: activePlayer.hand[0]
                } as action<activePlayer, drawnCard, canDisposeValueCard, 'new'> //todo: remove
            else {
                //todo-imp: sometimes also use the card?

                return {
                    performer: activePlayer,
                    type: 'dispose',
                    drawnCardLocation: 'dispose',
                    drawnCard
                } as action<activePlayer, drawnCard, canDisposeValueCard, 'new'> //todo: remove
            }
        else
            throw new Error(`Unknown isActionCard: "${drawnCard.isActionCard}"`)
    }

    declareLastRound<activePlayer extends ActivePlayer>(
        activePlayer: activePlayer,
        previousActions: action<ActivePlayer, Card, true, 'finished'>[],
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        disposePile: Card[]
    ): boolean {
        //todo-imp: implement
        return Math.random() < 0.2;
    }

    acceptExtraDrawCard<activePlayer extends ActivePlayer, drawnCard extends Card>(
        drawnCard: drawnCard,
        activePlayer: activePlayer,
        previousActions: action<ActivePlayer, Card, true, 'finished'>[],
        isLastRound: boolean,
        currentAction: action<ActivePlayer, ActionCard<'extraDraw'>, true, 'current'>,
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        disposePile: Card[]
    ) {
        //todo-imp: implement
        return true;
    }

}

function findLowestCardIndex(game: Game, handCards: handCards): number {
    const sortedHandCards = sortCards(game, handCards);
    return handCards.indexOf(sortedHandCards[0]);
}

function findHighestCardIndex(game: Game, handCards: handCards): number {
    return handCards.indexOf(getHighestHandCard(game, handCards));
}

function getHighestHandCard(game: Game, handCards: handCards): handCards[number] {
    const sortedHandCards = sortCards(game, handCards);
    return sortedHandCards[sortedHandCards.length - 1];
}

function sortCards(game: Game, handCards: handCards): handCards {
    const averageCard = getAverageCard(game);
    const highestCard = getHighestCard(game);

    const ranking = [
        ...Array(averageCard).fill(null).map((_, i) => i),
        'good',
        averageCard,
        'unknown',
        'action',
        'bad',
        ...Array(highestCard - averageCard + 1).fill(null).map((_, i) => i + averageCard)
    ];

    console.log(ranking)

    return [...handCards].sort((a, b) => ranking.indexOf(a) - ranking.indexOf(b));
}

function getAverageCard(game: Game) { //todo: test if this returns 5
    const cards: number[] =
        (game.cards.filter(card => card.isActionCard === false) as ValueCard<number>[])
            .map(card => card.value);

    return sum(cards) / cards.length;
}

function getHighestCard(game: Game) {
    return 9; //todo: actually take average based on game.cards
}

function sum(array: number[]): number {
    return array.reduce((a, b) => a + b, 0);
}