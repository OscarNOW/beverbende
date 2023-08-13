import { Card, ValueCard, ActionCard } from "./statics";

export const defaultDeck: Card[] = [
    ...Array(9).fill(null).map((_, i) => Array(4).fill(new ValueCard(i))).flat(),
    ...Array(9).fill(new ValueCard(9)),
    ...Array(6).fill(new ActionCard('extraDraw')),
    ...Array(3).fill(new ActionCard('switch')),
    ...Array(9).fill(new ActionCard('look')),
];

export const defaultHandSize = 4;