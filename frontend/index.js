const CANVAS_WIDTH = 1208;
const CANVAS_HEIGHT = 680;

let ctx;
let game_frames, lastFrame, jsonData, stage;
let stageID = 31;
let frameCount = 0;
let players = [];
let port = 0;
let isPlaying = false;
let isPaused = false;
let trails = false;
let stageFrameVisible = false;
let zonesVisible = 1;
let characterBubbleVisible = true;

function init(){
    async function boot(){
        //create canvas
        ctx = createCanvas();
        loadDataFromJSON();

        // set players
        players[0] = new Player(0);
        players[1] = new Player(1);

        // gather slippi data
        await fetchSlippiSettings();
        await fetchSlippiMetaData();
        await fetchSlippiStats();
        await fetchSlippiFrames();


        /**
         * to do
         *  - media button
         *  - options engine
         *  - other zones
         *  - draw DI
         *  - hud
         *  - items/projectiles
         * 
         */
        

    };

    boot().then(_=>{
        
        // do once
        updateStage(stageID);
        center = new Zone('Center', stage.leftPlatformRight, stage.topPlatformBottom, stage.rightPlatformLeft, stage.y_offset);
        stage.drawStage();
        
        guiColorNames();

        requestAnimationFrame(mainLoop);

    });
}

function guiColorNames(){
    document.getElementById('p1-name').innerHTML = players[0].name;
    document.getElementById('p1-code').innerHTML = players[0].slipCode;
    document.getElementById('p1-name').style.color = players[0].color;
    document.getElementById('p1-code').style.color = players[0].color;

    document.getElementById('p2-name').innerHTML = players[1].name;
    document.getElementById('p2-code').innerHTML = players[1].slipCode;
    document.getElementById('p2-name').style.color = players[1].color;
    document.getElementById('p2-code').style.color = players[1].color;
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
    try{
        let posX = meleeToCanvasX(game_frames[frameCount].players[port].post.positionX);
        let posY = meleeToCanvasY(game_frames[frameCount].players[port].post.positionY);
        let facingDirection = game_frames[frameCount].players[port].post.facingDirection;

        players[port].setPositionX(posX);
        players[port].setPositionY(posY);
        players[port].setCharFacing(facingDirection);

    } catch(e){
        if(frameCount > (lastFrame)){
            isPaused = true;
            console.log(`Frame ${frameCount}/${lastFrame} unavailable.`);
            console.log('Game Over');
        }
    }
}

function meleeToCanvasX(meleeX){
    return (CANVAS_WIDTH / 2 + stage.x_offset) + (meleeX * 73/60 * stage.x_scaler);
}

function meleeToCanvasY(meleeY){
    return ((CANVAS_HEIGHT * stage.floor_offset) + (-meleeY * 73/60 * stage.y_scaler));
}

function canvasToMeleeX(canvasX){
    return ((CANVAS_WIDTH/2) - canvasX + stage.x_offset) * -60/73 / stage.x_scaler;
}

function canvasToMeleeY(canvasY){
    return ((CANVAS_HEIGHT * stage.floor_offset - canvasY) * (60/73 / stage.y_scaler));
}


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

async function fetchSlippiStats(){
    await fetch(`http://localhost:8080/slippi_stats`)
        .then(response => {
            return response.json();
        })
        .then( data => {
            // console.log(data);
            return data;
        });
}

async function fetchSlippiMetaData(){
    await fetch(`http://localhost:8080/slippi_metadata`)
        .then(response => {
            return response.json();
        })
        .then( data => {
            lastFrame = data.lastFrame;
            
            players[0].name = data.players[0].names.netplay;
            players[0].slipCode = data.players[0].names.code;

            try{
                players[1].name = data.players[1].names.netplay;
                players[1].slipCode = data.players[1].names.code;
            } catch(e){
                players[1].name = 'nerd1';
                players[1].slipCode = '#6969';
            }
        
            return data;
        });
}

async function fetchSlippiSettings(){
    await fetch(`http://localhost:8080/slippi_settings`)
        .then(response => {
            return response.json();
        })
        .then( data => {
            // console.log(data);
            stageID = data.stageId;

            players[0].charName = jsonData.characters[data.players[0].characterId].shortName;
            players[0].charColor = jsonData.characters[data.players[0].characterId].colors[data.players[0].characterColor];

            players[1].charName = jsonData.characters[data.players[1].characterId].shortName;
            players[1].charColor = jsonData.characters[data.players[1].characterId].colors[data.players[1].characterColor];

            return data;
        });
}


async function fetchSlippiFrames(num){
    num = 0 ? !num : num = num;
    await fetch(`http://localhost:8080/slippi_frames/${num}`)
        .then(response => {
            return response.json();
        })
        .then( data => {
            updatePlayerPosition(port);
            updatePlayerPosition(port+1);
            game_frames = data;
            return  data;
        });
}

