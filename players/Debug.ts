import { ActivePlayer, Card, Player, action, privateInformation } from '../src/statics';
import { Game } from '../src/index';

export class Debug extends Player {
    constructor() {
        super('Debug');
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
}