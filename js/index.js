const WINDOW_SCALER = .8;
const CANVAS_WIDTH = 1208 * WINDOW_SCALER;
const CANVAS_HEIGHT = 680 * WINDOW_SCALER;

let GAME_STATS, GAME_FRAMES, GAME_METADATA, GAME_SETTINGS, GAME_DATA, CHARACTERS;
let ctx, lastFrame, stage, perspective, notPerspective, phase;
let currentFrame = 0;
let playerList = [];
let zoneList = [];
let desiredInflectionPoints = [];
let isPaused = true;
let trails = false;
let debugView = false;
let zonesVisible = 1;
let bandsVisible = 1;
let gameOver = false;


/**
 * todo
 * - map action-states to model-states
 *     - incomplete
 *     - specify inflection point
 *         - incomplete
 * - options engine
 *     - display tactic / manuever
 * - more zones?
 *     - air camping?
 *     - edge cancel setups?
 * - threat zones
 *     - keep the roll string taught
 * - draw DI
 * - in game HUD
 *     - needs timer
 * - better UX
 *     - say it again for the ones with glasses
 *     - animations go without saying lmao
 *     - keyboard controls
 * - lexicon
 * - action state special move quirk
**/

function init(){
    GAME_FRAMES = slp_replay.data.frames;
    GAME_METADATA = slp_replay.data.metadata;
    GAME_SETTINGS = slp_replay.data.settings;
    GAME_STATS = slp_replay.data.stats;
    GAME_DATA = game_data.data;

    console.log(GAME_FRAMES[215]);
    // console.log(GAME_METADATA);
    // console.log(GAME_SETTINGS);
    // console.log(GAME_STATS);
    // console.log(GAME_DATA);

    ctx = createCanvas();

    setPlayers();
    setPerspective(0);
    guiNameColors();

    setStage();
    stage.draw();

    lastFrame = GAME_METADATA.lastFrame;

    createZones(stage.name);
    // generateInflectionPoints('grabs rolls');
    specifyInflectionPoint();



    requestAnimationFrame(mainLoop);
}


function mainLoop(){
    // let frameRate = 16.67 * 2;
    let frameRate = 16.67;
    
    if(!isPaused)  currentFrame++;

        
    updatePlayerPositions();
    // console.log(perspective.getRubberBandStress()); 


    zonesOccupied();
    if(perspective.inflectionPoints.includes(currentFrame)){
        document.getElementById('play-toggle-btn').innerHTML = '▶️';
        isPaused = true;
    }
    

    determinePhase();
    determineState();
    
    drawGameScreen();
    displayMediaButtons();
    gameOverCheck();

    setTimeout(_=> { requestAnimationFrame(mainLoop); }, frameRate);
}

function generateOptions(){

    // what is an option a function of?
    // option(perspective_position, opponent_position, history, percetns, etc...)

}


function determinePhase(){

    $(` #state_an_g,
        #state_dn_g,
        #state_opening_g,
        #state_knockback_g,
        #state_kill_g,
        #state_death_g
        `).children(0).attr('fill', '#fff');

    // temp meter of rubberband distance
    if (perspective.distanceFromCenter < notPerspective.distanceFromCenter){
        perspective.phase = 'Advantageous Neutral';
        $("#state_an_g").children(0).attr('fill', `${perspective.portColor}`);
        
        notPerspective.phase = 'Disadvantageous Neutral';
        $("#state_dn_g").children(0).attr('fill', `${notPerspective.portColor}`);
    }
    if(perspective.distanceFromCenter > notPerspective.distanceFromCenter){
        perspective.phase = 'Disadvantageous Neutral';
        $("#state_dn_g").children(0).attr('fill', `${perspective.portColor}`);
        
        notPerspective.phase = 'Advantageous Neutral';
        $("#state_an_g").children(0).attr('fill', `${notPerspective.portColor}`);
    }

    
    if(perspective.actionStateName.toLowerCase().includes('damage', 'grab')){
        perspective.phase = 'Knockback';
        // $("#state_knockback_g").children(0).attr('fill', `${perspective.portColor}`);
                
        notPerspective.phase = 'Opening';
        // $("#state_opening_g").children(0).attr('fill', `${notPerspective.portColor}`);
        
        $("#state_an_g, #state_dn_g").children(0).attr('fill', '#fff');
    }
    if(notPerspective.actionStateName.toLowerCase().includes('damage', 'grab')){
        perspective.phase = 'Opening';
        // $("#state_opening_g").children(0).attr('fill', `${perspective.portColor}`);
        
        notPerspective.phase = 'Knockback';
        // $("#state_knockback_g").children(0).attr('fill', `${notPerspective.portColor}`);
        
        $("#state_an_g, #state_dn_g").children(0).attr('fill', '#fff');
    }

    if(perspective.actionStateName.toLowerCase().includes('death')){
        perspective.phase = 'Death';
        $("#state_death_g").children(0).attr('fill', `${perspective.portColor}`);
        
        notPerspective.phase = 'Kill';
        $("#state_kill_g").children(0).attr('fill', `${notPerspective.portColor}`);
        
        $("#state_an_g, #state_dn_g").children(0).attr('fill', '#fff');
    }
    if(notPerspective.actionStateName.toLowerCase().includes('death')){
        perspective.phase = 'Kill';
        $("#state_kill_g").children(0).attr('fill', `${perspective.portColor}`);
        
        notPerspective.phase = 'Death';
        $("#state_death_g").children(0).attr('fill', `${notPerspective.portColor}`);
        
        $("#state_an_g, #state_dn_g").children(0).attr('fill', '#fff');
    }
}


