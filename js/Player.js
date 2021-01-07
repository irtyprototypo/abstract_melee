
class Player{
    constructor(index){
        this.port;
        this.index = index;
        this.charFacingDirection = 1;
        this.charName = 'SandBag';
        this.charColor = 'Default';
        this.charImg = new Image();
        this.charImg.src = `img/heads_${this.charFacingDirection}/${this.charName}_${this.charColor}.png`;
        this.positionX;
        this.positionY;
        this.portColor = this.colorFromPort(this.port);
        this.name = '';
        this.code = '';
        this.zones = new Set();
        this.inflectionPointNames = [];
        this.inflectionPointFrames = [];
        this.ipFramesReversed = [];
        this.activePerspective;
        this.actionStateId;
        this.actionStateName;
        this.inputX;
        this.inputY;
        this.inputCX;
        this.inputCY;
        this.rubberBandVisible = true;
        this.diVisible = false;
        this.bodySize;         // radius
        
    }

    setPositionX(pos){ this.positionX = pos; }
    setPositionY(pos){ this.positionY = pos; }

    getPositionX(){ return this.positionX; }
    getPositionY(){ return this.positionY; }

    draw(window_scaler){
        this.bodySize = 36 * window_scaler;


        // draw rubber band
        if(this.rubberBandVisible)
            this.drawRubberBand();

        
        // draw Left and c stick
        if(this.diVisible){
            this.drawAnologStick(80, '#d3d3d3', 'main');
            this.drawAnologStick(40, '#ff0', 'c');
        }

        // draw character bubble
        this.drawCharacter();

        //draw character head
        let charHeadOffset = this.determineHeadOffset(this.charName);
        ctx.drawImage(this.charImg, this.positionX - charHeadOffset, this.positionY - this.bodySize - 23);
        
        //display action state text
        ctx.font = '20px Arial';
        ctx.fillText(this.actionStateName, this.positionX - ctx.measureText(this.actionStateName).width/2, this.positionY - 70);
        ctx.stroke();
        ctx.closePath();


    }

    drawRubberBand(){

        let distanceFromCenter = Math.sqrt(Math.floor(canvasToMeleeX(this.positionX) ** 2 + canvasToMeleeY(this.positionY) ** 2));
        if(distanceFromCenter > 160)
            return;

        ctx.beginPath();
        let stressFactor = distanceFromCenter * 2;
        ctx.setLineDash([distanceFromCenter/3, distanceFromCenter/3]);/*dashes are 5px and spaces are 3px*/
        // ctx.setLineDash([5, 15]);/*dashes are 5px and spaces are 3px*/
        ctx.strokeStyle = `rgb(${Math.floor(0 + stressFactor)}, ${Math.floor(255 - stressFactor)}, 0)`;
        ctx.lineWidth = 3;
        ctx.moveTo(meleeToCanvasX(0), meleeToCanvasY(0));
        ctx.lineTo(this.positionX, this.positionY - this.bodySize * 2/3);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.closePath();
    }


