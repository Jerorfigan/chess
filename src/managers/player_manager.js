var gameEvent = require("../game_event.js");

var PlayerManager = function(gameState, boardManager){
	this.gameState = gameState;
	this.boardManager = boardManager;

	// Register for events
	gameEvent.subscribe("BoardSquareSelected", this.onPlayerSelectedSquare, this);

	// Flags
	this.lastSelectedSquareWithOwnedPiece = null;
};

PlayerManager.prototype.hasTakenTurn = function(){
	// TODO
	return false;
};

PlayerManager.prototype.onPlayerSelectedSquare = function(eventName, data){
	var sqrID = data.sqrID;

	// Ignore selection unless it's player turn
	if(this.gameState.isPlayerTurn){
		// If player already has a square selected with owned piece...
		if(this.lastSelectedSquareWithOwnedPiece){
			// ...That is different than this newly selected square, then interpret this as a move to
			// the newly selected square with the piece at the last square 
			if(this.lastSelectedSquareWithOwnedPiece != sqrID){
				// Validate the move
				if(this.boardManager.isValidMove(this.lastSelectedSquareWithOwnedPiece, sqrID)){
					this.boardManager.movePiece(this.lastSelectedSquareWithOwnedPiece, sqrID);
					this.lastSelectedSquareWithOwnedPiece = null;
				}else{
					console.log("Invalid move.");
				}
			}
		}
		// Else the player is in the process of selecting a square with owned piece, so check that there's 
		// a piece belonging to the player on this square
		else if(this.boardManager.squareHasPlayerPiece(sqrID, this.gameState.playerColor)){
			// Record their selected square with owned piece in anticipation of move
			this.lastSelectedSquareWithOwnedPiece = sqrID;
			console.log("Player has selected square: " + sqrID);
		}else{
			console.log("No owned piece at this square.");
		}
	}else{
		console.log("It is not your turn.");
	}
};

module.exports = PlayerManager;