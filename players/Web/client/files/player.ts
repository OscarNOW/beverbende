import { Game } from '../../../../src';
import { ActionCard, ActivePlayer, Card, action, privateInformation } from '../../../../src/statics';

export function performAction<canDisposeValueCard extends boolean, activePlayer extends ActivePlayer, drawnCard extends Card>(
    drawnCard: drawnCard,
    canDisposeValueCard: canDisposeValueCard,
    activePlayer: activePlayer,
    privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
    game: Game
): Promise<action<activePlayer, drawnCard, canDisposeValueCard, 'new'>> {
    return new Promise(res => {
        console.log('performAction', {
            drawnCard,
            canDisposeValueCard,
            activePlayer,
            privateInformation,
            game
        });
    });
};

export function declareLastRound<activePlayer extends ActivePlayer>(
    activePlayer: activePlayer,
    privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
    game: Game
): Promise<boolean> {
    return new Promise(res => {
        console.log('declareLastRound', {
            activePlayer,
            privateInformation,
            game
        });
    });
};

export function acceptExtraDrawCard<activePlayer extends ActivePlayer, drawnCard extends Card>(
    drawnCard: drawnCard,
    activePlayer: activePlayer,
    currentAction: action<activePlayer, ActionCard<'extraDraw'>, true, 'current'>,
    privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
    game: Game
): Promise<boolean> {
    return new Promise(res => {
        console.log('acceptExtraDrawCard', {
            drawnCard,
            activePlayer,
            currentAction,
            privateInformation,
            game
        });
    });
};