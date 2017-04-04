var R = require("../../lib/ramda.min.js");
var settings = require("../settings.js");

var BoardFX = function(renderer, stage){
	this.renderer = renderer;
	this.stage = stage;
	this.sqrWidth = (settings.canvasWidth - settings.boardSqrBorderSize) / 8;
	this.file2numeral = {
		"a": 1, "b": 2, "c": 3, "d": 4, "e": 5, "f": 6, "g": 7, "h": 8
	};
};

BoardFX.prototype.getCanvasLocFromSqrID = function(sqrID){
	var canvasLoc = {
		x: (this.file2numeral[sqrID.charAt(0)] - 1) * this.sqrWidth + this.sqrWidth/2 + settings.boardSqrBorderSize/2,
		y: (8 - parseInt(sqrID.charAt(1))) * this.sqrWidth + this.sqrWidth/2 + settings.boardSqrBorderSize/2
	};
	return canvasLoc;
};

BoardFX.prototype.getSqrWidth = function(){
	return this.sqrWidth;
};

BoardFX.prototype.draw = function(){
	var isWhite = false;
	for(var row = 0; row <= 7; row++){
		isWhite = !isWhite;
		for(var col = 0; col <= 7; col++){
			var sqr = new PIXI.Graphics(),
				sqrBorderColor = settings.boardSqrBorderColor,
				sqrBorderSize = settings.boardSqrBorderSize,
				whiteSqrFillColor = settings.boardSqrWhiteColor,
				blackSqrFillColor = settings.boardSqrBlackColor,
				sqrHeight = this.sqrWidth,
				posX = col * this.sqrWidth + sqrBorderSize/2,
				posY = row * sqrHeight + sqrBorderSize/2;

			sqr.lineStyle(sqrBorderSize, sqrBorderColor, 1);
			if(isWhite){
				sqr.beginFill(whiteSqrFillColor);
			}else{
				sqr.beginFill(blackSqrFillColor);
			}
			sqr.drawRect(posX, posY, this.sqrWidth, sqrHeight);
			sqr.endFill();
			this.stage.addChild(sqr);
			isWhite = !isWhite;
		}
	}
};

module.exports = BoardFX;