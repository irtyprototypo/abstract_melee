const CANVAS_WIDTH = 1208;
const CANVAS_HEIGHT = 680;

let GAME_STATS, GAME_FRAMES, GAME_METADATA, GAME_SETTINGS, GAME_DATA, CHARACTERS;
let ctx, lastFrame, stage, perspective;
let currentFrame = 0;
let playerList = [];
let zoneList = [];
let isPaused = true;
let trails = false;
let debugView = false;
let zonesVisible = 1;
let characterBubbleVisible = true;
let gameOver = false;

/**
 * to do
 *  - upload json file
 *  - options engine
 *  - more zones!
 *  - threat zones
 *  - draw DI
 *  - HUD
 *  - items/projectiles
 * 
 */


function init(){
    GAME_FRAMES = slp_replay.data.frames;
    GAME_METADATA = slp_replay.data.metadata;
    GAME_SETTINGS = slp_replay.data.settings;
    GAME_STATS = slp_replay.data.stats;
    GAME_DATA = game_data.data;

    console.log(GAME_FRAMES);
    console.log(GAME_METADATA);
    console.log(GAME_SETTINGS);
    console.log(GAME_STATS);
    console.log(GAME_DATA);

    ctx = createCanvas();

    setPlayers();
    setPerspective(0);
    guiNameColors();

    setStage();
    stage.drawStage();

    lastFrame = GAME_METADATA.lastFrame;

    createZones(stage.name);
    // findInflectionPoints();
    generateInflectionPoints();

    requestAnimationFrame(mainLoop);
}


function mainLoop(){
    // let frameRate = 16.67 * 2;
    let frameRate = 16.67;

    if (!isPaused)
        currentFrame++;

        
    updatePlayerPositions();
    
    // console.log(perspective.getRubberBandStress()); 
    
    zonesOccupied();
    drawGameScreen();
    displayMediaButtons();
    gameOverCheck();
    generateOptions();

    setTimeout(_=> { requestAnimationFrame(mainLoop); }, frameRate);
}


function generateOptions(){
    if(!isPaused)
        return;

    // perspective.zones.forEach(zone =>{
    //     console.log(zone.name);
    // });

}

function setPerspective(playerIndex){
    playerList.forEach(p =>{
        if (p.index === playerIndex){
            perspective = p;
            p.activePerspective = true;
            document.getElementById(`p${p.port}-text-container`).style.border = '2px solid #00ff00';
        } else{
            p.activePerspective = false;
            document.getElementById(`p${p.port}-text-container`).style.border = 'none';
        }
    });
    console.log(`Perspective set to ${perspective.name}.`);
}


function createZones(name){

    zoneList.push(new Zone('Center', stage.leftPlatformRight, stage.topPlatformBottom, stage.rightPlatformLeft, stage.y_offset));
    zoneList.push(new Zone('L Corner', stage.leftPlatformLeft - 8, stage.leftPlatformBottom, stage.leftPlatformRight - 15, stage.y_offset - 3.3));
    zoneList.push(new Zone('R Corner', stage.rightPlatformLeft + 15, stage.rightPlatformBottom, stage.rightPlatformRight + 8 , stage.y_offset - 3.3));
    zoneList.push(new Zone('L Ledge', stage.left_edge - 15, stage.y_offset, stage.left_edge, stage.y_offset - 30));
    zoneList.push(new Zone('R Ledge', stage.right_edge, stage.y_offset, stage.right_edge + 15, stage.y_offset - 30));
    
}

function generateInflectionPoints(){
    let knockdowns = [183, 191];
    // let knockdowns = [191-1];
    // let knockdowns = [354]
    playerList.forEach(p =>{
        // console.log(GAME_FRAMES.players[perspective]);
        for(let i=0; i < lastFrame; i++){
            let aStateId = GAME_FRAMES[i].players[p.index].pre.actionStateId;
                
            if (knockdowns.includes(aStateId)){
                // console.log(GAME_DATA.actioneStates[aStateId].description);
                p.inflectionPointNames.push( GAME_DATA.actioneStates[aStateId].description ); 
                p.inflectionPointFrames.push( i ); 
            }
        }
        p.ipFramesReversed = [...p.inflectionPointFrames];
    });

   console.log(`inflection points loaded`);
}


// just using "slippi conversions" for lack of a better deliminator
function findInflectionPoints(){
    playerList.forEach(p =>{
        GAME_STATS.conversions.forEach((conv, i) =>{
            if(conv.playerIndex == p.index){
                p.inflectionPointNames.push( conv.openingType ); 
                p.inflectionPointFrames.push( conv.startFrame ); 
                p.ipFramesReversed.push( conv.startFrame ); 
            }
        });
        p.ipFramesReversed.reverse();
    });
}

