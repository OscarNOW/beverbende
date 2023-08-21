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

const messages = {
    'disconnect': 'De verbinding is verloren',
    'connecting': 'Verbinden',
    'connectFail': 'Het verbinden is mislukt',
    'initializing': 'Initialiseren',
    'initFail': 'De initialisatie is mislukt',
    'addingListeners': 'Functies toevoegen',
    'waitingForRequests': 'Wachten voor aanvragen'
} as const;

let stateElement: HTMLElement = document.getElementById('state');
export function state(newState: keyof typeof messages): void {
    stateElement.style.display = null;

    document.getElementById('stateText').innerText = messages[newState];

    if (['disconnect', 'connectFail'].includes(newState))
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    if (newState === 'waitingForRequests')
        setTimeout(() => { //so all pending requests can be sent
            stateElement.style.display = 'none';
        }, 700);
}