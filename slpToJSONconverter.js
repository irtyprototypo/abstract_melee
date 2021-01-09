
const { default: SlippiGame } = require('@slippi/slippi-js');
const game = new SlippiGame("uploads/gam.slp");
const fs = require('fs');

str = `const slp_replay ={
    data: {
        settings: ${JSON.stringify(game.getSettings())},
        metadata:${JSON.stringify(game.getMetadata())},
        frames:${JSON.stringify(game.getFrames())},
        stats:${JSON.stringify(game.getStats())}
    }
};`;


fs.writeFile('slp_replay.json', str, _=>{ console.log('file created.'); });