function displayMediaButtons(){
    if (currentFrame < lastFrame){
        document.getElementById('previous-inflection-point-btn').disabled = false;
        document.getElementById('previous-frame-btn').disabled = false;
        document.getElementById('next-inflection-point-btn').disabled = false;
        document.getElementById('next-frame-btn').disabled = false;
    }
    if(currentFrame >= lastFrame){
        document.getElementById('next-inflection-point-btn').disabled = true;
        document.getElementById('next-frame-btn').disabled = true;
    }
    if(currentFrame <= 0){
        document.getElementById('previous-inflection-point-btn').disabled = true;
        document.getElementById('previous-frame-btn').disabled = true;
    }
}

function drawGameScreen(){
    // draw background
    if(!trails){
        cleanSlate();
        stage.drawStage();
    }
    
    drawInflectionPoints();
    drawPlaybackPosition();

    if(zonesVisible > 0)
        drawZones();
    
    // draw grids
    if(debugView)
        drawDebugView();
    // drawMeleeGrid();

    
    // draw players
    playerList.forEach( player => { player.draw(); });
}

function drawZones(){
    let intersect = new Set();

    if(zonesVisible == 2){
        zoneList.forEach(zone =>{ zone.draw('#fff'); })
    } else {
        playerList.forEach(player =>{
            player.zones.forEach(zone =>{
                zone.draw(player.portColor);
            })
        });

        
        for(let z of playerList[0].zones)
            if(playerList[1].zones.has(z))
                intersect.add(z);

        intersect.forEach(zone => { zone.draw('#fff'); });
    }
}

function zonesOccupied(){
    playerList.forEach((player, x) =>{
        player.zones = new Set();
        zoneList.forEach((zone, y) =>{
            if(zone.isInside(player.positionX, player.positionY))
                player.zones.add(zone);
        });
    });
}

function setStage(){
    let selectedStage;

    switch(GAME_SETTINGS.stageId){
        case 32:    // final destination
            selectedStage = GAME_DATA.stages[1];
            break;
        case 28:    // dreamland
            selectedStage = GAME_DATA.stages[2];
            break;
        default:    // 31. bats
            selectedStage = GAME_DATA.stages[0];
            break;
    }
    
    stage = new Stage(selectedStage.name, selectedStage.left_edge, selectedStage.right_edge, selectedStage.x_scaler, selectedStage.y_scaler, selectedStage.x_offset, selectedStage.y_offset, selectedStage.floor_offset);
    stage.setLeftPlatform(selectedStage.leftPlatformLeft, selectedStage.leftPlatformRight, selectedStage.leftPlatformBottom);
    stage.setRightPlatform(selectedStage.rightPlatformLeft, selectedStage.rightPlatformRight, selectedStage.rightPlatformBottom);
    stage.setTopPlatform(selectedStage.topPlatformLeft, selectedStage.topPlatformRight, selectedStage.topPlatformBottom);
}


function updatePlayerPositions(){
    playerList.forEach((player, i, arr) =>{
        if((currentFrame >= 0) && (currentFrame < lastFrame) && GAME_FRAMES[currentFrame]){
            let posX = meleeToCanvasX(GAME_FRAMES[currentFrame].players[i].pre.positionX);
            let posY = meleeToCanvasY(GAME_FRAMES[currentFrame].players[i].pre.positionY);
            let facingDirection = GAME_FRAMES[currentFrame].players[i].pre.facingDirection;
            
            player.setPositionX(posX);
            player.setPositionY(posY);
            player.setCharFacing(facingDirection);

            player.actionStateId = GAME_FRAMES[currentFrame].players[i].pre.actionStateId;
            player.actionStateName = (GAME_DATA.actioneStates[player.actionStateId].description) ? GAME_DATA.actioneStates[player.actionStateId].description : GAME_DATA.actioneStates[player.actionStateId].name;


            player.inputX = GAME_FRAMES[currentFrame].players[i].pre.joystickX;
            player.inputY = GAME_FRAMES[currentFrame].players[i].pre.joystickY;
            player.inputCX = GAME_FRAMES[currentFrame].players[i].pre.cStickX;
            player.inputCY = GAME_FRAMES[currentFrame].players[i].pre.cStickY;

        }
    });
}



