var settings = require("../settings.js");
var gameEvent = require("../game_event.js");

var BoardFX = function(renderer, stage){
	this.renderer = renderer;
	this.stage = stage;

	// Graphics objects
	this.boardContainer = null;
	this.selectedSqrHighlight = null;

	// Constants
	this.sqrWidth = (settings.canvasWidth - settings.boardSqrBorderSize) / 8;
	this.file2numeral = {
		"a": 1, "b": 2, "c": 3, "d": 4, "e": 5, "f": 6, "g": 7, "h": 8
	};
	this.numeral2file = {
		"1": "a", "2": "b", "3": "c", "4": "d", "5": "e", "6": "f", "7": "g", "8": "h"
	}
	this.sqrGraphicsByID = {};

	// Register for events
	gameEvent.subscribe("PieceSelected", onPieceSelected, this);
	gameEvent.subscribe("BoardSetup", onBoardSetup, this);
	gameEvent.subscribe("PlayerMovedPiece", onPieceMoved, this);
	gameEvent.subscribe("AIMovedPiece", onPieceMoved, this);
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

BoardFX.prototype.renderBoard = function(){
	if(this.boardContainer){
		this.stage.removeChild(this.boardContainer);
		this.boardContainer.destroy();
	}

	var isWhite = false;

	this.boardContainer = new PIXI.Container();

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
			this.boardContainer.addChild(sqr);

			// Update sqrGraphicsByID map
			this.sqrGraphicsByID[this.numeral2file[col + 1] + (8 - row)] = sqr;

			// Toggle isWhite flag
			isWhite = !isWhite;
		}
	}
	
	this.stage.addChild(this.boardContainer);
	this.renderer.render(this.stage);
};

module.exports = BoardFX;

function destroyHighlight(){
	if(this.selectedSqrHighlight){
		this.stage.removeChild(this.selectedSqrHighlight);
		this.renderer.render(this.stage);
		this.selectedSqrHighlight.destroy();
		this.selectedSqrHighlight = null;
	}
}

function onPieceMoved(eventName, data){
	destroyHighlight.call(this);
}

function onPieceSelected(eventName, data){
	destroyHighlight.call(this);
	var sqrToHighlight = this.sqrGraphicsByID[data.sqrID],
		posX = sqrToHighlight.chessSqrCol * this.sqrWidth + settings.boardSqrBorderSize/2,
		posY = sqrToHighlight.chessSqrRow * this.sqrWidth + settings.boardSqrBorderSize/2;

	this.selectedSqrHighlight = new PIXI.Graphics();
	this.selectedSqrHighlight.lineStyle(settings.boardSqrBorderSize, settings.boardSqrBorderColorHighlighted);
	this.selectedSqrHighlight.drawRect(posX, posY, this.sqrWidth, this.sqrWidth);
	
	this.stage.addChild(this.selectedSqrHighlight);
	this.renderer.render(this.stage);
}

function onBoardSetup(eventName, data){
	this.renderBoard();
}