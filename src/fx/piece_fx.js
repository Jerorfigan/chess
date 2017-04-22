var R = require("../../lib/ramda.min.js");
var gameEvent = require("../game_event.js");
var settings = require("../settings.js");

var PieceFX = function(renderer, stage, boardFX){
	this.renderer = renderer;
	this.stage = stage;

	this.boardFX = boardFX;
	this.pieceID2TextureID = {
		"WK": "white_king.png",
		"WQ": "white_queen.png",
		"WBc": "white_bishop.png",
		"WBf": "white_bishop.png",
		"WNb": "white_knight.png",
		"WNg": "white_knight.png",
		"WRa": "white_rook.png",
		"WRh": "white_rook.png",
		"WPa": "white_pawn.png",
		"WPb": "white_pawn.png",
		"WPc": "white_pawn.png",
		"WPd": "white_pawn.png",
		"WPe": "white_pawn.png",
		"WPf": "white_pawn.png",
		"WPg": "white_pawn.png",
		"WPh": "white_pawn.png",
		"WB": "white_bishop.png",
		"WN": "white_knight.png",
		"WR": "white_rook.png",
		"BK": "black_king.png",
		"BQ": "black_queen.png",
		"BBc": "black_bishop.png",
		"BBf": "black_bishop.png",
		"BNb": "black_knight.png",
		"BNg": "black_knight.png",
		"BRa": "black_rook.png",
		"BRh": "black_rook.png",
		"BPa": "black_pawn.png",
		"BPb": "black_pawn.png",
		"BPc": "black_pawn.png",
		"BPd": "black_pawn.png",
		"BPe": "black_pawn.png",
		"BPf": "black_pawn.png",
		"BPg": "black_pawn.png",
		"BPh": "black_pawn.png",
		"BB": "black_bishop.png",
		"BN": "black_knight.png",
		"BR": "black_rook.png"
	};

	// Graphiccs objects
	this.piecesContainer = null;
	this.pieceID2sprite = {};

	// Register for events
	gameEvent.subscribe("BoardSetup", onBoardSetup, this);
	gameEvent.subscribe("PiecesUpdated", onPiecesUpdated, this);
};

PieceFX.prototype.renderPieces = function(boardState){
	if(this.piecesContainer){
		this.stage.removeChild(this.piecesContainer);
		this.piecesContainer.destroy();
		this.piecesContainer = null;
		this.pieceID2sprite = {};
	}

	var pieceTextures = PIXI.loader.resources[settings.tilesetAtlasPath].textures,
		boardFX = this.boardFX,
		thisObj = this;

	this.piecesContainer = new PIXI.Container();

	R.forEachObjIndexed(function(pieceID, sqrID){
		var pieceSprite = new PIXI.Sprite(pieceTextures[thisObj.pieceID2TextureID[pieceID]]),
			canvasLoc = boardFX.getCanvasLocFromSqrID(sqrID),
			sqrWidth = boardFX.getSqrWidth();
		
		// Scale sprite to fit in board square
		pieceSprite.width = sqrWidth;
		pieceSprite.height = sqrWidth;
		// Set anchor to center of sprite
		pieceSprite.anchor.x = .5;
		pieceSprite.anchor.y = .5;
		// Position sprite in square
		pieceSprite.x = canvasLoc.x;
		pieceSprite.y = canvasLoc.y;

		pieceSprite.zOrder = 1;

		thisObj.pieceID2sprite[pieceID] = pieceSprite;

		thisObj.piecesContainer.addChild(pieceSprite);
	}, boardState);

	this.stage.addChild(this.piecesContainer);
	this.renderer.render(this.stage);
};