// aspect ratio convertors
function meleeToCanvasX(meleeX){ return (CANVAS_WIDTH / 2 + stage.x_offset) + (meleeX * 73/60 * stage.x_scaler); }
function meleeToCanvasY(meleeY){ return ((CANVAS_HEIGHT * stage.floor_offset) + (-meleeY * 73/60 * stage.y_scaler)); }
function canvasToMeleeX(canvasX){ return ((CANVAS_WIDTH/2) - canvasX + stage.x_offset) * -60/73 / stage.x_scaler; }
function canvasToMeleeY(canvasY){ return ((CANVAS_HEIGHT * stage.floor_offset - canvasY) * (60/73 / stage.y_scaler)); }


function drawMeleeGrid(){
    // vertical
    let i = 7;
    while(i < CANVAS_HEIGHT){
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ff0';
        ctx.moveTo(0, meleeToCanvasY(canvasToMeleeY(i)));
        ctx.lineTo(CANVAS_WIDTH, meleeToCanvasY(canvasToMeleeY(i)));
        ctx.stroke();
        ctx.closePath();
        i+= CANVAS_HEIGHT/10;
    }

    // horizontal
    i = 10;
    while(i < CANVAS_WIDTH){
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ff0';
        ctx.moveTo(meleeToCanvasX(canvasToMeleeX(i)), 0);
        ctx.lineTo(meleeToCanvasX(canvasToMeleeX(i)), CANVAS_HEIGHT);
        ctx.stroke();
        ctx.closePath();
        i+= CANVAS_WIDTH/10;
    }
}

async function loadSlpDataFromServer(){

    await fetch(`http://localhost:8080/slippi_stats`)
    .then( res => { return res.json(); })
    .then( stats => { GAME_STATS = stats; });

    await fetch(`http://localhost:8080/slippi_settings`)
    .then( res => { return res.json(); })
    .then( settings => { GAME_SETTINGS = settings });
    
    await fetch(`http://localhost:8080/slippi_frames`)
    .then( res => { return res.json(); })
    .then( frames => { GAME_FRAMES = frames; });
    
    await fetch(`http://localhost:8080/slippi_metadata`)
    .then( res => { return res.json(); })
    .then( metadata => { GAME_METADATA = metadata });
    
}


// toggle graphic buttons
function toggleCharacterBubbles(){
    let btn = document.getElementById("char-bubbles-btn");
    if(characterBubbleVisible == true){
        console.log('Character bubble disabled.')
        characterBubbleVisible = false;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-danger');
    }else{
        console.log('Character bubble enabled.')
        characterBubbleVisible = true;
        btn.classList.add('btn-success');
        btn.classList.remove('btn-danger');
    }

    playerList.forEach(player => {
        player.toggleRubberBand();
        // player.toggleDI();
    });
}

function toggleZoneVisibility(){
    zonesVisible = (zonesVisible+1) %3;
    let btn = document.getElementById("zone-visibility-btn");
    switch(zonesVisible){
        case 0:
            visibility = 'off'
            btn.classList.remove('btn-success');
            btn.classList.remove('btn-warning');
            btn.classList.add('btn-danger');
            break;
        case 1:
            visibility = 'proximity activated'
            btn.classList.remove('btn-success');
            btn.classList.add('btn-warning');
            btn.classList.remove('btn-danger');
            break;
        case 2:
            visibility = 'on'
            btn.classList.add('btn-success');
            btn.classList.remove('btn-warning');
            btn.classList.remove('btn-danger');
            break;
    }
    console.log(`Zones ${visibility}.`)
}


function toggleStageFrame(){
    let btn = document.getElementById("stage-frame-btn");
    if(debugView == true){
        console.log('Stage frame disabled.');
        debugView = false;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-danger');
    }else{
        console.log('Stage frame enabled.');
        debugView = true;
        btn.classList.add('btn-success');
        btn.classList.remove('btn-danger');
    }
}



