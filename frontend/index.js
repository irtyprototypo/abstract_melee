const CANVAS_WIDTH = 1208;
const CANVAS_HEIGHT = 680;

let ctx, game_frames, lastFrame, jsonData, stage;
let stageID = 31;
let currentFrame = 0;
let players = [];
let port = 0;
let isPaused = false;
let trails = false;
let stageFrameVisible = false;
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
         *  - other zones
         *  - draw DI
         *  - hud
         *  - items/projectiles
         * 
         */
        

    };

    boot().then(async _=>{
        // do once
        updateStage(stageID);
        center = new Zone('Center', stage.leftPlatformRight, stage.topPlatformBottom, stage.rightPlatformLeft, stage.y_offset);
        stage.drawStage();
        
        guiNameColors();

        requestAnimationFrame(mainLoop);
    });
}


function mainLoop(){
    let frameRate = 16.67;

    if (!isPaused)
        currentFrame++;

    updatePlayerPosition(port);
    updatePlayerPosition(port+1);

    zonesOccupied();
    drawGameScreen();
    mediaButtonsDisplay();
    gameOverCheck();

    setTimeout(_=> { requestAnimationFrame(mainLoop); }, frameRate);
}


function mediaButtonsDisplay(){
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

    // draw zones
    if(zonesVisible > 0 && center.occupiedBy > -1)
        if(center.occupiedBy == 2)
            center.draw('#fff');
        else
            center.draw(players[center.occupiedBy].color);
    else if(zonesVisible === 2)
        center.draw('#fff');
    
    // draw grids
    if(stageFrameVisible)
        drawStageGrid();
    // drawMeleeGrid();

    // draw players
    players[port].draw();
    players[port+1].draw();
}

function zonesOccupied(){
    // center
    let p1InsideCenter = center.isInside(players[port].positionX, players[port].positionY);
    let p2InsideCenter = center.isInside(players[port+1].positionX, players[port+1].positionY);
    if(!p1InsideCenter && !p2InsideCenter)          // empty
        center.occupiedBy = -1;
    else if(p1InsideCenter && p2InsideCenter)       // contested
        center.occupiedBy = port+2;
    else if(p1InsideCenter)                         // player[0]
        center.occupiedBy = port;
    else if(p2InsideCenter)                         // player[1]
        center.occupiedBy = port+1;
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

function updatePlayerPosition(port){
    if((currentFrame >= 0) && (currentFrame < lastFrame) && game_frames[currentFrame]){
        let posX = meleeToCanvasX(game_frames[currentFrame].players[port].post.positionX);
        let posY = meleeToCanvasY(game_frames[currentFrame].players[port].post.positionY);
        let facingDirection = game_frames[currentFrame].players[port].post.facingDirection;
    
        players[port].setPositionX(posX);
        players[port].setPositionY(posY);
        players[port].setCharFacing(facingDirection);
    }
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
            game_frames = data;

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
    if(stageFrameVisible == true){
        console.log('Stage frame disabled.');
        stageFrameVisible = false;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-danger');
    }else{
        console.log('Stage frame enabled.');
        stageFrameVisible = true;
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
            currentFrame += Math.floor(lastFrame/10);
            isPaused = true;
            playBtn.innerHTML = '▶️'
            str = 'advancing to';
            break;
        case 'inflectionPrevious':
            currentFrame -= Math.floor(lastFrame/10);
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

function drawStageGrid(){
    let floor = (CANVAS_HEIGHT * stage.floor_offset) + 5;
    let platformDepth = 3;
    let stageDepth = 5;
    //draw center point
    drawCircle(CANVAS_WIDTH / 2  + stage.x_offset, floor, 5, '#00ff00');
    drawCircle(CANVAS_WIDTH * currentFrame/lastFrame, CANVAS_HEIGHT, 5, '#ff0000');

    
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
    document.getElementById('p1-name').innerHTML = players[0].name;
    document.getElementById('p1-code').innerHTML = players[0].slipCode;
    document.getElementById('p1-name').style.color = players[0].color;
    document.getElementById('p1-code').style.color = players[0].color;

    document.getElementById('p2-name').innerHTML = players[1].name;
    document.getElementById('p2-code').innerHTML = players[1].slipCode;
    document.getElementById('p2-name').style.color = players[1].color;
    document.getElementById('p2-code').style.color = players[1].color;
}

function gameOverCheck(){
    if(!gameOver){
        if (currentFrame >= lastFrame){
            currentFrame = lastFrame;
            isPaused = true;
            gameOver = true;
            
            document.getElementById('play-toggle-btn').innerHTML = '▶️';
            console.log('Game Over');
        }
    }
    
    if(currentFrame <= 0)
        currentFrame = 0;
}

function setPlayers(data){
    console.log(data.players.length);
    for(i=0; i < data.players.length; i++){
        players[i] = new Player(i);
        players[i].charName = jsonData.characters[data.players[i].characterId].shortName;
        players[i].charColor = jsonData.characters[data.players[i].characterId].colors[data.players[i].characterColor];
    }
}

function setNetplayNames(data){
    for(i=0; i < players.length; i++){
        players[i].name = data.players[i].names.netplay;
        players[i].slipCode = data.players[i].names.code;
    }
}
