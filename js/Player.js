
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
        this.diVisible = true;
        
    }

    setPositionX(pos){ this.positionX = pos; }
    setPositionY(pos){ this.positionY = pos; }

    getPositionX(){ return this.positionX; }
    getPositionY(){ return this.positionY; }

    draw(){
        let radius = 25;

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

        
        // draw DI
        if(this.diVisible){
            let scale = 80;
            ctx.beginPath();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 5;
            ctx.moveTo(this.positionX, this.positionY - radius);
            ctx.lineTo(this.positionX + (this.inputX * scale), (this.positionY - radius) - (this.inputY * scale));
            ctx.stroke();
            ctx.closePath();

        }

        let stroke = (this.activePerspective) ?  '#00ff00' : '#fff';
        ctx.strokeStyle = stroke;
        ctx.fillStyle = this.portColor;

        // draw character bubble
        if(characterBubbleVisible)
            drawCircle(this.positionX, this.positionY, radius, this.portColor, stroke);

        //draw character head
        ctx.drawImage(this.charImg, this.positionX - 12, this.positionY - radius - 13);
        
        //display action state text
        ctx.font = '20px Arial';
        ctx.fillText(this.actionStateName, this.positionX - ctx.measureText(this.actionStateName).width/2, this.positionY - 70);



    }


    toggleRubberBand(){ return this.rubberBandVisible = (this.rubberBandVisible) ? false : true; }

    toggleDI(){ return this.diVisible = (this.diVisible) ? false : true; }

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
