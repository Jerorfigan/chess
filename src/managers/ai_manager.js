var gameEvent = require("../game_event.js");
var R = require("../../lib/ramda.min.js");
var settings = require("../settings.js");

var AIManager = function(boardManager){
	this.boardManager = boardManager;
	this.player = settings.aiPlayer;

	// Register for events
	gameEvent.subscribe("PlayerMovedPiece", aiTakeTurn, this);
	gameEvent.subscribe("GameStarted", onGameStarted, this);
};

module.exports = AIManager;

function aiTakeTurn(){
	// Simple random move algorithm to start with
	var excludedPieces = [];

	do{
		// Select a random non-captured piece, and remember which pieces we've tried to move so we
		// don't keep trying to move a piece that has no valid moves
		var chosenSqr = null,
			nonCapturedPieces = this.boardManager.getAllPiecesForPlayer(this.player, "UNCAPTURED", excludedPieces);
		if(nonCapturedPieces.length == 0){
			console.log("AI could not find valid move");
			break;
		}
		var chosenPiece = nonCapturedPieces[Math.floor(nonCapturedPieces.length * Math.random())];
		excludedPieces.push(chosenPiece);

		// Select a random valid move for this piece, if it has one
		var moves = this.boardManager.getSqrsPieceCan(chosenPiece);
		chosenSqr = moves.length > 0 ? moves[Math.floor(moves.length * Math.random())] : null;
		// Still need to validate move in case AI is in check
		if(chosenSqr && !this.boardManager.canPieceMoveToSqr(chosenPiece, chosenSqr)) chosenSqr = null;
	}while(!chosenSqr);
	
	if(chosenSqr){
		this.boardManager.movePieceToSqr(chosenPiece, chosenSqr);
		gameEvent.fire("AIMovedPiece");
	}
}

function onGameStarted(eventName, data){
	if(this.boardManager.whosTurnIsIt() == this.player){
		this.aiTakeTurn();
	}
}