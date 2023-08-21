import { Game } from '../src/index';

import { FirstPossibility } from '../players/FirstPossibility';
import { OscarNoStop } from '../players/OscarNoStop';
import { Web } from '../players/Web';

; (async () => {
    const web = new Web();
    web.gerUrl().then(console.log);

    const game = new Game([new FirstPossibility(), new OscarNoStop(), web]);
    while (game.state !== 'finished')
        await game.nextAction();
})();