import { Game } from './src/index';
import { Debug as DebugPlayer } from './players/Debug';

const game = new Game([new DebugPlayer(), new DebugPlayer()]);

while (game.state !== 'finished')
    game.nextAction();

console.log(game.activePlayerPoints);
