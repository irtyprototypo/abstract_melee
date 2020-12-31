const express = require('express');
const app = express();
const path = require('path');
const buildDirectory = '/frontend/';
const { default: SlippiGame } = require('@slippi/slippi-js');
// const { default: SlippiGame, stages: stageUtil, moves: moveUtil, characters: characterUtil } = require('@slippi/slippi-js');
const game = new SlippiGame("test3.slp");


app.use(express.static(path.join(process.cwd(), buildDirectory)));
app.use(express.json());


app.get('/slippi_settings', (req, res) =>{
  res.send(game.getSettings());
});

app.get('/slippi_metadata', (req, res) =>{
  res.send(game.getMetadata());
});

app.get('/slippi_stats', (req, res) =>{
  res.send(game.getStats());
});

app.get('/slippi_frames/*', (req, res) =>{
  res.send(game.getFrames());
});


app.get('/*', (req, res) => {
  res.sendFile(path.join(process.cwd(), buildDirectory, 'index.html'));
});

let port = 8080;
app.listen(port);
console.log(`server listening on port ${port}`);
