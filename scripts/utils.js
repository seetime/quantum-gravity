// utils.js
function Point(x, y) {
    this.x = x;
    this.y = y;
}

Point.prototype = {
    x: 0,
    y: 0,

    constructor: Point,

    isAbove: function(p) {
        return this.y > p.y;
    },

    isBelow: function(p) {
        return this.y < p.y;
    },

    size: function() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }
};


function ForceField(ctx, sx, sy, width, height, w, m) {
    
    this.ctx = ctx; // Canvas context

    this.sx = sx;
    this.sy = sy;
    this.width = width;
    this.height = height;
    this.we = w;     // Wave Energy
    this.me = m;     // Mass energy
}

ForceField.prototype.draw = function () {
    
    this.ctx.beginPath();
    this.ctx.rect( this.sx, this.sy, this.width, this.height);
    this.ctx.fillStyle = '#00CC99';
    this.ctx.fill();

    this.ctx.font = "16px monospace";
    this.ctx.fillStyle = "red";
    this.ctx.textAlign = "left";

    var p = "Energy field{" + this.we + "," + this.me + "}";
    this.ctx.fillText( p, this.sx, this.sy);

    this.ctx.stroke();
};

ForceField.prototype.isInside = function (x, y) {
    
    if ( x > this.sx && x < this.sx+this.width ) {
        if ( y > this.sy && y < this.sy+this.height) {
            return true;
        }
    }
    return false;
};



function hello() {
    return "Hello";
}