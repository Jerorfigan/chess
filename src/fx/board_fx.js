var settings = require("../settings.js");
var gameEvent = require("../game_event.js");

var BoardFX = function(){
	// Constants
	this.sqrWidth = (settings.canvasWidth - settings.boardSqrBorderSize) / 8;
	this.file2numeral = {
		"a": 1, "b": 2, "c": 3, "d": 4, "e": 5, "f": 6, "g": 7, "h": 8
	};
	this.numeral2file = {
		"1": "a", "2": "b", "3": "c", "4": "d", "5": "e", "6": "f", "7": "g", "8": "h"
	}
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

BoardFX.prototype.build = function(){
	var isWhite = false,
		boardContainer = new PIXI.Container();

	for(var row = 0; row <= 7; row++){
		
		isWhite = !isWhite;
		
		for(var col = 0; col <= 7; col++){
			
			var sqr = new PIXI.Graphics(),
				posX = col * this.sqrWidth + settings.boardSqrBorderSize/2,
				posY = row * this.sqrWidth + settings.boardSqrBorderSize/2;

			// Draw square
			sqr.lineStyle(settings.boardSqrBorderSize, settings.boardSqrBorderColor, 1);
			if(isWhite){
				sqr.beginFill(settings.boardSqrWhiteColor);
			}else{
				sqr.beginFill(settings.boardSqrBlackColor);
			}
			sqr.drawRect(posX, posY, this.sqrWidth, this.sqrWidth);
			sqr.endFill();

			// Register click handler
			sqr.interactive = true;
			sqr.chessSqrCol = col;
			sqr.chessSqrRow = row;
			var thisObj = this;
			sqr.on("pointerdown", function(e){
				sqrID = thisObj.numeral2file[e.currentTarget.chessSqrCol + 1] + (8 - e.currentTarget.chessSqrRow);
				gameEvent.fire("BoardSquareSelected", {sqrID: sqrID});
			});

			// Add to parent container
			boardContainer.addChild(sqr);

			// Toggle isWhite flag
			isWhite = !isWhite;
		}
	}
	return boardContainer;
};

module.exports = BoardFX;