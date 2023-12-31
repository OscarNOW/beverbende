import { Game } from './index';

export type actionCardActionName = 'switch' | 'look' | 'extraDraw';
export class ActionCard<currentActionName extends actionCardActionName> {
    action: currentActionName;
    isActionCard: true;

    constructor(action: currentActionName) {
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

    //todo: implement something like newAction or renderAction
    //todo: implement function that gets called when the game state changes

    init(activePlayer: ActivePlayer): Promise<void> {
        throw new Error('Extend this class and implement your own method');
    }

    performAction<canDisposeValueCard extends boolean, activePlayer extends ActivePlayer, drawnCard extends Card>(
        drawnCard: drawnCard,
        canDisposeValueCard: canDisposeValueCard,
        activePlayer: activePlayer,
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        game: Game
    ): Promise<action<activePlayer, drawnCard, canDisposeValueCard, 'new'>> | action<activePlayer, drawnCard, canDisposeValueCard, 'new'> {
        throw new Error('Extend this class and implement your own method');
    };

    declareLastRound<activePlayer extends ActivePlayer>(
        activePlayer: activePlayer,
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        game: Game
    ): Promise<boolean> | boolean {
        throw new Error('Extend this class and implement your own method');
    };

    acceptExtraDrawCard<activePlayer extends ActivePlayer, drawnCard extends Card>(
        drawnCard: drawnCard,
        activePlayer: activePlayer,
        currentAction: action<activePlayer, ActionCard<'extraDraw'>, true, 'current'>,
        privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
        game: Game
    ): Promise<boolean> | boolean {
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
    game: Game;
    id: string;

    firstCardAtStart: this['privateInformationKeys'][number];
    lastCardAtStart: this['privateInformationKeys'][number];

    private privateInformation: privateInformation<this['privateInformationKeys']>;
    privateInformationKeys: string[];

    constructor(player: Player, game: Game, firstCardAtStart: Card, lastCardAtStart: Card) {
        this.player = player;
        this.hand = [];
        this.game = game;

        this.privateInformationKeys = [];
        this.privateInformation = {} as privateInformation<this['privateInformationKeys']>;

        this.id = `${Math.floor(Math.random() * 10000)}`;

        this.firstCardAtStart = this.addToPrivateInformation(firstCardAtStart);
        this.lastCardAtStart = this.addToPrivateInformation(lastCardAtStart);
    }

    addToPrivateInformation(value: Card): this['privateInformationKeys'][number] {
        let privateInformationId: this['privateInformationKeys'][number];
        do {
            privateInformationId = `${Math.floor(Math.random() * 10000)}`;
        } while (this.privateInformationKeys.includes(privateInformationId));

        this.setKeyPrivateInformation(privateInformationId, value);
        return privateInformationId;
    }

    setKeyPrivateInformation(key: string, value: Card): void {
        if (this.privateInformation[key]) throw new Error('privateInformation key already set');
        this.privateInformation[key] = value;
        this.privateInformationKeys.push(key);
    }

    addCardSlot(cardSlot: CardSlot<this>): void { //todo: make private?
        this.hand.push(cardSlot);
    }

    async init() {
        return await this.player.init(this);
    }

    async performAction<canDisposeValueCard extends boolean, drawnCard extends Card>(
        drawnCard: drawnCard,
        canDisposeValueCard: canDisposeValueCard,
        game: Game
    ): Promise<action<this, drawnCard, canDisposeValueCard, 'new'>> {
        return await this.player.performAction(drawnCard, canDisposeValueCard, this, this.privateInformation, game);
    };

    async declareLastRound(
        game: Game
    ): Promise<boolean> {
        return await this.player.declareLastRound(this, this.privateInformation, game);
    }

    async acceptExtraDrawCard<drawnCard extends Card>(
        drawnCard: drawnCard,
        currentAction: action<this, ActionCard<'extraDraw'>, true, 'current'>,
        game: Game
    ): Promise<boolean> {
        return await this.player.acceptExtraDrawCard(drawnCard, this, currentAction, this.privateInformation, game);
    }
}

export type disposeAction<performer extends ActivePlayer, drawnCard extends Card> = {
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
        otherCardSlot: CardSlot<ActivePlayer>; //todo: check that this isn't a CardSlot of activePlayer in code
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
            (stage extends 'current' ?
                [] |
                [
                    {
                        accepted: false;
                        action: disposeAction<performer, Card>;
                    }
                ]
                : never) |
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
                    action: action<performer, Card, false, stage>;
                }
            ] | [
                {
                    accepted: false;
                    action: disposeAction<performer, Card>;
                },
                { //todo: no longer needed whe you can dispose ActionCards
                    accepted: false;
                    action: disposeAction<performer, Card>;
                }
            ]
        );
    } : never);

export type action<performer extends ActivePlayer, drawnCard extends Card, canDisposeValueCard extends boolean, stage extends 'finished' | 'current' | 'new'> =
    drawnCard extends ActionCard<actionCardActionName> ? actionCardAction<performer, drawnCard, stage> :
    drawnCard extends ValueCard<number> ? valueCardAction<performer, drawnCard, canDisposeValueCard, stage> : never;