function determineState(){
    perspective.state = 'default';
    notPerspective.state = 'default';

    $(` #state_recovery_g,
        #state_edge_guard_g,
        #state_knock_down_g,
        #state_tech_chase_g,
        #state_di_g,
        #state_combo_g`)
    .children(0).attr('fill', '#fff');


    if(canvasToMeleeY(perspective.positionY) < 0  || Math.abs(canvasToMeleeX(perspective.positionX)) > stage.right_edge){
        perspective.state = 'Recovery';
        $("#state_recovery_g").children(0).attr('fill', `${perspective.portColor}`);

        notPerspective.state = 'Edge Guard';
        $("#state_edge_guard_g").children(0).attr('fill', `${notPerspective.portColor}`);
    }
    if(canvasToMeleeY(notPerspective.positionY) < 0  || Math.abs(canvasToMeleeX(notPerspective.positionX)) > stage.right_edge){
        perspective.state = 'Edge Guard';
        $("#state_edge_guard_g").children(0).attr('fill', `${perspective.portColor}`);

        notPerspective.state = 'Recovery';
        $("#state_recovery_g").children(0).attr('fill', `${notPerspective.portColor}`);
    }

    if(perspective.actionStateName.toLowerCase().includes('tech')){
        perspective.state = 'Knock Down';
        $("#state_knock_down_g").children(0).attr('fill', `${perspective.portColor}`);
        
        notPerspective.state = 'Tech Chase';
        $("#state_tech_chase_g").children(0).attr('fill', `${notPerspective.portColor}`);
    }
    if(notPerspective.actionStateName.toLowerCase().includes('tech')){
        perspective.state = 'Tech Chase';
        $("#state_tech_chase_g").children(0).attr('fill', `${perspective.portColor}`);
        
        notPerspective.state = 'Knock Down';
        $("#state_knock_down_g").children(0).attr('fill', `${notPerspective.portColor}`);
    }

    
    if(perspective.actionStateName.toLowerCase().includes('damage')){
        perspective.state = 'DI';
        $("#state_di_g").children(0).attr('fill', `${perspective.portColor}`);

        notPerspective.state = 'Combo';
        $("#state_combo_g").children(0).attr('fill', `${notPerspective.portColor}`);

    }
    if(notPerspective.actionStateName.toLowerCase().includes('damage')){
        perspective.state = 'Combo';
        $("#state_combo_g").children(0).attr('fill', `${perspective.portColor}`);

        notPerspective.state = 'DI';
        $("#state_di_g").children(0).attr('fill', `${notPerspective.portColor}`);
    }

    

    // sharking
    // stagger
    // SDI


}


function setPerspective(playerIndex){
    playerList.forEach(p =>{
        if (p.index === playerIndex){
            perspective = p;
            p.activePerspective = true;
            document.getElementById(`p${p.port}-text-container`).style.border = '2px solid #00ff00';
        } else{
            notPerspective = p;
            p.activePerspective = false;
            document.getElementById(`p${p.port}-text-container`).style.border = 'none';
        }
    });
    console.log(`Perspective set to ${perspective.name}.`);
}


