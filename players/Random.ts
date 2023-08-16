import { ActionCard, ActivePlayer, Card, Player, action, privateInformation } from '../src/statics';
import { Game } from '../src/index';

export class Random extends Player {
    constructor() {
        super('Random');
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
        if (drawnCard.isActionCard)
            if (drawnCard.action === 'extraDraw')
                return {
                    performer: activePlayer,
                    type: 'extraDraw',
                    drawnCardLocation: 'dispose',
                    drawnCard: drawnCard,
                    actions: []
                } as action<activePlayer, drawnCard, canDisposeValueCard, 'new'> //todo: remove
            else if (drawnCard.action === 'look')
                return {
                    performer: activePlayer,
                    type: 'look',
                    drawnCardLocation: 'dispose',
                    drawnCard,

                    cardSlot: activePlayer.hand[0]
                } as action<activePlayer, drawnCard, canDisposeValueCard, 'new'> //todo: remove
            else if (drawnCard.action === 'switch')
                return {
                    performer: activePlayer,
                    type: 'switch',
                    drawnCardLocation: 'dispose',
                    drawnCard,

                    ownCardSlot: activePlayer.hand[0],
                    otherCardSlot: game.activePlayers.find(p => p !== activePlayer).hand[0]
                } as action<activePlayer, drawnCard, canDisposeValueCard, 'new'> //todo: remove
            else
                throw new Error(`Unknown action: "${drawnCard.action}"`)
        else if (drawnCard.isActionCard === false)
            if (canDisposeValueCard)
                return {
                    performer: activePlayer,
                    type: 'dispose',
                    drawnCardLocation: 'dispose',
                    drawnCard
                } as action<activePlayer, drawnCard, canDisposeValueCard, 'new'> //todo: remove
            else
                return {
                    performer: activePlayer,
                    type: 'use',
                    drawnCardLocation: 'hand',
                    cardSlot: activePlayer.hand[0]
                } as action<activePlayer, drawnCard, canDisposeValueCard, 'new'> //todo: remove
        else
            throw new Error(`Unknown isActionCard: "${drawnCard.isActionCard}"`)
    }

    declareLastRound<activePlayer extends ActivePlayer>(
        activePlayer: activePlayer,
        previousActions: action<ActivePlayer, Card, true, 'finished'>[],
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        disposePile: Card[]
    ): boolean {
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
        return true;
    }

}