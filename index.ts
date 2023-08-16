import { Game } from './src/index';

import { FirstPossibility } from './players/FirstPossibility';
import { OscarNoStop } from './players/OscarNoStop';

const game = new Game([new FirstPossibility(), new OscarNoStop()]);

while (game.state !== 'finished')
    game.nextAction();

console.log(game.activePlayerPoints);
