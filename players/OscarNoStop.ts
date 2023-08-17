const stopRound = 50;

import { ActionCard, ActivePlayer, Card, Player, ValueCard, action, privateInformation } from '../src/statics';
import { Game } from '../src/index';

type handCards = ('action' | 'good' | 'bad' | 'unknown' | 'known' | number)[];

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
        const activePlayerInfo = getActivePlayerInfo(game, activePlayer, previousActions, privateInformation);

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

                index ??= findIndex(activePlayerInfo.get(activePlayer).handCards, c => c === 'unknown');
                index ??= findIndex(activePlayerInfo.get(activePlayer).handCards, c => c === 'bad');
                index ??= findIndex(activePlayerInfo.get(activePlayer).handCards, c => c === 'good');
                index ??= findIndex(activePlayerInfo.get(activePlayer).handCards, c => typeof c === 'number');
                index ??= findIndex(activePlayerInfo.get(activePlayer).handCards, c => c === 'action');
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
        else if (drawnCard.isActionCard === false) {
            const handCards = activePlayerInfo.get(activePlayer).handCards;
            const ourHighestCard = getHighestHandCard(game, handCards);

            //                                           ourHighestCard >= drawnCard.value
            if ((!canDisposeValueCard) || compareHandCards(game, ourHighestCard, drawnCard.value) >= 0)
                return {
                    performer: activePlayer,
                    type: 'use',
                    drawnCardLocation: 'hand',
                    cardSlot: activePlayer.hand[activePlayerInfo.get(activePlayer).handCards.indexOf(ourHighestCard)]
                } as action<activePlayer, drawnCard, canDisposeValueCard, 'new'> //todo: remove

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
        return previousActions.length >= stopRound
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

function getActivePlayerInfo<activePlayer extends ActivePlayer>(game: Game, activePlayer: activePlayer, previousActions: action<ActivePlayer, Card, true, 'finished'>[], privateInformation: privateInformation<activePlayer['privateInformationKeys']>): WeakMap<ActivePlayer, { handCards: handCards }> {
    const averageCardValue = getAverageCard(game);

    const activePlayerInfo: WeakMap<ActivePlayer, {
        handCards: handCards;
    }> = new WeakMap();

    if (!activePlayerInfo.has(activePlayer))
        activePlayerInfo.set(activePlayer, { handCards: Array(game.handSize).fill('unknown') });

    activePlayerInfo.get(activePlayer).handCards[0] =
        privateInformation[activePlayer.firstCardAtStart].isActionCard === true ? 'action' :
            (privateInformation[activePlayer.firstCardAtStart] as ValueCard<number>).value;

    activePlayerInfo.get(activePlayer).handCards[activePlayerInfo.get(activePlayer).handCards.length - 1] =
        privateInformation[activePlayer.lastCardAtStart].isActionCard === true ? 'action' :
            (privateInformation[activePlayer.lastCardAtStart] as ValueCard<number>).value;

    for (const action of previousActions) {
        if (!activePlayerInfo.has(action.performer))
            activePlayerInfo.set(action.performer, { handCards: Array(game.handSize).fill('unknown') });

        if (action.type === 'dispose') {
            if (action.drawnCard.value <= averageCardValue)
                activePlayerInfo.get(action.performer).handCards = activePlayerInfo.get(action.performer).handCards.map(handCard => handCard === 'known' ? 'good' : handCard);
        } else if (action.type === 'use') {
            activePlayerInfo.get(action.performer).handCards = activePlayerInfo.get(action.performer).handCards.map(handCard => handCard === 'good' ? 'known' : handCard);

            let disposedCardValue: number;
            if (action.disposedCard.isActionCard === true) disposedCardValue = averageCardValue;
            else disposedCardValue = (action.disposedCard as ValueCard<number>).value;

            if (disposedCardValue <= averageCardValue)
                activePlayerInfo.get(action.performer).handCards[action.performer.hand.indexOf(action.cardSlot)] = 'good';
        } else if (action.type === 'switch') {
            if (activePlayerInfo.get(action.performer).handCards[action.performer.hand.indexOf(action.ownCardSlot)] === 'known')
                activePlayerInfo.get(action.performer).handCards[action.performer.hand.indexOf(action.ownCardSlot)] = 'bad';

            if (activePlayerInfo.get(action.otherCardSlot.activePlayer).handCards[action.otherCardSlot.activePlayer.hand.indexOf(action.otherCardSlot)] === 'known')
                activePlayerInfo.get(action.otherCardSlot.activePlayer).handCards[action.otherCardSlot.activePlayer.hand.indexOf(action.otherCardSlot)] = 'good';

            //swap the handCard information because of the switch
            const own = activePlayerInfo.get(action.performer).handCards[action.performer.hand.indexOf(action.ownCardSlot)];
            const other = activePlayerInfo.get(action.otherCardSlot.activePlayer).handCards[action.otherCardSlot.activePlayer.hand.indexOf(action.otherCardSlot)];

            activePlayerInfo.get(action.performer).handCards[action.performer.hand.indexOf(action.ownCardSlot)] = other;
            activePlayerInfo.get(action.otherCardSlot.activePlayer).handCards[action.otherCardSlot.activePlayer.hand.indexOf(action.otherCardSlot)] = own;
            //todo-imp
        }
    }

    return activePlayerInfo;
}

function findIndex(array: any[], predicate: (value: any, index: number, obj: any[]) => boolean): number | null {
    const index = array.findIndex(predicate);
    if (index === -1)
        return null;
    else
        return index;
};

function findLowestCardIndex(game: Game, handCards: handCards): number {
    const sortedHandCards = sortHandCards(game, handCards);
    return handCards.indexOf(sortedHandCards[0]);
}

function getHighestHandCard(game: Game, handCards: handCards): handCards[number] {
    const sortedHandCards = sortHandCards(game, handCards);
    return sortedHandCards[sortedHandCards.length - 1];
}

function sortHandCards(game: Game, handCards: handCards): handCards {
    return [...handCards].sort((a, b) => compareHandCards(game, a, b));
}

function compareHandCards(game: Game, a: handCards[number], b: handCards[number]) {
    const averageCard = getAverageCard(game);
    const highestCard = getHighestCard(game);

    const ranking = [
        ...Array(averageCard).fill(null).map((_, i) => i),
        'good',
        'known',
        averageCard,
        'unknown',
        'action',
        'bad',
        ...Array(highestCard - averageCard).fill(null).map((_, i) => i + averageCard + 1)
    ];

    return ranking.indexOf(a) - ranking.indexOf(b);
}

function getAverageCard(game: Game) {
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