    drawCharacter(){
        let stroke = (this.activePerspective) ?  '#00ff00' : '#fff';
        // ctx.lineWidth = 10;
        ctx.strokeStyle = stroke;
        // ctx.stroke();
        ctx.lineWidth = 3;
        let armLength = this.bodySize - 16;
        let neckX = this.positionX;
        let neckY = this.positionY-this.bodySize;
        let torsoLength = this.bodySize/2;
        let groinX = neckX;
        let groinY = this.positionY-torsoLength;
        ctx.beginPath();

        switch(this.actionStateId){
            case 69:    // dair
                // arms
                ctx.moveTo(neckX, neckY);
                ctx.lineTo(neckX-armLength/3, this.positionY-this.bodySize+15);
                ctx.moveTo(neckX, neckY);
                ctx.lineTo(neckX+armLength/3, this.positionY-this.bodySize+15);
                // legs
                ctx.moveTo(groinX, groinY);
                ctx.lineTo(neckX-this.bodySize/12, this.positionY);
                ctx.moveTo(groinX, groinY);
                ctx.lineTo(neckX+this.bodySize/12, this.positionY);
                // torso
                ctx.moveTo(neckX, neckY);
                ctx.lineTo(neckX, groinY);
                break;
            case 360:       // shine
            case 361:
            case 362:
            case 363:
            case 364:
            case 365:
            case 366:
            case 367:
            case 368:
            case 369:
                if(this.charName == 'Falco' || this.charName == 'Fox'){
                    console.log('shine');
                    // arms
                    ctx.moveTo(this.positionX, this.positionY-this.bodySize);
                    ctx.lineTo(this.positionX-armLength, this.positionY-this.bodySize);
                    ctx.moveTo(this.positionX, this.positionY-this.bodySize);
                    ctx.lineTo(this.positionX+armLength, this.positionY-this.bodySize);
                    // legs
                    ctx.moveTo(this.positionX, this.positionY-this.bodySize/2);
                    ctx.lineTo(this.positionX-this.bodySize/4, this.positionY);
                    ctx.moveTo(this.positionX, this.positionY-this.bodySize/2);
                    ctx.lineTo(this.positionX+this.bodySize/4, this.positionY);
                    // torso
                    ctx.moveTo(neckX, neckY);
                    ctx.lineTo(neckX, groinY);

                    // blip
                    ctx.moveTo(this.positionX, this.positionY-this.bodySize-10);
                    ctx.lineTo(this.positionX-15, this.positionY-this.bodySize);
                    ctx.lineTo(this.positionX-15, this.positionY-this.bodySize+18);
                    ctx.lineTo(this.positionX, this.positionY-this.bodySize+30);
                    ctx.lineTo(this.positionX+15, this.positionY-this.bodySize+18);
                    ctx.lineTo(this.positionX+15, this.positionY-this.bodySize);

                }
                break;

            default:
                // arms
                ctx.moveTo(this.positionX, this.positionY-this.bodySize);
                ctx.lineTo(this.positionX-armLength, this.positionY-this.bodySize);
                ctx.moveTo(this.positionX, this.positionY-this.bodySize);
                ctx.lineTo(this.positionX+armLength, this.positionY-this.bodySize);
                // legs
                ctx.moveTo(this.positionX, this.positionY-this.bodySize/2);
                ctx.lineTo(this.positionX-this.bodySize/4, this.positionY);
                ctx.moveTo(this.positionX, this.positionY-this.bodySize/2);
                ctx.lineTo(this.positionX+this.bodySize/4, this.positionY);
                // torso
                ctx.moveTo(neckX, neckY);
                ctx.lineTo(neckX, groinY);
                break;
        }
        
        ctx.fillStyle = this.portColor;
        // drawCircle(this.positionX, this.positionY, this.bodySize, this.portColor, stroke);

    }

    drawAnologStick(length, color, stick){
        let stickX = (stick == 'c') ? this.inputCX : this.inputX;
        let stickY = (stick == 'c') ? this.inputCY : this.inputY;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.moveTo(this.positionX, this.positionY - this.bodySize);
        ctx.lineTo(this.positionX + (stickX * length), (this.positionY - this.bodySize) - (stickY * length));
        ctx.stroke();
        ctx.closePath();
    }


    toggleRubberBand(){ return this.rubberBandVisible = (this.rubberBandVisible) ? false : true; }

    toggleDI(){ return this.diVisible = (this.diVisible) ? false : true; }

    setCharFacing(dir){
        this.charFacingDirection = dir;
        this.charImg = new Image();
        this.charImg.src = `img/heads_${this.charFacingDirection}/${this.charName}_${this.charColor}.png`;
    }

    determineHeadOffset(char){
        switch(char){
            case 'Falco':
                if(this.charFacingDirection == 1)
                    return 4;
                else
                    return 20;
            case 'Falcon':
                return 13;
            default:
                return 10;
        }
    }

    colorFromPort(port){
        switch(port){
            case 1:
                return '#ff392e';
            case 2:
                return '#3370d4';
            case 3:
                return '#00ff00';
            case 4:
                return '#ffff00';
            default:
                return '#ffffff';
        }
    }

    setPortColor(port){ this.portColor = this.colorFromPort(port); }


}
