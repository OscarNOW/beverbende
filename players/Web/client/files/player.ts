import { Game } from '../../../../src';
import { ActionCard, ActivePlayer, Card, action, privateInformation } from '../../../../src/statics';

function render( //todo: export this function and make the Game call it when a new action is performed
    game: Game,
    privateInformation: privateInformation<ActivePlayer['privateInformationKeys']>,
    activePlayer: ActivePlayer
): void {
    renderCardFront(document.getElementById('disposePile'), game.disposePile.at(-1));
}

export function performAction<canDisposeValueCard extends boolean, activePlayer extends ActivePlayer, drawnCard extends Card>(
    drawnCard: drawnCard,
    canDisposeValueCard: canDisposeValueCard,
    activePlayer: activePlayer,
    privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
    game: Game
): Promise<action<activePlayer, drawnCard, canDisposeValueCard, 'new'>> {
    render(game, privateInformation, activePlayer);

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
    render(game, privateInformation, activePlayer);

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
    render(game, privateInformation, activePlayer);

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

function renderCardFront(element: HTMLElement, card: Card): void {
    if (card.isActionCard === true)
        element.innerText = `ActionCard: ${card.action}`;
    else
        element.innerText = `ValueCard: ${card.value}`;
}