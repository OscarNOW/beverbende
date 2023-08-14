export type actionCardActionName = 'switch' | 'look' | 'extraDraw';
export class ActionCard<currentAction extends actionCardActionName> {
    action: currentAction;
    isActionCard: true;

    constructor(action: currentAction) {
        this.action = action;
    }
}

export class ValueCard<value extends number> {
    value: value;
    isActionCard: false;

    constructor(value: value) {
        this.value = value;
    }
}
export type Card = ActionCard<actionCardActionName> | ValueCard<number>;

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

    replace(newCard: Card): Card {
        const oldCard = this.currentCard;

        this.previousCards.push(oldCard);
        this.currentCard = newCard;

        return oldCard;
    };
}

export class Player {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    performAction: <activePlayer extends ActivePlayer, drawnCard extends Card>
        (
            drawnCard: drawnCard,
            previousActions: action<ActivePlayer, Card, true, 'finished'>[],
            privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
            disposePile: Card[]
        ) =>
        action<activePlayer, drawnCard, true, 'new'>;

    declareLastRound: <activePlayer extends ActivePlayer>
        (
            previousActions: action<ActivePlayer, Card, true, 'finished'>[],
            privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
            disposePile: Card[]
        ) =>
        boolean;

    acceptExtraDrawCard: <activePlayer extends ActivePlayer, drawnCard extends Card>
        (
            drawnCard: drawnCard,
            previousActions: action<ActivePlayer, Card, true, 'finished'>[],
            currentAction: action<ActivePlayer, ActionCard<'extraDraw'>, true, 'current'>,
            privateInformation: privateInformation<activePlayer['privateInformationKeys']>,
            disposePile: Card[]
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

    firstCardAtStart: keyof this['privateInformationKeys'];
    lastCardAtStart: keyof this['privateInformationKeys'];

    private privateInformation: privateInformation<this['privateInformationKeys']>; //todo-imp: actually implement this in code
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
        privateInformationId: keyof performer['privateInformationKeys']
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
                    action: disposeAction<performer, drawnCard>
                },
                {
                    accepted: true;
                    action: action<performer, Card, true, stage>;
                }
            ] | [
                {
                    accepted: false;
                    action: disposeAction<performer, drawnCard>
                },
                {
                    accepted: false;
                    action: action<performer, Card, true, stage>;
                }
            ])
    } : never);

export type action<performer extends ActivePlayer, drawnCard extends Card, canDisposeValueCard extends boolean, stage extends 'finished' | 'current' | 'new'> =
    drawnCard extends ActionCard<actionCardActionName> ? actionCardAction<performer, drawnCard, stage> :
    drawnCard extends ValueCard<number> ? valueCardAction<performer, drawnCard, canDisposeValueCard, stage> : never;
