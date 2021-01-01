
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
        this.name = '';
        this.code = '';
        this.zones = new Set();
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
