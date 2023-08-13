export type actionCard = 'switch' | 'look' | 'extraDraw';
export class ActionCard {
    action: actionCard;
    isActionCard: true;

    constructor(action: actionCard) {
        this.action = action;
    }
}

export class ValueCard {
    value: number;
    isActionCard: false;

    constructor(value: number) {
        this.value = value;
    }
}
export type Card = ActionCard | ValueCard;

export class CardSlot<owner extends ActivePlayer> {
    private currentCard: Card;
    previousCards: Card[];

    activePlayer: owner;
    handIndex: number;

    constructor(currentCard: Card, activePlayer: owner, handIndex: number) {
        this.currentCard = currentCard;
        this.activePlayer = activePlayer;
        this.handIndex = handIndex;

        this.previousCards = [];
    };

    dispose() { };//todo
}

export class Player {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    performAction: <activePlayer extends ActivePlayer, drawnCard extends Card>
        (
            previousActions: action<ActivePlayer, Card>[],
            privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
            drawnCard: drawnCard
        ) =>
        newAction<activePlayer, drawnCard>;

    declareLastRound: <activePlayer extends ActivePlayer>
        (
            previousActions: action<ActivePlayer, Card>[],
            privateInformation: privateInformation<activePlayer['privateInformationKeys']>
        ) =>
        boolean;
}

type privateInformation<includingKeys extends string[]> = {
    // eslint-disable-next-line no-unused-vars
    [privateInformationId in keyof includingKeys]: Card; //todo: test if this works
};

export class ActivePlayer {
    player: Player;
    hand: CardSlot<this>[];

    private privateInformation: privateInformation<this['privateInformationKeys']>;
    privateInformationKeys: string[];

    constructor(player: Player) {
        this.player = player;
        this.hand = [];
    }

    addCardSlot(cardSlot: CardSlot<this>): void {
        this.hand.push(cardSlot);
    }
}

type extendsWithout<extending, without> = extending extends without ? never : extending;

export type action<performer extends ActivePlayer, drawnCard extends Card> =
    drawnCard extends ActionCard ?
    drawnCard['action'] extends 'switch' ? {
        performer: performer;
        type: 'switch';
        drawnCardLocation: 'dispose';
        drawnCard: drawnCard;

        ownCardSlot: CardSlot<performer>;
        otherCardSlot: CardSlot<extendsWithout<ActivePlayer, performer>>; // makes sure otherCardSlot isn't a cardSlot of performer. //todo: test if this works
    } :
    drawnCard['action'] extends 'look' ? {
        performer: performer;
        type: 'look';
        drawnCardLocation: 'dispose';
        drawnCard: drawnCard;

        cardSlot: CardSlot<performer>;
        privateInformationId: keyof performer['privateInformationKeys']
    } :
    drawnCard['action'] extends 'extraDraw' ? {
        performer: performer;
        type: 'extraDraw';
        drawnCardLocation: 'dispose';
        drawnCard: drawnCard;

        //todo
    } :
    never :
    drawnCard extends ValueCard ?
    {
        performer: performer;
        type: 'dispose';
        drawnCardLocation: 'dispose';
        drawnCard: drawnCard;
    } |
    {
        performer: performer;
        type: 'use';
        drawnCardLocation: 'hand';
        disposedCard: Card;

        cardSlot: CardSlot<performer>;
    } :
    never;

type newAction<performer extends ActivePlayer, drawnCard extends Card> =
    Omit<action<performer, drawnCard>,
        'privateInformationId' | 'disposedCard'>; //todo: test if Omit works
