const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require("body-parser");
const buildDirectory = '/frontend/';
const upload = require('express-fileupload');
const formidable = require('formidable');

const { default: SlippiGame } = require('@slippi/slippi-js');
const { log } = require('console');
// const { default: SlippiGame, stages: stageUtil, moves: moveUtil, characters: characterUtil } = require('@slippi/slippi-js');
const game = new SlippiGame("test3.slp");


app.use(express.static(path.join(process.cwd(), buildDirectory)));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(upload());


app.post('/slp_file*', (req, res) =>{
  // let form = new formidable.IncomingForm();
  // form.uploadDir() = "/uploads";
  // form.keepExtensions = true;
  // form.maxFieldsSize = 20 * 1024 * 1024 // 30 MB
  // form.parse(req, (err, fields, files) =>{
  //   if (err) console.log(err);
  //   let arroffiles = files[''];
  //   filename = files[0].path;
  
  
  // });
  // res.send(game.getSettings());
  // console.log(req.route.stack);
  // let data = req.POST.get('data', '');
  console.log(req.body);


  res.send({text: 'posted maybe'});

});

app.get('/slippi_settings*', (req, res) =>{
  res.send(game.getSettings());
});

app.get('/slippi_metadata*', (req, res) =>{
  res.send(game.getMetadata());
});

app.get('/slippi_stats*', (req, res) =>{
  res.send(game.getStats());
});

app.get('/slippi_frames*', (req, res) =>{
  res.send(game.getFrames());
});


app.get('/*', (req, res) => {
  res.sendFile(path.join(process.cwd(), buildDirectory, 'index.html'));
});

let port = 8080;
app.listen(port);
console.log(`server listening on port ${port}`);