function createZones(name){
    let edgeZoneHeight = 30;
    let edgeZoneWidth = 15;
    let lmaodudwtfareyoudoing = 3.3;
    let eyeballedStageWidth = 170;
    // Zone(name, left, top, right, bottom)


    zoneList.push(new Zone('Center', stage.leftPlatformRight, stage.topPlatformBottom, stage.rightPlatformLeft, stage.y_offset));
    
    zoneList.push(new Zone('T Plat', stage.topPlatformLeft,
                                    stage.topPlatformBottom + (stage.topPlatformBottom - stage.leftPlatformBottom),
                                    stage.topPlatformRight,
                                    stage.topPlatformBottom + stage.y_offset - lmaodudwtfareyoudoing));

    // --- right ----
        zoneList.push(new Zone('Corner', stage.rightPlatformLeft + (Math.floor(Math.abs(stage.rightPlatformLeft - stage.rightPlatformRight)/2)),
                                        stage.rightPlatformBottom,
                                        stage.rightPlatformRight + (Math.abs(stage.rightPlatformRight - stage.right_edge)),
                                        stage.y_offset - lmaodudwtfareyoudoing));
        
        zoneList.push(new Zone('Ledge', stage.right_edge, stage.y_offset, stage.right_edge + edgeZoneWidth, stage.y_offset - edgeZoneHeight));
        
        zoneList.push(new Zone('Plat', stage.rightPlatformLeft,
                                        stage.topPlatformBottom + stage.y_offset,
                                        stage.rightPlatformRight,
                                        stage.rightPlatformBottom + stage.y_offset - lmaodudwtfareyoudoing));

        // Read Zone. idk lol give me a better name
        zoneList.push(new Zone('RZ', stage.rightPlatformLeft,
                                        stage.leftPlatformBottom,
                                        stage.rightPlatformLeft + (Math.floor(Math.abs(stage.rightPlatformLeft - stage.rightPlatformRight)/2)),
                                        stage.y_offset - lmaodudwtfareyoudoing));
        // mango said it
        zoneList.push(new Zone('HBox', stage.rightPlatformRight,
                                        stage.topPlatformBottom + stage.y_offset,
                                        stage.rightPlatformRight + Math.abs(stage.rightPlatformRight - stage.rightPlatformLeft),
                                        stage.leftPlatformBottom + stage.y_offset - lmaodudwtfareyoudoing));
        
        zoneList.push(new Zone('Below', stage.right_edge,
                                        stage.floor_offset,
                                        eyeballedStageWidth,
                                        -100));
                                        // stage.floor_offset));

                                    

    
    // --- left ---
        zoneList.push(new Zone('Corner', stage.leftPlatformLeft - (Math.abs(stage.leftPlatformLeft - stage.left_edge)),
                                        stage.leftPlatformBottom,
                                        stage.leftPlatformRight - (Math.floor(Math.abs(stage.leftPlatformRight - stage.leftPlatformLeft)/2)),
                                        stage.y_offset - lmaodudwtfareyoudoing));
        
        zoneList.push(new Zone('Ledge', stage.left_edge - edgeZoneWidth, stage.y_offset, stage.left_edge, stage.y_offset - edgeZoneHeight));
        
        zoneList.push(new Zone('Plat', stage.leftPlatformLeft,
                                        stage.topPlatformBottom + stage.y_offset,
                                        stage.leftPlatformRight,
                                        stage.leftPlatformBottom + stage.y_offset - lmaodudwtfareyoudoing));
                                        
        // Read Zone. idk lol give me a better name
        zoneList.push(new Zone('RZ', stage.leftPlatformRight - (Math.floor(Math.abs(stage.leftPlatformRight - stage.leftPlatformLeft)/2)),
                                        stage.leftPlatformBottom,
                                        stage.leftPlatformRight,
                                        stage.y_offset - lmaodudwtfareyoudoing));

        // mango said it
        zoneList.push(new Zone('HBox', stage.leftPlatformLeft - Math.abs(stage.leftPlatformLeft - stage.leftPlatformRight),
                                        stage.topPlatformBottom + stage.y_offset,
                                        stage.leftPlatformLeft,
                                        stage.leftPlatformBottom + stage.y_offset - lmaodudwtfareyoudoing));
                                        
        zoneList.push(new Zone('Below', -eyeballedStageWidth,
                                        stage.floor_offset,
                                        stage.left_edge,
                                        -100));
                                        // stage.floor_offset));
                                    
}

