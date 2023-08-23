import { Game } from '../../../../src';
import { ActionCard, ActivePlayer, Card, action, privateInformation } from '../../../../src/statics';

let game: Game;
let activePlayer: ActivePlayer;
let privateInformation: privateInformation<(typeof activePlayer)['privateInformationKeys']>;

function render(): void { //todo: export this function and make the Game call it when a new action is performed
    renderCardFront(document.getElementById('disposePileCard'), game.disposePile.at(-1));

    const maxActivePlayers = 4;
    const activePlayerAmount = game.activePlayers.length;

    if (activePlayerAmount > 4) throw new Error(`Max amount of ${maxActivePlayers} activePlayers implemented for the WebPlayer`);

    for (let ii = 1; ii < maxActivePlayers; ii++)
        if (activePlayerAmount > ii)
            document.getElementById(`player${ii}hand`).style.display = null
        else
            document.getElementById(`player${ii}hand`).style.display = 'none';
}

function renderDrawnCard(drawnCard: Card): void {
    renderCardFront(document.getElementById('drawnCard'), drawnCard);
    document.getElementById('drawnCardContainer').style.display = null;
}

function makeSelectable(element: HTMLElement, callback: () => void): void {
    const listener = () => {
        element.removeEventListener('click', listener);
        callback();
    };

    element.addEventListener('click', listener);
    element.classList.remove('not-selectable');
    element.classList.add('selectable');
};

function chooseHandCard(): Promise<number> {
    console.debug('chooseHandCard', 1);
    return new Promise(res => {
        makeOtherHandsNotSelectable();
        makeNotSelectable(document.getElementById('disposePileCard'));
        makeNotSelectable(document.getElementById('deck'));

        for (const cardIndex in activePlayer.hand) {
            makeSelectable(([...document.getElementById('ourHand').children].filter((a: Element) => a instanceof HTMLElement) as HTMLElement[])[cardIndex], () => {
                //todo-imp: remove the selectable classes on the elements
                console.debug('chooseHandCard', 2, cardIndex);
                res(parseInt(cardIndex));
            })
        };

    });
}

function makeNotSelectable(element: HTMLElement): void {
    element.classList.remove('selectable');
    element.classList.add('not-selectable');
}

function makeOtherHandsNotSelectable(): void {
    for (let activePlayerIndex = 1; activePlayerIndex < game.activePlayers.length; activePlayerIndex++)
        for (const cardElement of [...document.getElementById(`player${activePlayerIndex}hand`).children].filter(a => a instanceof HTMLElement) as HTMLElement[])
            makeNotSelectable(cardElement);
}

function makeOurHandNotSelectable(): void {
    for (const cardElement of [...document.getElementById('ourHand').children].filter(a => a instanceof HTMLElement) as HTMLElement[])
        makeNotSelectable(cardElement);
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

    console.log('performAction', {
        drawnCard,
        canDisposeValueCard,
        activePlayer,
        privateInformation,
        game
    });

    return new Promise(async res => {
        if (drawnCard.isActionCard) {
            if (drawnCard.action === 'extraDraw') {
                makeOtherHandsNotSelectable();
                makeOurHandNotSelectable();
                makeNotSelectable(document.getElementById('deck'));

                makeSelectable(document.getElementById('disposePileCard'), () => {
                    //todo-imp: remove the selectable classes on the elements
                    res({
                        // @ts-ignore //todo: remove this
                        performer: activePlayer,
                        type: 'extraDraw',
                        drawnCardLocation: 'dispose',
                        drawnCard,
                        actions: []
                    });
                });
            } else if (drawnCard.action === 'look') {
                res({
                    //@ts-ignore //todo: remove this
                    performer: activePlayer,
                    type: 'look',
                    drawnCardLocation: 'dispose',
                    drawnCard,
                    cardSlot: activePlayer.hand[await chooseHandCard()]
                });
            } else if (drawnCard.action === 'switch') {
                const ourHandIndex = await chooseHandCard();

                makeNotSelectable(document.getElementById('disposePileCard'));
                makeNotSelectable(document.getElementById('deck'));
                makeOurHandNotSelectable();

                for (const playerIndex in game.activePlayers.filter(a => a !== activePlayer)) {
                    for (const cardIndex in game.activePlayers[playerIndex].hand) {
                        console.log(`player${playerIndex + 1}hand`)
                        makeSelectable(([...document.getElementById(`player${playerIndex + 1}hand`).children].filter(a => a instanceof HTMLElement) as HTMLElement[])[cardIndex], () => {
                            //todo-imp: remove the selectable classes on the elements
                            res({
                                //@ts-ignore //todo: remove this
                                performer: activePlayer,
                                type: 'switch',
                                drawnCardLocation: 'dispose',
                                drawnCard,

                                ownCardSlot: activePlayer.hand[ourHandIndex],
                                otherCardSlot: game.activePlayers[playerIndex].hand[cardIndex]
                            });
                        })
                    }
                }
            }
        } else {
            //todo-imp
        }
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