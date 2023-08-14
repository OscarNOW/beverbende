export type actionCardAction = 'switch' | 'look' | 'extraDraw';
export class ActionCard<thisAction extends actionCardAction> {
    action: thisAction;
    isActionCard: true;

    constructor(action: thisAction) {
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
export type Card = ActionCard<actionCardAction> | ValueCard<number>;

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
type typeIsSpecific<type, values> = values extends type ? false : true;

type disposeAction<performer extends ActivePlayer, drawnCard extends Card> = {
    performer: performer;
    type: 'dispose';
    drawnCardLocation: 'dispose';
    drawnCard: drawnCard;
};

export type action<performer extends ActivePlayer, drawnCard extends Card, canDisposeValueCard extends boolean, stage extends 'finished' | 'current' | 'new'> =
    drawnCard extends ActionCard<actionCardAction> ?
    (
        typeIsSpecific<drawnCard['action'], actionCardAction> extends false ?
        (
            {
                performer: performer;
                type: 'switch';
                drawnCardLocation: 'dispose';
                drawnCard: drawnCard;

                ownCardSlot: CardSlot<performer>;
                otherCardSlot: CardSlot<extendsWithout<ActivePlayer, performer>>; // makes sure otherCardSlot isn't a cardSlot of performer. //todo: test if this works
            } | {
                performer: performer;
                type: 'look';
                drawnCardLocation: 'dispose';
                drawnCard: drawnCard;

                cardSlot: CardSlot<performer>;
                privateInformationId: stage extends 'new' ? never : keyof performer['privateInformationKeys'] //todo: test if never works here
            } | {
                performer: performer;
                type: 'extraDraw';
                drawnCardLocation: 'dispose';
                drawnCard: drawnCard;

                actions: [
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
                ]
            }
        ) :
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

            actions:
            stage extends 'new' ? never : //todo: test if never works here
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
            ]
        } : never
    ) :
    drawnCard extends ValueCard<number> ?
    (
        canDisposeValueCard extends false ?
        {
            performer: performer;
            type: 'use';
            drawnCardLocation: 'hand';
            disposedCard: stage extends 'new' ? never : Card; //todo: test if never works here
        } :
        (
            disposeAction<performer, drawnCard> |
            {
                performer: performer;
                type: 'use';
                drawnCardLocation: 'hand';
                disposedCard: stage extends 'new' ? never : Card; //todo: test if never works here

                cardSlot: CardSlot<performer>;
            }
        )
    ) : never;
