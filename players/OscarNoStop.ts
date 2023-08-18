const stopRound = 50;

import { ActionCard, ActivePlayer, Card, Player, ValueCard, action, disposeAction, privateInformation } from '../src/statics';
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
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        game: Game
    ): action<activePlayer, drawnCard, canDisposeValueCard, 'new'> {
        const activePlayerInfo = getActivePlayerInfo(game, activePlayer, privateInformation);

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
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        game: Game
    ): boolean {
        return game.previousActions.length >= stopRound
    }

    acceptExtraDrawCard<activePlayer extends ActivePlayer, drawnCard extends Card>(
        drawnCard: drawnCard,
        activePlayer: activePlayer,
        currentAction: action<ActivePlayer, ActionCard<'extraDraw'>, true, 'current'>,
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        game: Game
    ) {
        const activePlayerInfo = getActivePlayerInfo(game, activePlayer, privateInformation);
        const averageCard = getAverageCard(game);

        const isSecondCard = currentAction.actions.length === 1 && currentAction.actions[0].accepted === false;

        if (drawnCard.isActionCard === true) {
            if (drawnCard.action === 'extraDraw')
                return true;
            else if (drawnCard.action === 'look')
                return isSecondCard;
            else if (drawnCard.action === 'switch') {
                const otherActivePlayers = game.activePlayers.filter(p => p !== activePlayer);
                if (otherActivePlayers.length === 0) throw new Error('There are no other activePlayers');

                let ourLowestCard = activePlayerInfo.get(activePlayer).handCards[findLowestCardIndex(game, activePlayerInfo.get(activePlayer).handCards)];

                let otherValue: handCards[number] | null = null;

                for (const otherActivePlayer of otherActivePlayers) {
                    if (!activePlayerInfo.has(otherActivePlayer)) continue;

                    const otherHandCards = activePlayerInfo.get(otherActivePlayer).handCards;
                    const highestOtherHandCard = getHighestHandCard(game, otherHandCards);

                    if (otherValue === null || highestOtherHandCard > otherValue)
                        otherValue = highestOtherHandCard;
                }

                // if (otherValue >= ourLowestCard)
                if (compareHandCards(game, otherValue, ourLowestCard) >= 0)
                    return false;

                // if (otherValue >= averageCard)
                if (compareHandCards(game, otherValue, averageCard) >= 0)
                    return false;

                return true;
            }
        } else if (drawnCard.isActionCard === false) {
            if ((!isSecondCard) && drawnCard.value > averageCard)
                return false;

            const lowestCardIndex = findLowestCardIndex(game, activePlayerInfo.get(activePlayer).handCards);
            const lowestCard = activePlayerInfo.get(activePlayer).handCards[lowestCardIndex];

            //                         drawnCard.value <= lowestCard
            return compareHandCards(game, drawnCard.value, lowestCard) <= 0
        }
    }

}

const activePlayerInfoCache: WeakMap<Game, WeakMap<ActivePlayer, {
    lastAction: action<ActivePlayer, Card, true, 'finished'>,
    activePlayerInfo: WeakMap<ActivePlayer, { handCards: handCards; }>
}>> = new WeakMap();

