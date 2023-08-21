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

export function cancel(): void {
    console.log('cancel');
}

export function init(activePlayer: ActivePlayer): void {
    console.log('init', activePlayer);
}

let stateElement: HTMLElement = document.getElementById('state');
export function state(newState: 'connecting' | 'initializing' | 'addingListeners' | 'waitingForRequests'): void {
    stateElement.style.display = null;

    document.getElementById('stateText').innerText = {
        'connecting': 'Connecting',
        'initializing': 'Initializing',
        'addingListeners': 'Adding listeners',
        'waitingForRequests': 'Waiting for requests'
    }[newState];

    if (newState === 'waitingForRequests')
        setTimeout(() => { //so all pending requests can be sent
            stateElement.style.display = 'none';
        }, 700);
}