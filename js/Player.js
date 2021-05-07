
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
        this.inflectionPoints = [];
        this.inflectionPointsReversed = [];
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
        this.distanceFromCenter = 40;
        this.phase = 'True Neutral';
        this.state = 'Approach';
        
    }

    setPositionX(pos){ this.positionX = pos; }
    setPositionY(pos){ this.positionY = pos; }

    getPositionX(){ return this.positionX; }
    getPositionY(){ return this.positionY; }

    draw(window_scaler){
        this.bodySize = 100 * window_scaler;


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

        //display action state text
        ctx.font = '20px Arial';
        // ctx.fillText(this.actionStateName, this.positionX - ctx.measureText(this.actionStateName).width/2, this.positionY - 70);
        // ctx.fillText(canvasToMeleeY(this.positionY).toFixed(2), this.positionX - ctx.measureText(this.actionStateName).width/2, this.positionY - 70);
        // ctx.fillText(this.phase, this.positionX - ctx.measureText(this.phase).width/2, this.positionY - 100);
        // ctx.fillText(this.state, this.positionX - ctx.measureText(this.state).width/2, this.positionY - 130);
        ctx.stroke();
        ctx.closePath();


    }

    drawRubberBand(){

        this.distanceFromCenter = Math.sqrt(Math.floor(canvasToMeleeX(this.positionX) ** 2 + canvasToMeleeY(this.positionY) ** 2));
        if(this.distanceFromCenter > 160)
            return;

        ctx.beginPath();
        let stressFactor = this.distanceFromCenter * 2;
        ctx.setLineDash([this.distanceFromCenter/3, this.distanceFromCenter/3]);/*dashes are 5px and spaces are 3px*/
        // ctx.setLineDash([5, 15]);/*dashes are 5px and spaces are 3px*/
        ctx.strokeStyle = `rgb(${Math.floor(0 + stressFactor)}, ${Math.floor(255 - stressFactor)}, 0)`;
        ctx.lineWidth = 3;
        ctx.moveTo(meleeToCanvasX(0), meleeToCanvasY(0));
        ctx.lineTo(this.positionX, this.positionY - this.bodySize / 3);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.closePath();
    }


    drawCharacter(){
        let imgOffsetX = 38;
        let imgOffsetY = 73;
        
        ctx.beginPath();        // has to be in here for drawRubberBand() to work properly...?

        switch(this.actionStateId){
            case 67: 
            case 72:
                this.charImg.src = this.getMoveImageSrc('bair');
                break;
            case 69: 
            case 74:
                this.charImg.src = this.getMoveImageSrc('dair');
                break;
            case 65:
            case 70:
                this.charImg.src = this.getMoveImageSrc('nair');
                break;
            case 360:
            case 361:
            case 362:
            case 363:
            case 364:
            case 365:
            case 366:
            case 367:
            case 368:
            case 369:
                if(this.charName == 'Falco' || this.charName == 'Fox')
                    this.charImg.src = this.getMoveImageSrc('shine');
                else
                    this.charImg.src = this.getMoveImageSrc('stand');
                break;
            default:
                this.charImg.src = this.getMoveImageSrc('stand');
                break;
        }

        // this.charImg.classList.add("overlay");
        ctx.drawImage(this.charImg, this.positionX - imgOffsetX, this.positionY - imgOffsetY  , this.bodySize, this.bodySize);
        
        if(this.charName != 'Falco'){
            let bad = new Image();
            let charHeadOffset = this.determineHeadOffset(this.charName);
            bad.src = `img/heads_${this.charFacingDirection}/${this.charName}_${this.charColor}.png`;
            ctx.drawImage(bad, this.positionX - charHeadOffset, this.positionY - this.bodySize * 2/3);
        }
        
        ctx.fillStyle = this.portColor;
    }

    
    getMoveImageSrc(move){
        if (this.charName == 'Falco')
            return `img/animations/${this.charName}/${move}_${this.charFacingDirection}.png`;
        else
            return `img/animations/stand_${this.charFacingDirection}.png`;
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
                return 10;
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
