
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
        this.rubberBandVisible = true;
        
    }

    setPositionX(pos){ this.positionX = pos; }
    setPositionY(pos){ this.positionY = pos; }

    getPositionX(){ return this.positionX; }
    getPositionY(){ return this.positionY; }

    draw(){
        
        let radius = 30;
        let stroke = '#000';
        stroke = (this.activePerspective) ?  '#00ff00' : '#fff';
        ctx.font = '20px Arial';

        // draw rubber band
        if(this.rubberBandVisible){
            ctx.beginPath();
            let stressFactor = Math.sqrt(Math.floor(canvasToMeleeX(this.positionX) ** 2 + canvasToMeleeY(this.positionY) ** 2)) * 2;
            ctx.strokeStyle = `rgb(${Math.floor(0 + stressFactor)}, ${Math.floor(255 - stressFactor)}, 0)`;
            ctx.lineWidth = 5;
            ctx.moveTo(meleeToCanvasX(0), meleeToCanvasY(0));
            ctx.lineTo(this.positionX, this.positionY - radius);
            ctx.stroke();
            ctx.closePath();
        }

        // draw character bubble
        if(characterBubbleVisible)
            drawCircle(this.positionX, this.positionY, radius, this.portColor, stroke);

        //draw character head
        ctx.drawImage(this.charImg, this.positionX - 12, this.positionY - 43);
        
        //display action state text
        ctx.fillText(this.actionStateName, this.positionX - ctx.measureText(this.actionStateName).width/2, this.positionY - 70);


        // console.log(rubberBandIntensity);
    }


    toggleRubberBand(){
        console.log('band');
        return this.rubberBandVisible = (this.rubberBandVisible) ? false : true;
    }

    setCharFacing(dir){
        this.charFacingDirection = dir;
        this.charImg = new Image();
        this.charImg.src = `img/heads_${this.charFacingDirection}/${this.charName}_${this.charColor}.png`;
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
