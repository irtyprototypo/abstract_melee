const CANVAS_WIDTH = 1208;
const CANVAS_HEIGHT = 680;

let GAME_STATS, GAME_FRAMES, GAME_METADATA, GAME_SETTINGS;
let ctx, lastFrame, jsonData, stage, perspective;
let stageID = 31;
let currentFrame = 0;
let playerList = [];
let zoneList = [];
let isPaused = false;
let trails = false;
let debugView = false;
let zonesVisible = 1;
let characterBubbleVisible = true;
let printSippiData = true;
let gameOver = false;

function init(){
    async function boot(){
        //create canvas
        ctx = createCanvas();
        loadDataFromJSON();

        // gather slippi data
        await fetchSlippiSettings();
        await fetchSlippiStats();
        await fetchSlippiFrames();
        await fetchSlippiMetaData();

        /**
         * to do
         *  - upload file button
         *      - req.body...
         *  - options engine
         *  - more zones!
         *  - threat zones
         *  - draw DI
         *  - HUD
         *  - items/projectiles
         * 
         */
        

    };

    // do once
    setTimeout(_=>{

        boot().then(async _=>{
            updateStage(stageID);
            stage.drawStage();
            
            createZones(stage.name);
            perspective = playerList[1];
            findInflectionPoints();

            guiNameColors();

            requestAnimationFrame(mainLoop);
        });
    }, 500);
}


function mainLoop(){
    let frameRate = 16.67;

    if (!isPaused)
        currentFrame++;

    updatePlayerPositions();

    zonesOccupied();
    drawGameScreen();
    displayMediaButtons();
    gameOverCheck();

    setTimeout(_=> { requestAnimationFrame(mainLoop); }, frameRate);
}

function createZones(name){

    zoneList.push(new Zone('Center', stage.leftPlatformRight, stage.topPlatformBottom, stage.rightPlatformLeft, stage.y_offset));
    zoneList.push(new Zone('L Corner', stage.leftPlatformLeft - 8, stage.leftPlatformBottom, stage.leftPlatformRight - 15, stage.y_offset - 3.3));
    zoneList.push(new Zone('R Corner', stage.rightPlatformLeft + 15, stage.rightPlatformBottom, stage.rightPlatformRight + 8 , stage.y_offset - 3.3));
    zoneList.push(new Zone('L Ledge', stage.left_edge - 15, stage.y_offset, stage.left_edge, stage.y_offset - 30));
    zoneList.push(new Zone('R Ledge', stage.right_edge, stage.y_offset, stage.right_edge + 15, stage.y_offset - 30));
    
}

