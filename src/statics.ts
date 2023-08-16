import { Game } from './index'; //todo: circular import?

export type actionCardActionName = 'switch' | 'look' | 'extraDraw';
export class ActionCard<currentAction extends actionCardActionName> {
    action: currentAction;
    isActionCard: true;

    constructor(action: currentAction) {
        this.action = action;
        this.isActionCard = true;
    }
}

export class ValueCard<value extends number> {
    value: value;
    isActionCard: false;

    constructor(value: value) {
        this.value = value;
        this.isActionCard = false;
    }
}
export type Card = ActionCard<actionCardActionName> | ValueCard<number>;

export class CardSlot<owner extends ActivePlayer> {
    handCardId: string;
    previousCards: Card[];

    activePlayer: owner;
    handIndex: number;

    constructor(handCardId: string, activePlayer: owner, handIndex: number) {
        this.handCardId = handCardId;
        this.activePlayer = activePlayer;
        this.handIndex = handIndex;

        this.previousCards = [];
    };
}

export class Player {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    performAction<canDisposeValueCard extends boolean, activePlayer extends ActivePlayer, drawnCard extends Card>(
        drawnCard: drawnCard,
        canDisposeValueCard: canDisposeValueCard,
        activePlayer: activePlayer,
        previousActions: action<ActivePlayer, Card, true, 'finished'>[],
        isLastRound: boolean,
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        disposePile: Card[], //todo: remove
        game: Game
    ): action<activePlayer, drawnCard, canDisposeValueCard, 'new'> {
        throw new Error('Extend this class and implement your own method');
    };

    declareLastRound<activePlayer extends ActivePlayer>(
        activePlayer: activePlayer,
        previousActions: action<ActivePlayer, Card, true, 'finished'>[],
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        disposePile: Card[]
        //todo: add game
    ): boolean {
        throw new Error('Extend this class and implement your own method');
    };

    acceptExtraDrawCard<activePlayer extends ActivePlayer, drawnCard extends Card>(
        drawnCard: drawnCard,
        activePlayer: activePlayer,
        previousActions: action<ActivePlayer, Card, true, 'finished'>[],
        isLastRound: boolean,
        currentAction: action<ActivePlayer, ActionCard<'extraDraw'>, true, 'current'>,
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        disposePile: Card[]
        //todo: add game
    ): boolean {
        throw new Error('Extend this class and implement your own method');
    };
}

export type privateInformation<includingKeys extends string[]> = {
    // eslint-disable-next-line no-unused-vars
    [privateInformationId in includingKeys[number]]: Card; //todo: test if this works
};

export class ActivePlayer {
    player: Player;
    hand: CardSlot<this>[];

    firstCardAtStart: this['privateInformationKeys'][number];
    lastCardAtStart: this['privateInformationKeys'][number];

    private privateInformation: privateInformation<this['privateInformationKeys']>;
    privateInformationKeys: string[];

    constructor(player: Player) {
        this.player = player;
        this.hand = [];
        this.privateInformation = {} as privateInformation<this['privateInformationKeys']>;
    }

    addToPrivateInformation(key: string, value: Card): void {
        if (this.privateInformation[key]) throw new Error('privateInformation key already set');
        this.privateInformation[key] = value;
        this.privateInformationKeys.push(key);
    }

    addCardSlot(cardSlot: CardSlot<this>): void { //todo: make private?
        this.hand.push(cardSlot);
    }

    performAction<canDisposeValueCard extends boolean, drawnCard extends Card>(
        drawnCard: drawnCard,
        canDisposeValueCard: canDisposeValueCard,
        previousActions: action<ActivePlayer, Card, true, 'finished'>[],
        isLastRound: boolean,
        disposePile: Card[],
        game: Game
    ): action<this, drawnCard, canDisposeValueCard, 'new'> {
        return this.player.performAction(drawnCard, canDisposeValueCard, this, previousActions, isLastRound, this.privateInformation, disposePile, game);
    };

    declareLastRound(
        previousActions: action<ActivePlayer, Card, true, 'finished'>[],
        disposePile: Card[]
    ): boolean {
        return this.player.declareLastRound(this, previousActions, this.privateInformation, disposePile);
    }

    acceptExtraDrawCard<drawnCard extends Card>(
        drawnCard: drawnCard,
        previousActions: action<ActivePlayer, Card, true, 'finished'>[],
        isLastRound: boolean,
        currentAction: action<ActivePlayer, ActionCard<'extraDraw'>, true, 'current'>,
        disposePile: Card[]
    ): boolean {
        return this.player.acceptExtraDrawCard(drawnCard, this, previousActions, isLastRound, currentAction, this.privateInformation, disposePile);
    }
}

type extendsWithout<extending, without> = extending extends without ? never : extending;

type disposeAction<performer extends ActivePlayer, drawnCard extends Card> = {
    performer: performer;
    type: 'dispose';
    drawnCardLocation: 'dispose';
    drawnCard: drawnCard;
};

type valueCardAction<performer extends ActivePlayer, drawnCard extends ValueCard<number>, canDisposeValueCard extends boolean, stage extends 'finished' | 'current' | 'new'> =
    (true extends canDisposeValueCard ? disposeAction<performer, drawnCard> : never) |
    {
        performer: performer;
        type: 'use';
        drawnCardLocation: 'hand';
        disposedCard: stage extends 'new' ? never : Card; //todo: test if never works here

        cardSlot: CardSlot<performer>;
    };

type actionCardAction<performer extends ActivePlayer, drawnCard extends ActionCard<actionCardActionName>, stage extends 'finished' | 'current' | 'new'> =
    ('switch' extends drawnCard['action'] ? {
        performer: performer;
        type: 'switch';
        drawnCardLocation: 'dispose';
        drawnCard: drawnCard;

        ownCardSlot: CardSlot<performer>;
        otherCardSlot: CardSlot<extendsWithout<ActivePlayer, performer>>; // makes sure otherCardSlot isn't a cardSlot of performer. //todo: test if this works
    } : never) |

    ('look' extends drawnCard['action'] ? {
        performer: performer;
        type: 'look';
        drawnCardLocation: 'dispose';
        drawnCard: drawnCard;

        cardSlot: CardSlot<performer>;
        privateInformationId: stage extends 'new' ? never : performer['privateInformationKeys'][number]
    } : never) |

    ('extraDraw' extends drawnCard['action'] ? {
        performer: performer;
        type: 'extraDraw';
        drawnCardLocation: 'dispose';
        drawnCard: drawnCard;

        actions:
        stage extends 'new' ? [] : (
            (stage extends 'current' ? [] : never) | //todo: test if never works here
            [
                {
                    accepted: true;
                    action: action<performer, Card, false, stage>;
                }
            ] | [
                {
                    accepted: false;
                    action: disposeAction<performer, Card>;
                },
                {
                    accepted: true;
                    action: action<performer, Card, true, stage>;
                }
            ] | [
                {
                    accepted: false;
                    action: disposeAction<performer, Card>;
                },
                {
                    accepted: false;
                    action: disposeAction<performer, Card>;
                }
            ]
        );
    } : never);

export type action<performer extends ActivePlayer, drawnCard extends Card, canDisposeValueCard extends boolean, stage extends 'finished' | 'current' | 'new'> =
    drawnCard extends ActionCard<actionCardActionName> ? actionCardAction<performer, drawnCard, stage> :
    drawnCard extends ValueCard<number> ? valueCardAction<performer, drawnCard, canDisposeValueCard, stage> : never;
