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

    activePlayer: owner;
    handIndex: number;

    constructor(currentCard: Card, activePlayer: owner, handIndex: number) {
        this.currentCard = currentCard;
        this.activePlayer = activePlayer;
        this.handIndex = handIndex;
    };

    dispose() { };//todo
}

export class Player {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    performAction: <drawnCard extends Card, activePlayer extends ActivePlayer>
        (
            previousActions: action<ActivePlayer, Card>[],
            drawnCard: drawnCard
        ) =>
        action<activePlayer, drawnCard>;
}

export class ActivePlayer {
    player: Player;
    hand: CardSlot<this>[];

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

        ownCardSlot: CardSlot<performer>;
        otherCardSlot: CardSlot<extendsWithout<ActivePlayer, performer>>; // makes sure otherCardSlot isn't a cardSlot of performer. //todo: test if this works
    } :
    drawnCard['action'] extends 'look' ? {
        performer: performer;
        type: 'look';
        drawnCardLocation: 'dispose';

        cardSlot: CardSlot<performer>; //todo: implement a way so the ActivePlayer can actually see the card
    } :
    drawnCard['action'] extends 'extraDraw' ? {
        performer: performer;
        type: 'extraDraw';
        drawnCardLocation: 'dispose';

        //todo
    } :
    never :
    drawnCard extends ValueCard ?
    {
        performer: performer;
        type: 'dispose';
        drawnCardLocation: 'dispose';

        card: drawnCard;
    } |
    {
        performer: performer;
        type: 'use';
        drawnCardLocation: 'hand';

        cardSlot: CardSlot<performer>;

        //todo: add way of seeing disposed card
    } :
    never;