// media controls
function mediaButtonPressed(action){
    let playBtn = document.getElementById('play-toggle-btn');
    switch(action){
        case 'togglePlay':
            if(currentFrame >= lastFrame){
                currentFrame = 0;
                isPaused = false;
                playBtn.innerHTML = '❚❚';
                str = 'has been restarted to';
            } else if(isPaused){          // play: pressed play while game is paused
                isPaused = false;
                playBtn.innerHTML = '❚❚';
                str = 'is unpaused on';
            } else if(!isPaused){         // pause: pressed play while game is running
                isPaused = true;
                playBtn.innerHTML = '▶️';
                str = 'is paused on';
            } 
            break;
        case 'nextFrame':
            currentFrame++;
            isPaused = true;
            playBtn.innerHTML = '▶️'
            str = 'advancing to';
            break;
        case 'previousFrame':
            currentFrame--;
            isPaused = true;
            playBtn.innerHTML = '▶️'
            str = 'going back to';
            break;
        case 'inflectionAdvance':
            targetFrame = perspective.inflectionPointFrames.find( ip => { return ip > currentFrame; });
            currentFrame = (targetFrame) ? targetFrame : currentFrame;
            isPaused = true;
            playBtn.innerHTML = '▶️'
            str = 'advancing to';
            break;
        case 'inflectionPrevious':
            targetFrame = perspective.ipFramesReversed.find( ip => { return ip < currentFrame; });
            currentFrame = (targetFrame) ? targetFrame : currentFrame;
            isPaused = true;
            playBtn.innerHTML = '▶️'
            str = 'going back to';
            break;
        default:
            break;
    }
    console.log(`Game ${str} frame ${currentFrame}.`);
}


// draw stuff
function drawDot(e, canvas) {
    let c = canvas.getContext('2d');
    let mouseX = e.clientX;
    let mouseY = e.clientY;
    let mouseOffsetX = -10;
    let mouseOffsetY = -10;
    mouseX += mouseOffsetX;
    mouseY += mouseOffsetY;

    console.log(`c: (${mouseX}, ${mouseY})`);
    console.log(`m: (${canvasToMeleeX(mouseX)}, ${canvasToMeleeY(mouseY)})`);
    
    c.fillStyle = "#543548";
    c.fillRect (mouseX, mouseY, 5, 5);
}

function drawBox(){
    ctx.beginPath();
    ctx.rect(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2  + 50 , 150, 100);
    ctx.lineWidth = "6";
    ctx.strokeStyle = "red";
    ctx.stroke();
    ctx.closePath();
}

function drawCircle(x, y, r, fillColor, strokeColor){
    ctx.beginPath();
    ctx.arc(x, y-r, r, 0, 2 * Math.PI);
    ctx.lineWidth = "2";
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
}

function drawInflectionPoints(){
    let inflectionColor = '#fff' 
    perspective.inflectionPointFrames.forEach((ip, i) =>{
        switch(perspective.inflectionPointNames[i]){
            case 'neutral-win':
                inflectionColor = '#00ff00';
                break;
            case 'counter-attack':
                inflectionColor = '#0000ff';
                break;
            default:
                inflectionColor = '#fff000';
                break;
        }
        drawCircle(CANVAS_WIDTH * ip/lastFrame, CANVAS_HEIGHT, 5, inflectionColor, '#fff');
    });
}

function drawPlaybackPosition(){
    // draw playback frame text
    drawCircle(CANVAS_WIDTH * currentFrame/lastFrame, CANVAS_HEIGHT, 5, '#ff0000', '#fff');
    ctx.font = '20px Arial';
    ctx.fillStyle = '#fff';
    let text = `${currentFrame}/${lastFrame}`;
    let screen_offset = currentFrame < lastFrame/25 ? 40 : 0;

    if(perspective.inflectionPointFrames.includes(currentFrame))
        text = `${perspective.inflectionPointNames[perspective.inflectionPointFrames.indexOf(currentFrame)]}`;
    else
        text = `${currentFrame}/${lastFrame}`;
    
    ctx.fillText(text, screen_offset + (CANVAS_WIDTH * currentFrame/lastFrame) - ctx.measureText(text).width/2, CANVAS_HEIGHT - 20);




}

