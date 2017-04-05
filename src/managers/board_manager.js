var R = require("../../lib/ramda.min.js");

var BoardManager = function(gameState){
	this.gameState = gameState;
	
	// Constants
	this.pieceStartPos = {
		WK: "e1", WQ: "d1", WBc: "c1", WBf: "f1",  WNb: "b1", WNg: "g1", WRa: "a1", WRh: "h1", WPa: "a2", WPb: "b2", WPc: "c2", WPd: "d2", WPe: "e2", WPf: "f2", WPg: "g2", WPh: "h2",
		BK: "e8", BQ: "d8", BBc: "c8", BBf: "f8",  BNb: "b8", BNg: "g8", BRa: "a8", BRh: "h8", BPa: "a7", BPb: "b7", BPc: "c7", BPd: "d7", BPe: "e7", BPf: "f7", BPg: "g7", BPh: "h7"
	};
	this.pieces = ["K", "Q", "Bc", "Bf", "Nb", "Ng", "Ra", "Rh", "Pa", "Pb", "Pc", "Pd", "Pe", "Pf", "Pg", "Ph"];
	this.players = ["W", "B"];
	
	// Init maps
	this.piece2board = {};
	this.board2piece = {};
	initPiece2Board.call(this);
	initBoard2Piece.call(this);

	// Update gameState.boardState
	this.gameState.boardState = this.board2piece;
};

BoardManager.prototype.isValidMove = function(){
	// TODO
	return true;
};

BoardManager.prototype.movePiece = function(sourceSqrID, targetSqrID){
	if(!this.board2piece[sourceSqrID]) throw "Attempt to move piece from empty square";

	console.log("Moving " + this.board2piece[sourceSqrID] + " from " + sourceSqrID + " to " + targetSqrID);

	// Update board2piece map
	var movingPieceID = this.board2piece[sourceSqrID];
	delete this.board2piece[sourceSqrID];
	if(this.board2piece[targetSqrID]){
		// Capturing
		// TODO
	}else{
		this.board2piece[targetSqrID] = movingPieceID;
	}
	// Update piece2board map
	var movingPiece = this.piece2board[movingPieceID];
	movingPiece.rank = targetSqrID.charAt(1);
	movingPiece.file = targetSqrID.charAt(0);

	console.log("Board state after move: ");
	console.log(this.gameState.boardState);
};

BoardManager.prototype.squareHasPlayerPiece = function(sqrID, player){
	return this.board2piece[sqrID] && this.board2piece[sqrID].charAt(0) == player; 
};

module.exports = BoardManager;

function initPiece2Board(){
	var thisObj = this;
	R.forEach(function(player){
		R.forEach(function(piece){
			var pieceID = player + piece;
			thisObj.piece2board[pieceID] = {
				rank: thisObj.pieceStartPos[pieceID].charAt(1),
				file: thisObj.pieceStartPos[pieceID].charAt(0),
				pieceAbbrev: piece.charAt(0)
			};
		}, thisObj.pieces);
	}, this.players);
}

function initBoard2Piece(){
	var thisObj = this;
	R.forEachObjIndexed(function(startPos, pieceID){
		thisObj.board2piece[startPos] = pieceID;
	}, this.pieceStartPos);
}