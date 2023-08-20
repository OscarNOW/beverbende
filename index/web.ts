import { Game } from '../src/index';

import { FirstPossibility } from '../players/FirstPossibility';
import { OscarNoStop } from '../players/OscarNoStop';
import { Web } from '../players/Web';

const web = new Web();
console.log(web.url);

const game = new Game([new FirstPossibility(), new OscarNoStop(), web]);

; (async () => {
    while (game.state !== 'finished')
        await game.nextAction();
})();