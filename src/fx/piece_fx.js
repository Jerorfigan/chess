var R = require("../../lib/ramda.min.js");
var BoardFX = require("./board_fx.js");

var PieceFX = function(){
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
		"BPh": "black_pawn.png"
	};
};

PieceFX.prototype.buildPieces = function(boardState){
	var pieceTextures = PIXI.loader.resources["assets/img/pieces_tileset.json"].textures,
		piecesContainer = new PIXI.Container(),
		boardFX = new BoardFX(),
		thisObj = this;

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

		piecesContainer.addChild(pieceSprite);
	}, boardState);

	return piecesContainer;
};

module.exports = PieceFX;