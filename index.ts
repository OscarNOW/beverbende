import { Game } from './src/index';
import { Random } from './players/Random';

const game = new Game([new Random(), new Random()]);

while (game.state !== 'finished')
    game.nextAction();

console.log(game.activePlayerPoints);