function getActivePlayerInfo<activePlayer extends ActivePlayer>(game: Game, activePlayer: activePlayer, privateInformation: privateInformation<activePlayer['privateInformationKeys']>): WeakMap<ActivePlayer, { handCards: handCards }> {
    if (game.previousActions.length > 0 && activePlayerInfoCache.get(game)?.get?.(activePlayer)?.lastAction === game.previousActions[game.previousActions.length - 1])
        return activePlayerInfoCache.get(game).get(activePlayer).activePlayerInfo;

    let activePlayerInfo: WeakMap<ActivePlayer, {
        handCards: handCards;
    }>;

    if (activePlayerInfoCache.get(game)?.get?.(activePlayer)?.activePlayerInfo !== undefined)
        activePlayerInfo = activePlayerInfoCache.get(game).get(activePlayer).activePlayerInfo;
    else {

        activePlayerInfo = new WeakMap();
        for (const activePlayer of game.activePlayers)
            if (!activePlayerInfo.has(activePlayer))
                activePlayerInfo.set(activePlayer, { handCards: ['known', ...Array(game.handSize - 2).fill('unknown'), 'known'] });

        activePlayerInfo.get(activePlayer).handCards[0] =
            privateInformation[activePlayer.firstCardAtStart].isActionCard === true ? 'action' :
                (privateInformation[activePlayer.firstCardAtStart] as ValueCard<number>).value;

        activePlayerInfo.get(activePlayer).handCards[activePlayerInfo.get(activePlayer).handCards.length - 1] =
            privateInformation[activePlayer.lastCardAtStart].isActionCard === true ? 'action' :
                (privateInformation[activePlayer.lastCardAtStart] as ValueCard<number>).value;

    };

    // ['a', 'b', 'c']
    const lastActionIndex = activePlayerInfoCache.get(game)?.get?.(activePlayer)?.lastAction ?
        game.previousActions.indexOf(activePlayerInfoCache.get(game).get(activePlayer).lastAction) : -1;

    for (const action of game.previousActions.filter((_, i) => i > lastActionIndex))
        updateActivePlayerInfo(game, activePlayer, privateInformation, activePlayerInfo, action);

    if (!activePlayerInfoCache.has(game)) activePlayerInfoCache.set(game, new WeakMap());
    if (!activePlayerInfoCache.get(game).has(activePlayer)) activePlayerInfoCache.get(game).set(activePlayer, { lastAction: null, activePlayerInfo: null });

    activePlayerInfoCache.get(game).get(activePlayer).lastAction = game.previousActions[game.previousActions.length - 1];
    activePlayerInfoCache.get(game).get(activePlayer).activePlayerInfo = activePlayerInfo;

    return activePlayerInfo;
}

function updateActivePlayerInfo<activePlayer extends ActivePlayer>(game: Game, activePlayer: activePlayer, privateInformation: privateInformation<activePlayer['privateInformationKeys']>, activePlayerInfo: WeakMap<ActivePlayer, { handCards: handCards }>, action: action<ActivePlayer, Card, true, 'finished'> | disposeAction<ActivePlayer, Card>) {
    const averageCardValue = getAverageCard(game);

    if (action.type === 'dispose') {
        if (action.drawnCard.isActionCard === false)
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
    } else if (action.type === 'look') {
        if (action.performer === activePlayer)
            activePlayerInfo.get(action.performer).handCards[action.performer.hand.indexOf(action.cardSlot)] = privateInformation[action.privateInformationId].value;

        else if (activePlayerInfo.get(action.performer).handCards[action.performer.hand.indexOf(action.cardSlot)] === 'unknown')
            activePlayerInfo.get(action.performer).handCards[action.performer.hand.indexOf(action.cardSlot)] = 'known';
    } else if (action.type === 'extraDraw')
        for (const extraDrawAction of action.actions)
            updateActivePlayerInfo(game, activePlayer, privateInformation, activePlayerInfo, extraDrawAction.action);
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

const averageCardCache = new WeakMap<Game, number>();
function getAverageCard(game: Game) {
    if (averageCardCache.has(game))
        return averageCardCache.get(game);

    const cards: number[] =
        (game.cards.filter(card => card.isActionCard === false) as ValueCard<number>[])
            .map(card => card.value);

    const average = sum(cards) / cards.length;
    averageCardCache.set(game, average);
    return average;
}

const highestCardCache = new WeakMap<Game, number>();
function getHighestCard(game: Game) {
    if (highestCardCache.has(game))
        return highestCardCache.get(game);

    const max = Math.max(...(game.cards.filter(card => card.isActionCard === false) as ValueCard<number>[]).map(card => card.value));
    highestCardCache.set(game, max);
    return max;
}

function sum(array: number[]): number {
    return array.reduce((a, b) => a + b, 0);
}