var R = require("../../lib/ramda.min.js");
var settings = require("../settings.js");
var gameEvent = require("../game_event.js");

var BoardFX = function(renderer, stage){
	this.renderer = renderer;
	this.stage = stage;

	// Graphics objects
	this.boardContainer = null;
	this.highlights = null;

	// Constants
	this.sqrWidth = (settings.canvasWidth - settings.boardSqrBorderSize) / 8;

	// Register for events
	gameEvent.subscribe("PieceSelected", onPieceSelected, this);
	gameEvent.subscribe("BoardSetup", onBoardSetup, this);
	gameEvent.subscribe("BoardUpdated", onBoardUpdated, this);
};

// Returns the center coordinate of the square graphic
BoardFX.prototype.getCanvasLocFromSqrID = function(sqrID){
	return {
		x: (sqrID.charCodeAt(0) - 97) * this.sqrWidth + this.sqrWidth/2 + settings.boardSqrBorderSize/2,
		y: (8 - parseInt(sqrID.charAt(1))) * this.sqrWidth + this.sqrWidth/2 + settings.boardSqrBorderSize/2
	};
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
			sqr.chessSqrID = String.fromCharCode(97 + col) + (8 - row);
			sqr.on("pointerdown", function(e){
				gameEvent.fire("BoardSquareSelected", {sqrID: e.currentTarget.chessSqrID});
			});

			// Add to parent container
			this.boardContainer.addChild(sqr);

			// Toggle isWhite flag
			isWhite = !isWhite;
		}
	}
	
	this.stage.addChild(this.boardContainer);
	this.renderer.render(this.stage);
};

module.exports = BoardFX;

/* EVENT HANDLERS */
function onBoardUpdated(eventName, data){
	destroyHighlights.call(this);
}

function onPieceSelected(eventName, data){
	highlightSelectedSqrAndMoves.call(this, data.sqrID, data.moves);
}

function onBoardSetup(eventName, data){
	this.renderBoard();
}

/* PRIVATE ROUTINES */

function highlightSelectedSqrAndMoves(sqrID, moves){
	// Clean up old highlights
	destroyHighlights.call(this);

	this.highlights = new PIXI.Container();

	// Get the canvas position to draw the highlight at
	var canvasPos = this.getCanvasLocFromSqrID(sqrID);

	// Highlight the square with the selected piece
	highlightSquare.call(this, sqrID, settings.boardSqrHighlightColorForSelectedPiece);

	// Highlight available moves
	var thisObj = this;
	R.forEach(function(sqrID){
		highlightSquare.call(thisObj, sqrID, settings.boardSqrHighlightColor);
	}, moves);

	// Add highlight underneath pieces container
	this.stage.addChildAt(this.highlights, this.stage.children.length-1);
	this.renderer.render(this.stage);
}

function highlightSquare(sqrID, color){
	var canvasPos = this.getCanvasLocFromSqrID(sqrID),
		sqrHighlight = new PIXI.Graphics();

	sqrHighlight.beginFill(color);
	sqrHighlight.drawRect(canvasPos.x - this.sqrWidth/2 + settings.boardSqrBorderSize/2, canvasPos.y - this.sqrWidth/2 + settings.boardSqrBorderSize/2, this.sqrWidth - settings.boardSqrBorderSize, this.sqrWidth - settings.boardSqrBorderSize);
	this.highlights.addChild(sqrHighlight);
}

function destroyHighlights(){
	if(this.highlights){
		this.stage.removeChild(this.highlights);
		this.renderer.render(this.stage);
		this.highlights.destroy();
		this.highlights = null;
	}
}