PieceFX.prototype.animatePieceUpdates = function(moves, capture, doneCallback, context){
	var animatingPieces = [],
		animDurationMS = 1000,
		elapsedTimeMS = 0,
		lastAnimateTS = null,
		thisObj = this;

	R.forEach(function(move){
		var animatingPiece = {
			sprite: thisObj.pieceID2sprite[move.pieceID],
			startCanvasLoc: {x: thisObj.pieceID2sprite[move.pieceID].x, y: thisObj.pieceID2sprite[move.pieceID].y},
			endCanvasLoc: thisObj.boardFX.getCanvasLocFromSqrID(move.sqrID),
			animation: "move"
		};

		animatingPiece.origZOrder = animatingPiece.sprite.zOrder;
		animatingPiece.sprite.zOrder = 99;

		animatingPieces.push(animatingPiece);
	}, moves);

	if(capture){
		animatingPieces.push({
			sprite: thisObj.pieceID2sprite[capture.pieceID],
			animation: "capture"
		});
	}

	function animate(currTimeTS){
		elapsedTimeMS += lastAnimateTS ? currTimeTS - lastAnimateTS : 0;
		lastAnimateTS = currTimeTS;

		// Animate pieces
		R.forEach(function(animatingPiece){
			if(animatingPiece.animation == "move"){
				var currCanvasLoc = linearlyInterpolate(animatingPiece.startCanvasLoc, animatingPiece.endCanvasLoc, Math.min(elapsedTimeMS/animDurationMS,1));
				animatingPiece.sprite.x = currCanvasLoc.x;
				animatingPiece.sprite.y = currCanvasLoc.y;
				if(elapsedTimeMS >= animDurationMS){
					animatingPiece.sprite.zOrder = animatingPiece.origZOrder;
				}
			}else if(animatingPiece.animation == "capture"){
				animatingPiece.sprite.alpha = Math.max(1 - elapsedTimeMS/animDurationMS,0);
			}else{
				throw "Unknown animation";
			}
		}, animatingPieces)

		thisObj.renderer.render(thisObj.stage);
		if(elapsedTimeMS < animDurationMS){
			window.requestAnimationFrame(animate);
		}else{
			thisObj.piecesContainer.children = R.sort(function(a, b){ return a.zOrder - b.zOrder; }, thisObj.piecesContainer.children);
			doneCallback.call(context);
		}	
	}

	this.piecesContainer.children = R.sort(function(a, b){ return a.zOrder - b.zOrder; }, this.piecesContainer.children);

	animate(performance.now());
};

/* DEBUG FUNCTION */
PieceFX.prototype.renderPieceAttacks = function(board2attacker){
	var boardFX = this.boardFX,
	    sqrWidth = boardFX.getSqrWidth(),
	    pieceColors = {"Q": "#db5e64", "R": "#cea152", "B": "#448faa", "N": "#c238c4", "K": "#33c69d"};
		thisObj = this;

	R.forEachObjIndexed(function(attackers, sqrID){
		var yOffset = -sqrWidth / 2;

		R.forEach(function(attacker){
			var style = new PIXI.TextStyle({
				    fontFamily: 'Arial',
				    fontSize: 11,
				    fill: pieceColors[attacker.charAt(1)] ? pieceColors[attacker.charAt(1)] : '#48db4f',
				    wordWrap: true,
				}),
				attackText = new PIXI.Text(attacker, style),
				canvasLoc = boardFX.getCanvasLocFromSqrID(sqrID);

			attackText.x = canvasLoc.x - 10;
			attackText.y = canvasLoc.y + yOffset;

			yOffset += 12;

			thisObj.piecesContainer.addChild(attackText);
		}, attackers);
	}, board2attacker);

	this.renderer.render(this.stage);
};

module.exports = PieceFX;

function linearlyInterpolate(startCanvasLoc, endCanvasLoc, interpolationFactor){
	var deltaVector = {x: (endCanvasLoc.x - startCanvasLoc.x) * interpolationFactor, y: (endCanvasLoc.y - startCanvasLoc.y) * interpolationFactor};

	return {x: startCanvasLoc.x + deltaVector.x, y: startCanvasLoc.y + deltaVector.y};
}

/* Event handlers */

function onBoardSetup(eventName, data){
	this.renderPieces(data.pieces);
}

function onPiecesUpdated(eventName, data){
	this.animatePieceUpdates(data.moves, data.capture, function(){
		if(data.promotion){
			promotePawn.call(this, data.promotion);
		}
		gameEvent.fire("AnimatePiecesFinished");
	}, this);
}

function promotePawn(data){
	var pieceTextures = PIXI.loader.resources[settings.tilesetAtlasPath].textures,
		newSprite = new PIXI.Sprite(pieceTextures[this.pieceID2TextureID[data.promotion]]),
		oldSprite = this.pieceID2sprite[data.oldID],
		sqrWidth = this.boardFX.getSqrWidth();

	newSprite.width = sqrWidth;
	newSprite.height = sqrWidth;
	newSprite.anchor.x = .5;
	newSprite.anchor.y = .5;
	newSprite.zOrder = 1;
	newSprite.x = oldSprite.x;
	newSprite.y = oldSprite.y;

	this.piecesContainer.removeChild(oldSprite)
	this.piecesContainer.addChild(newSprite);

	this.renderer.render(this.stage);

	delete this.pieceID2sprite[data.oldID];
	this.pieceID2sprite[data.newID] = newSprite;
}