// just using "slippi conversions" for lack of a better deliminator
function findInflectionPoints(){
    GAME_STATS.conversions.forEach((conv, i) =>{
        if(conv.playerIndex == perspective.index){
            perspective.inflectionPoints.push(conv.startFrame); 
            perspective.ipsReversed.push(conv.startFrame); 
        }
    });
    perspective.ipsReversed.reverse();
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

    if(zonesVisible > 0)
        drawZones();
    
    // draw grids
    if(debugView)
        drawDebugView();
    // drawMeleeGrid();

    // draw players
    playerList.forEach( player =>{ player.draw(); });
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

function updateStage(stageID){
    let selectedStage;
    switch(stageID){
        case 32:    // final destination
            selectedStage = jsonData.stages[1];
            break;
        case 28:    // dreamland
            selectedStage = jsonData.stages[2];
            break;
        default:    // 31. bats
            selectedStage = jsonData.stages[0];
            break;
    }
    
    stage = new Stage(selectedStage.name, selectedStage.left_edge, selectedStage.right_edge, selectedStage.x_scaler, selectedStage.y_scaler, selectedStage.x_offset, selectedStage.y_offset, selectedStage.floor_offset);
    stage.setLeftPlatform(selectedStage.leftPlatformLeft, selectedStage.leftPlatformRight, selectedStage.leftPlatformBottom);
    stage.setRightPlatform(selectedStage.rightPlatformLeft, selectedStage.rightPlatformRight, selectedStage.rightPlatformBottom);
    stage.setTopPlatform(selectedStage.topPlatformLeft, selectedStage.topPlatformRight, selectedStage.topPlatformBottom);
}

async function loadDataFromJSON(){
    await fetch(`data.json`)
        .then(res => {
            return res.json();
        })
        .then( data => {
            jsonData = data;
        });
}

function updatePlayerPositions(){
    playerList.forEach((player, i, arr) =>{
        if((currentFrame >= 0) && (currentFrame < lastFrame) && GAME_FRAMES[currentFrame]){
            let posX = meleeToCanvasX(GAME_FRAMES[currentFrame].players[i].post.positionX);
            let posY = meleeToCanvasY(GAME_FRAMES[currentFrame].players[i].post.positionY);
            let facingDirection = GAME_FRAMES[currentFrame].players[i].post.facingDirection;
            
            playerList[i].setPositionX(posX);
            playerList[i].setPositionY(posY);
            playerList[i].setCharFacing(facingDirection);
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


// slippi fetches
async function fetchSlippiStats(){
    await fetch(`http://localhost:8080/slippi_stats`)
        .then(response => {
            return response.json();
        })
        .then( data => {
            GAME_STATS = data;
            if(printSippiData)
                console.log('stats', data);
            return data;
        });
}

async function fetchSlippiMetaData(){
    await fetch(`http://localhost:8080/slippi_metadata`)
        .then(response => {
            return response.json();
        })
        .then( data => {
            if(printSippiData)
                console.log('meta', data);

            setNetplayNames(data);
            lastFrame = data.lastFrame;
            return data;
        });
}

async function fetchSlippiSettings(){
    await fetch(`http://localhost:8080/slippi_settings`)
        .then(response => {
            return response.json();
        })
        .then( data => {
            if(printSippiData)
                console.log('settings', data);
            
            setPlayers(data);
            stageID = data.stageId;
            return data;
        });
}

async function fetchSlippiFrames(num){
    await fetch(`http://localhost:8080/slippi_frames`)
        .then(response => {
            return response.json();
        })
        .then( data => {
            GAME_FRAMES = data;

            if(printSippiData)
                console.log('frame 15:', data[15]);

            return  data;
        });
}

async function upload(form){
    // event.preventDefault();
    
    // let wat = document.getElementById('upload-form').value;
    // console.log(wat);
    // let yo = $(wat.value).serialize();
    // console.log(yo);

    // let wat = document.getElementById('slp_upload').value;
    // console.log(form.slp_upload.value);
    // let wat = form.slp_upload.value;
    // let ser = $(form.slp_upload.value).serialize();
    // console.log(ser);

    // let yo = data.value;
    // yo = $(yo).serialize();
    // console.log(`v: ${yo}`);
    
    // await fetch(`http://localhost:8080/slp_file`, {
    //     method: 'POST',
    //     headers: {'Content-Type':'application/x-www-form-urlencoded'},
    //     body: JSON.stringify({ "user": "wat" })
    // })
    // .then(response => { return response; })
    // .then( data => { return data; });
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
    let arr;
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
            targetFrame = perspective.inflectionPoints.find( ip => { return ip > currentFrame; });
            currentFrame = (targetFrame) ? targetFrame : currentFrame;
            isPaused = true;
            playBtn.innerHTML = '▶️'
            str = 'advancing to';
            break;
        case 'inflectionPrevious':
            targetFrame = perspective.ipsReversed.find( ip => { return ip < currentFrame; });
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

function drawCircle(x, y, r, color){
    ctx.beginPath();
    ctx.arc(x, y-r, r, 0, 2 * Math.PI);
    ctx.lineWidth = "2";
    ctx.strokeStyle = "white";
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
}

function drawDebugView(){
    let floor = (CANVAS_HEIGHT * stage.floor_offset) + 5;
    let platformDepth = 3;
    let stageDepth = 5;

    // draw center point
    drawCircle(CANVAS_WIDTH / 2  + stage.x_offset, floor, 5, '#00ff00');

    // draw playback percentage
    drawCircle(CANVAS_WIDTH * currentFrame/lastFrame, CANVAS_HEIGHT, 5, '#ff0000');

    
    ctx.font = '20px Arial';
    ctx.fillStyle = '#fff';
    let frames = `${currentFrame}/${lastFrame}`;
    let screen_offset = currentFrame < lastFrame/25 ? 40 : 0;
    // let screen_offset = currentFrame < 365 ? 40 : 0;
    ctx.fillText(frames, screen_offset + (CANVAS_WIDTH * currentFrame/lastFrame) - ctx.measureText(frames).width/2, CANVAS_HEIGHT - 20);


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

function setPlayers(data){
    data.players.forEach((player, i) =>{
        playerList[i] = new Player(i);
        playerList[i].charName = jsonData.characters[player.characterId].shortName;
        playerList[i].charColor = jsonData.characters[player.characterId].colors[player.characterColor];
        playerList[i].port = player.port;
        playerList[i].setPortColor(player.port);
    });
}

function setNetplayNames(data){
    for(i=0; i < playerList.length; i++){
        playerList[i].name = data.players[i].names.netplay;
        playerList[i].slipCode = data.players[i].names.code;
    }
}
