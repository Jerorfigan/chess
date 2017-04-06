var gameEvent = require("../game_event.js");

var PlayerManager = function(boardManager){
	this.boardManager = boardManager;
	this.playerColor = "W";
	this.lastSelectedSquareWithOwnedPiece = null;

	// Flags
	this.isPlayerTurn = false;

	// Register for events
	gameEvent.subscribe("BoardSquareSelected", onPlayerSelectedSquare, this);
	gameEvent.subscribe("AIMovedPiece", onAIMovedPiece, this);
	gameEvent.subscribe("GameStarted", onGameStarted, this);
};

module.exports = PlayerManager;

function onPlayerSelectedSquare(eventName, data){
	var sqrID = data.sqrID;

	// Ignore selection unless it's player turn
	if(this.isPlayerTurn){
		// If player already has a square selected with owned piece...
		if(this.lastSelectedSquareWithOwnedPiece){
			// ...That is different than this newly selected square, then interpret this as a move to
			// the newly selected square with the piece at the last square 
			if(this.lastSelectedSquareWithOwnedPiece != sqrID){
				// If player owns piece at square, interpret this as changing which piece is to be moved
				if(this.boardManager.squareHasPlayerPiece(sqrID)){
					this.lastSelectedSquareWithOwnedPiece = sqrID;
					console.log("Player has selected square: " + sqrID);
					gameEvent.fire("PieceSelected", {sqrID: sqrID});
				}
				// Validate the move
				else if(this.boardManager.isValidMove(this.lastSelectedSquareWithOwnedPiece, sqrID)){
					this.boardManager.movePiece(this.lastSelectedSquareWithOwnedPiece, sqrID);
					this.lastSelectedSquareWithOwnedPiece = null;
					this.isPlayerTurn = false;
					gameEvent.fire("PlayerMovedPiece");
				}else{
					console.log("Invalid move.");
				}
			}
		}
		// Else the player is in the process of selecting a square with owned piece, so check that there's 
		// a piece belonging to the player on this square
		else if(this.boardManager.squareHasPlayerPiece(sqrID)){
			// Record their selected square with owned piece in anticipation of move
			this.lastSelectedSquareWithOwnedPiece = sqrID;
			console.log("Player has selected square: " + sqrID);
			gameEvent.fire("PieceSelected", {sqrID: sqrID});
		}else{
			console.log("No owned piece at this square.");
		}
	}else{
		console.log("It is not your turn.");
	}
}

function onAIMovedPiece(eventName, data){
	this.isPlayerTurn = true;
}

function onGameStarted(eventName, data){
	this.isPlayerTurn = true;
}