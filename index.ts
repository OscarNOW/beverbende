import { Game } from './src/index';

import { FirstPossibility } from './players/FirstPossibility';
import { OscarNoStop } from './players/OscarNoStop';

const aPoints = [];
const bPoints = [];

for (let ii = 0; ii < 1000; ii++) {
    const game = new Game([new FirstPossibility(), new OscarNoStop()]);

    while (game.state !== 'finished')
        game.nextAction();

    aPoints.push(game.activePlayerPoints[0]);
    bPoints.push(game.activePlayerPoints[1]);
}

console.log(sum(aPoints) / aPoints.length);
console.log(sum(bPoints) / bPoints.length);

function sum(array: number[]): number {
    return array.reduce((a, b) => a + b, 0);
}