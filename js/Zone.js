
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
        this.drawBox(color);
        this.drawName(color);
    }

    drawBox(color){
        ctx.beginPath();
        ctx.rect(meleeToCanvasX(this.left), meleeToCanvasY(this.top - 6), this.width, this.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.fillStyle = 'rgba(0, 255, 0, .25)';
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
    
    drawName(color){
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.font = "30px Arial";
        ctx.fill();
        ctx.fillText(this.name, meleeToCanvasX(this.left) + this.width/2 - ctx.measureText(this.name).width/2, meleeToCanvasY(this.top) + 50);
        ctx.stroke();
        ctx.closePath();
    }

    isInside(x, y){
        if(canvasToMeleeX(x) <= this.right && canvasToMeleeX(x) >= this.left) 
            if(canvasToMeleeY(y) <= this.top - stage.y_offset && canvasToMeleeY(y) >= this.bottom - stage.y_offset)
                return true;
    }

    isBelow(x, y){
        if(canvasToMeleeX(x) <= this.right && canvasToMeleeX(x) >= this.left) 
            if(canvasToMeleeY(y) <= this.top - stage.y_offset)
                return true;
    }

}
