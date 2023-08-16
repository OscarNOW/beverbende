import { Game } from './src/index';

import { Random } from './players/Random';
import { OscarNoStop } from './players/OscarNoStop';

const game = new Game([new Random(), new OscarNoStop()]);

while (game.state !== 'finished')
    game.nextAction();

console.log(game.activePlayerPoints);