function generateInflectionPoints(options){
    let lookingFor = [];
    let knockdowns = [183, 191];
    let techOptions = [199, 200, 201, 202, 203, 204];
    let grabs = [213, 226];
    let shield = [179, 180, 181, 182];
    let rolls = [233, 234];
    // catching double jump
    // the rest of the model states
    

    if(options.includes('knockdown'))  lookingFor = lookingFor.concat(knockdowns);
    if(options.includes('techchase'))  lookingFor = lookingFor.concat(techOptions);
    if(options.includes('grab'))        lookingFor = lookingFor.concat(grabs);
    if(options.includes('shield'))      lookingFor = lookingFor.concat(shield);
    if(options.includes('roll'))        lookingFor = lookingFor.concat(rolls);
    if(options.length == 0) lookingFor = [];

    for(let i=0; i < lastFrame; i++){
        let prevAStateId = GAME_FRAMES[i-1].players[perspective.index].pre.actionStateId;
        let aStateId = GAME_FRAMES[i].players[perspective.index].pre.actionStateId;
        // let nextAStateId = GAME_FRAMES[i+1].players[perspective.index].pre.actionStateId;
            
        if (lookingFor.includes(aStateId) && !lookingFor.includes(prevAStateId) )
            perspective.inflectionPoints.push(i)
        
    }
    if(lookingFor.length == 0)  perspective.inflectionPoints = [];
    
    perspective.inflectionPointsReversed = perspective.inflectionPoints.slice().reverse();
    
   console.log(`Inflection points loaded: ${options}`);
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


function specifyInflectionPoint(){

    $("ellipse, rect").on('click', e =>{
        let id = e.target.parentElement.id;
        // console.log(e.target.parentElement.parentElement.id);

        if(id.includes("phase"))    return;

        e.target.attributes.stroke.value = (e.target.attributes.stroke.value != '#bfff00' ) ? '#bfff00' : '#000';
        e.target.attributes["stroke-width"] = (e.target.attributes["stroke-width"] != '3' ) ? '3' : '1';
       
        
        let token = id.split("_");
        let state = token[1]
        if(token[2] != 'g') state = `${state}${token[2]}`

        if(!desiredInflectionPoints.includes(state))
            desiredInflectionPoints.push(state);
        else
            desiredInflectionPoints.pop(state);

        generateInflectionPoints(desiredInflectionPoints);
    });

}

function drawGameScreen(){
    // draw background
    if(!trails){
        cleanSlate();
        stage.draw();
    }
    
    drawHUD();
    drawInflectionPoints();
    drawPlaybackPosition();

    if(zonesVisible > 0)    drawZones();
    if(debugView)           drawDebugView();
    // if(debugView)   drawMeleeGrid();

    
    // draw players
    playerList.forEach( player => { player.draw(WINDOW_SCALER); });

    drawProjectiles();
}


function drawProjectiles(){
    if(!GAME_FRAMES[currentFrame].items)
        return;
    
    GAME_FRAMES[currentFrame].items.forEach(item =>{
        // console.log(`${playerList[item.owner].name} threw an item with state ${item.state} on frame ${currentFrame}.`);
        // console.log(item.owner, item.state, item.typeId, currentFrame);
        drawCircle(meleeToCanvasX(item.positionX), meleeToCanvasY(item.positionY), 3, playerList[item.owner].portColor, '#fff');
    });
}


function drawHUD(){
    let p1Percent = Math.round(GAME_FRAMES[currentFrame].players[0].pre.percent);
    let p2Percent = Math.round(GAME_FRAMES[currentFrame].players[1].pre.percent);


    ctx.font = "45px Arial";
    
    ctx.strokeStyle = playerList[0].portColor;
    ctx.strokeText(`${p1Percent}%`, CANVAS_WIDTH * .31, CANVAS_HEIGHT * .92);
    
    ctx.strokeStyle = playerList[1].portColor;
    ctx.strokeText(`${p2Percent}%`, CANVAS_WIDTH * .64, CANVAS_HEIGHT * .92);
    
    
    
    
    
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.fillText(`${playerList[0].actionStateName}`, (CANVAS_WIDTH * .31) - ctx.measureText(playerList[0].actionStateName).width * .35, CANVAS_HEIGHT * .84);
    ctx.fillText(`${playerList[1].actionStateName}`, (CANVAS_WIDTH * .64) - ctx.measureText(playerList[1].actionStateName).width * .35, CANVAS_HEIGHT * .84);
    // ctx.stroke();
    // ctx.closePath();
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
            if(zone.name == 'Below')
                if(zone.isBelow(player.positionX, player.positionY))
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
    
    stage = new Stage(selectedStage.name, selectedStage.left_edge, selectedStage.right_edge, selectedStage.x_scaler, selectedStage.y_scaler, selectedStage.x_offset, selectedStage.y_offset, selectedStage.floor_offset, WINDOW_SCALER);
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
function toggleRubberBand(){
    let btn = document.getElementById("char-band-btn");
    if(bandsVisible == true){
        console.log('Character rubber bands disabled.')
        bandsVisible = false;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-danger');
    }else{
        console.log('Character rubber bands enabled.')
        bandsVisible = true;
        btn.classList.add('btn-success');
        btn.classList.remove('btn-danger');
    }
    playerList.forEach(player => { player.toggleRubberBand(); });
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
            // try{ targetFrame = perspective.inflectionPoints.find( ip => { return ip.frame > currentFrame}).frame; }
            try{ targetFrame = perspective.inflectionPoints.find( ip => { return ip > currentFrame});
            console.log(targetFrame);
        }
            catch(e){targetFrame = lastFrame}
            currentFrame = (targetFrame) ? targetFrame : currentFrame;
            isPaused = true;
            playBtn.innerHTML = '▶️'
            str = 'advancing to';
            break;
        case 'inflectionPrevious':
            // try{ targetFrame = perspective.inflectionPointsReversed.find( ip => { return ip.frame < currentFrame}).frame; }
            try{ targetFrame = perspective.inflectionPointsReversed.find( ip => { return ip < currentFrame}); }
            catch(e){targetFrame = 0}
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
    let inflectionColor = '#0000ff';
    perspective.inflectionPoints.forEach( ip =>{
        let asID = GAME_FRAMES[ip].players[perspective.index].pre.actionStateId;
        let asName = GAME_DATA.actioneStates[asID].description;
        // console.log(GAME_DATA.actioneStates[ip]);

        if(asName.includes('grab'))  inflectionColor = '#00ff00';
        if(asName.includes('roll'))  inflectionColor = '#fff000';
        if(asName.includes('grabbed'))  inflectionColor = '#ff0000';
        if(asName.includes('Missed tech'))  inflectionColor = '#ff0000';

        drawCircle(CANVAS_WIDTH * ip/lastFrame, CANVAS_HEIGHT, 5, inflectionColor, '#fff');
    });
}

function drawPlaybackPosition(){
    // draw playback frame text

    drawCircle(CANVAS_WIDTH * currentFrame/lastFrame, CANVAS_HEIGHT, 5, 'rgba(0,0,0,0)', '#fff');
    ctx.font = '20px Arial';
    let screen_offset = currentFrame < lastFrame/25 ? 40 : 0;
    let text = `${currentFrame}/${lastFrame}`;

    // change text for inflection point
    let currentIP = perspective.inflectionPoints.filter( ip => { if (ip == currentFrame) return ip.name; });
    if(currentIP[0])
        text = `${currentIP[0].name}`;
    else
        text = `${currentFrame}/${lastFrame}`;
    
    let textX = screen_offset + (CANVAS_WIDTH * currentFrame/lastFrame) - ctx.measureText(text).width/2;
    let textY = CANVAS_HEIGHT - 20;
    
    ctx.strokeStyle = "#000";
    ctx.strokeText(text, textX, textY);
    
    ctx.fillStyle = '#fff';
    ctx.fillText(text, textX, textY);
    ctx.closePath();
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
    // ctx.fillStyle = '#808080';
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
