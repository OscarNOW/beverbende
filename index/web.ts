import { Game } from '../src/index';

import { FirstPossibility } from '../players/FirstPossibility';
import { OscarNoStop } from '../players/OscarNoStop';
import { Web } from '../players/Web';

const game = new Game([new FirstPossibility(), new OscarNoStop(), new Web()]);

; (async () => {
    while (game.state !== 'finished')
        await game.nextAction();
})();