function drawDebugView(){
    let floor = (CANVAS_HEIGHT * stage.floor_offset) + 5;
    let platformDepth = 3;
    let stageDepth = 5;
    
    // draw center point
    drawCircle(CANVAS_WIDTH / 2  + stage.x_offset, floor, 5, '#00ff00', '#fff');
    

    // draw stage lines
    ctx.beginPath();
    ctx.strokeStyle = '#00ff00'
    // stage
    ctx.moveTo(meleeToCanvasX(stage.left_edge), meleeToCanvasY(0 - stageDepth));
    ctx.lineTo(meleeToCanvasX(stage.left_edge), meleeToCanvasY(0 + stageDepth));
    ctx.moveTo(meleeToCanvasX(stage.right_edge), meleeToCanvasY(0 - stageDepth));
    ctx.lineTo(meleeToCanvasX(stage.right_edge), meleeToCanvasY(0 + stageDepth));

    ctx.moveTo(meleeToCanvasX(stage.left_edge), meleeToCanvasY(0));
    ctx.lineTo(meleeToCanvasX(stage.right_edge), meleeToCanvasY(0));


    // left platform
    ctx.moveTo(meleeToCanvasX(stage.leftPlatformLeft), meleeToCanvasY(stage.leftPlatformBottom - platformDepth));
    ctx.lineTo(meleeToCanvasX(stage.leftPlatformLeft), meleeToCanvasY(stage.leftPlatformBottom + platformDepth));
    ctx.moveTo(meleeToCanvasX(stage.leftPlatformRight), meleeToCanvasY(stage.leftPlatformBottom - platformDepth));
    ctx.lineTo(meleeToCanvasX(stage.leftPlatformRight), meleeToCanvasY(stage.leftPlatformBottom + platformDepth));
    
    ctx.moveTo(meleeToCanvasX(stage.leftPlatformLeft), meleeToCanvasY(stage.leftPlatformBottom));
    ctx.lineTo(meleeToCanvasX(stage.leftPlatformRight), meleeToCanvasY(stage.leftPlatformBottom));


    // right platform
    ctx.moveTo(meleeToCanvasX(stage.rightPlatformLeft), meleeToCanvasY(stage.rightPlatformBottom - platformDepth));
    ctx.lineTo(meleeToCanvasX(stage.rightPlatformLeft), meleeToCanvasY(stage.rightPlatformBottom + platformDepth));
    ctx.moveTo(meleeToCanvasX(stage.rightPlatformRight), meleeToCanvasY(stage.rightPlatformBottom - platformDepth));
    ctx.lineTo(meleeToCanvasX(stage.rightPlatformRight), meleeToCanvasY(stage.rightPlatformBottom + platformDepth));

    ctx.moveTo(meleeToCanvasX(stage.rightPlatformLeft), meleeToCanvasY(stage.rightPlatformBottom));
    ctx.lineTo(meleeToCanvasX(stage.rightPlatformRight), meleeToCanvasY(stage.rightPlatformBottom));


    // top platform
    ctx.moveTo(meleeToCanvasX(stage.topPlatformLeft), meleeToCanvasY(stage.topPlatformBottom - platformDepth));
    ctx.lineTo(meleeToCanvasX(stage.topPlatformLeft), meleeToCanvasY(stage.topPlatformBottom + platformDepth));
    ctx.moveTo(meleeToCanvasX(stage.topPlatformRight), meleeToCanvasY(stage.topPlatformBottom - platformDepth));
    ctx.lineTo(meleeToCanvasX(stage.topPlatformRight), meleeToCanvasY(stage.topPlatformBottom + platformDepth));

    ctx.moveTo(meleeToCanvasX(stage.topPlatformLeft), meleeToCanvasY(stage.topPlatformBottom));
    ctx.lineTo(meleeToCanvasX(stage.topPlatformRight), meleeToCanvasY(stage.topPlatformBottom));
    
    ctx.stroke();
    ctx.closePath();
}

function cleanSlate(){
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#808080';
    ctx.lineWidth = 0;
    ctx.strokeStyle = '#000';
    ctx.fill()
    ctx.stroke();
    ctx.closePath();
}

function createCanvas(){
    let canvas = document.querySelector('#game-canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    // canvas.addEventListener('click', event =>{ }, true);
    return canvas.getContext('2d');
}




// utils
function guiNameColors(){
    for(let i=0; i < playerList.length; i++){
        document.getElementById(`p${i+1}-name`).innerHTML = playerList[i].name;
        document.getElementById(`p${i+1}-code`).innerHTML = playerList[i].slipCode;
        document.getElementById(`p${i+1}-name`).style.color = playerList[i].portColor;
        document.getElementById(`p${i+1}-code`).style.color = playerList[i].portColor;
    }
}

function gameOverCheck(){
    if(!gameOver){
        if (currentFrame >= lastFrame){
            currentFrame = lastFrame;
            isPaused = true;
            gameOver = true;
            
            document.getElementById('play-toggle-btn').innerHTML = '▶️';
            console.log('Game Over.');
        }
    }
    
    if(currentFrame <= 0){
        gameOver = false;
        currentFrame = 0;
    }
}

function setPlayers(){
    GAME_SETTINGS.players.forEach((player, i) =>{
        playerList[i] = new Player(i);
        playerList[i].charName = GAME_DATA.characters[player.characterId].shortName;
        playerList[i].charColor = GAME_DATA.characters[player.characterId].colors[player.characterColor];
        playerList[i].port = player.port;
        playerList[i].setPortColor(player.port);
        
        playerList[i].name = GAME_METADATA.players[i].names.netplay;
        playerList[i].slipCode = GAME_METADATA.players[i].names.code;
    });

}
