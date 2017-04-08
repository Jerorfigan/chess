var gameEvent = require("../game_event.js");
var R = require("../../lib/ramda.min.js");

var AIManager = function(boardManager){
	this.boardManager = boardManager;

	// Register for events
	gameEvent.subscribe("PlayerMovedPiece", onPlayerMovedPiece, this);
};

module.exports = AIManager;

function onPlayerMovedPiece(){
	// Simple random move algorithm to start with
	var excludedPieces = [];

	do{
		// Select a random non-captured piece, and remember which pieces we've tried to move so we
		// don't keep trying to move a piece that has no valid moves
		var chosenMove = null,
			nonCapturedPieces = this.boardManager.getAllPieces(excludedPieces);
		if(nonCapturedPieces.length == 0){
			console.log("AI could not find valid move");
			break;
		}
		var chosenPiece = nonCapturedPieces[Math.floor(nonCapturedPieces.length * Math.random())];
		excludedPieces.push(chosenPiece);

		// Select a random valid move for this piece, if it has one
		var moves = this.boardManager.getAllValidMovesForPiece(chosenPiece);
		chosenMove = moves.length > 0 ? moves[Math.floor(moves.length * Math.random())] : null;
		// Still need to validate move in case AI is in check
		if(chosenMove && !this.boardManager.isValidMoveByID(chosenPiece, chosenMove)) chosenMove = null;
	}while(!chosenMove);
	
	if(chosenMove){
		this.boardManager.movePieceByID(chosenPiece, chosenMove);
		gameEvent.fire("AIMovedPiece");
	}
}