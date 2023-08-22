import { Game } from '../../../../src';
import { ActionCard, ActivePlayer, Card, action, privateInformation } from '../../../../src/statics';

let game: Game;
let activePlayer: ActivePlayer;
let privateInformation: privateInformation<(typeof activePlayer)['privateInformationKeys']>;

function render(): void { //todo: export this function and make the Game call it when a new action is performed
    renderCardFront(document.getElementById('disposePileCard'), game.disposePile.at(-1));
}

function renderDrawnCard(drawnCard: Card): void {
    renderCardFront(document.getElementById('drawnCard'), drawnCard);
    document.getElementById('drawnCardContainer').style.display = null;
}

export function performAction<canDisposeValueCard extends boolean, activePlayer extends ActivePlayer, drawnCard extends Card>(
    drawnCard: drawnCard,
    canDisposeValueCard: canDisposeValueCard,
    givenActivePlayer: activePlayer,
    givenPrivateInformation: privateInformation<activePlayer['privateInformationKeys']>,
    givenGame: Game
): Promise<action<activePlayer, drawnCard, canDisposeValueCard, 'new'>> {
    game = givenGame;
    privateInformation = givenPrivateInformation;
    activePlayer = givenActivePlayer;

    render();
    renderDrawnCard(drawnCard);

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
    givenActivePlayer: activePlayer,
    givenPrivateInformation: privateInformation<activePlayer['privateInformationKeys']>,
    givenGame: Game
): Promise<boolean> {
    game = givenGame;
    privateInformation = givenPrivateInformation;
    activePlayer = givenActivePlayer;

    render();

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
    givenActivePlayer: activePlayer,
    currentAction: action<activePlayer, ActionCard<'extraDraw'>, true, 'current'>,
    givenPrivateInformation: privateInformation<activePlayer['privateInformationKeys']>,
    givenGame: Game
): Promise<boolean> {
    game = givenGame;
    privateInformation = givenPrivateInformation;
    activePlayer = givenActivePlayer;

    render();
    renderDrawnCard(drawnCard);

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

export function init(givenActivePlayer: ActivePlayer): void { //todo: add privateInformation to init
    game = givenActivePlayer.game;
    activePlayer = givenActivePlayer;

    render();
    console.log('init', givenActivePlayer);
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