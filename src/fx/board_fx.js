var R = require("../../lib/ramda.min.js");
var settings = require("../settings.js");

var BoardFX = function(renderer, stage){
	this.renderer = renderer;
	this.stage = stage;
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
				sqrWidth = (settings.canvasWidth - sqrBorderSize) / 8,
				sqrHeight = sqrWidth,
				posX = col * sqrWidth + sqrBorderSize/2,
				posY = row * sqrHeight + sqrBorderSize/2;

			sqr.lineStyle(sqrBorderSize, sqrBorderColor, 1);
			if(isWhite){
				sqr.beginFill(whiteSqrFillColor);
			}else{
				sqr.beginFill(blackSqrFillColor);
			}
			sqr.drawRect(posX, posY, sqrWidth, sqrHeight);
			sqr.endFill();
			this.stage.addChild(sqr);
			isWhite = !isWhite;
		}
	}
};

module.exports = BoardFX;