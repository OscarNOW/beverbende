import { Game } from '../src/index';

import { FirstPossibility } from '../players/FirstPossibility';
import { OscarNoStop } from '../players/OscarNoStop';

; (async () => {
    const aPoints = [];
    const bPoints = [];

    for (let jj = 1; jj <= 10; jj++) {
        console.log(`${jj}/10`);

        for (let ii = 0; ii < 3000; ii++) {
            // const game = new Game([new FirstPossibility(), new OscarNoStop()]);
            const game = new Game([new OscarNoStop(), new OscarNoStop()]);

            while (game.state !== 'finished')
                await game.nextAction();

            aPoints.push(game.activePlayerPoints[0]);
            bPoints.push(game.activePlayerPoints[1]);
        }
    }

    console.log()
    console.log([Math.round(sum(aPoints) / aPoints.length), Math.round(sum(bPoints) / bPoints.length)]);

    function sum(array: number[]): number {
        return array.reduce((a, b) => a + b, 0);
    }

    try {
        // Create boxplot
        console.log();
        const plotly = require('plotly')('OscarNOW', require('../secret.json').plotly);

        const data = [
            {
                y: aPoints,
                boxpoints: 'all',
                jitter: 0.4,
                pointpos: 0,
                type: 'box'
            },
            {
                y: bPoints,
                boxpoints: 'all',
                jitter: 0.4,
                pointpos: 0,
                type: 'box'
            }
        ];
        const graphOptions = { filename: 'box-plot', fileopt: 'overwrite' };

        plotly.plot(data, graphOptions, function (err: any, msg: {
            streamStatus: undefined;
            url: string;
            message: string;
            warning: string;
            filename: string;
            error: string;
        }) {
            if (err) throw err;
            else if (msg.error.length !== 0) throw msg.error;
            else if (msg.warning.length !== 0) console.warn(msg.warning);

            console.log(msg.url);
        });
    } catch {
        console.warn('Box plot failed');
    }
})();