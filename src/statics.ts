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