function draw(){
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


function drawStageGrid(){
    let floor = (CANVAS_HEIGHT * stage.floor_offset) + 5;
    let platformDepth = 3;
    let stageDepth = 5;
    //draw center point
    drawCircle(CANVAS_WIDTH / 2  + stage.x_offset, floor, 5, '#00ff00');
    
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


function mainLoop(){
    let frameRate = 16.67;
    // let frameRate = 0;
    if (!isPlaying && !isPaused){
        isPlaying = true;
        updatePlayerPosition(port);
        updatePlayerPosition(port+1);

        
        zonesOccupied();
        draw();
        frameCount++;
    
        setTimeout(_=> {
            requestAnimationFrame(mainLoop);
            isPlaying = false;
        }, frameRate);
    }
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


function createCanvas(){
    let canvas = document.querySelector('#game-canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    // canvas.addEventListener('click', event =>{
    //     // mediaControls();
    //     drawDot(event, canvas);
    // }, true);
    
    return canvas.getContext('2d');
}

function mediaControls(){
    let btn = document.getElementById('play-toggle-btn');
    // restart
    if(frameCount >= lastFrame)
        frameCount = 0;
    // play
    if(isPaused){
        isPaused = false;
        btn.innerHTML = '❚❚';
        requestAnimationFrame(mainLoop);
        console.log('Game is unpaused.');
    }
    // pause
    else{
        isPaused = true;
        btn.innerHTML = '▶️';
        console.log(`Game is paused on frame ${frameCount}.`);
    }
}

function togglePlay(){
    mediaControls()
}

function frameAdvance(){
    // mediaControls()
}

function inflectionAdvance(){
    // mediaControls()
}

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



class Player{
    constructor(port){
        this.port = port;
        this.charFacingDirection = 1;
        this.charName = 'SandBag';
        this.charColor = 'Default';
        this.charImg = new Image();
        this.charImg.src = `resources/heads_${this.charFacingDirection}/${this.charName}_${this.charColor}.png`;
        this.positionX = 0;
        this.positionY = 0;
        this.color = this.colorFromPort(this.port);
        this.name;
        this.code;
    }

    setPositionX(pos){ this.positionX = pos; }
    setPositionY(pos){ this.positionY = pos; }

    getPositionX(){ return this.positionX; }
    getPositionY(){ return this.positionY; }

    draw(){
        let radius = 30;
        if(characterBubbleVisible)
            drawCircle(this.positionX, this.positionY, radius, this.color);
        ctx.drawImage(this.charImg, this.positionX - 12, this.positionY - 43);
    }

    setCharFacing(dir){
        this.charFacingDirection = dir;
        this.charImg = new Image();
        this.charImg.src = `resources/heads_${this.charFacingDirection}/${this.charName}_${this.charColor}.png`;
    }



    colorFromPort(port){
        switch(port){
            case 0:
                return '#ff392e';
            case 1:
                return '#3370d4';
            case 2:
                return '#00ff00';
            case 3:
                return '#ffff00';
            default:
                return '#ffffff';
        }
    }
}

class Zone{
    constructor(name, left, top, right, bottom){
        this.name = name;
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.overLay = this.draw();
        this.occupiedBy = -1;
        this.width = -(meleeToCanvasX(this.left) - meleeToCanvasX(this.right));
        this.height = meleeToCanvasX(this.top - 5) - meleeToCanvasX(this.bottom);
    }

    draw(color){
        ctx.beginPath();
        ctx.rect(meleeToCanvasX(this.left), meleeToCanvasY(this.top - 6), this.width, this.height);
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.fillStyle = 'rgba(0, 255, 0, .25)';
        ctx.fill();
        ctx.font = "30px Arial";
        ctx.stroke();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillText(this.name, meleeToCanvasX(this.left) + this.width/4, meleeToCanvasY(this.top) + 50);
        ctx.stroke();
        ctx.closePath();
    }

    isInside(x, y){
        if(canvasToMeleeX(x) <= this.right && canvasToMeleeX(x) >= this.left) 
            if(canvasToMeleeY(y) <= this.top - stage.y_offset && canvasToMeleeY(y) >= this.bottom - stage.y_offset)
                return true;
    }

}




class Stage{
    constructor(name, left_edge, right_edge, x_scaler, y_scaler, x_offset, y_offset, floor_offset){
        this.name = name;
        this.img = new Image();
        this.img.id = 'background_image';
        this.img.src = `/resources/screenshots/${name}/stage.png`;
        this.left_edge = left_edge;
        this.right_edge = right_edge;
        this.x_scaler = x_scaler;
        this.y_scaler = y_scaler;
        this.x_offset = x_offset;
        this.y_offset = y_offset;
        this.floor_offset = floor_offset;

    }


    setLeftPlatform(left, right, bottom){
        this.leftPlatformLeft = left;
        this.leftPlatformRight = right;
        this.leftPlatformBottom = bottom;
    }

    setRightPlatform(left, right, bottom){
        this.rightPlatformLeft = left;
        this.rightPlatformRight = right;
        this.rightPlatformBottom = bottom;
    }
    setTopPlatform(left, right, bottom){
        this.topPlatformLeft = left;
        this.topPlatformRight = right;
        this.topPlatformBottom = bottom;
    }

    drawStage(){
        ctx.drawImage(this.img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
}