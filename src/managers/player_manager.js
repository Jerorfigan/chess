var gameEvent = require("../game_event.js");
var settings = require("../settings.js");
var ui = require("../user_prompt.js");

var PlayerManager = function(boardManager){
	this.boardManager = boardManager;
	this.player = settings.humanPlayer;

	this.lastSelectedSquareWithOwnedPiece = null;
	this.lastSelectedPiece = null;

	// Register for events
	gameEvent.subscribe("BoardSquareSelected", onPlayerSelectedSquare, this);
};

module.exports = PlayerManager;

function onPlayerSelectedSquare(eventName, data){
	var sqrID = data.sqrID;

	// Ignore selection unless it's player turn
	if(this.boardManager.whosTurnIsIt() == this.player){
		// If player already has a square selected with owned piece...
		if(this.lastSelectedSquareWithOwnedPiece && this.lastSelectedPiece){
			// ...That is different than this newly selected square, then interpret this as a move to
			// the newly selected square with the piece at the last square 
			if(this.lastSelectedSquareWithOwnedPiece != sqrID){
				// If player owns piece at square, interpret this as changing which piece is to be moved
				if(this.boardManager.squareHasPlayerPiece(sqrID, this.player)){
					selectPieceAtSqr.call(this, this.boardManager.getPieceAtSqr(sqrID), sqrID);
				}
				// Is valid move?
				else if(this.boardManager.isValidMove(this.lastSelectedSquareWithOwnedPiece, sqrID)){
					moveLastSelectedPieceToSqrID.call(this, sqrID);
				}else{
					ui.log("Invalid move.");
				}
			}
		}
		// Else the player is in the process of selecting a square with owned piece, so check that there's 
		// a piece belonging to the player on this square
		else if(this.boardManager.squareHasPlayerPiece(sqrID, this.player)){
			selectPieceAtSqr.call(this, this.boardManager.getPieceAtSqr(sqrID), sqrID);
		}else{
			ui.log("No owned piece at this square.");
		}
	}else{
		ui.log("It is not your turn.");
	}
}

function moveLastSelectedPieceToSqrID(sqrID){
	this.boardManager.movePieceToSqr(this.lastSelectedPiece, sqrID);
	this.lastSelectedSquareWithOwnedPiece = null;
	this.lastSelectedPiece = null;
}

function selectPieceAtSqr(pieceID, sqrID){
	this.lastSelectedSquareWithOwnedPiece = sqrID;
	this.lastSelectedPiece = pieceID;
	ui.log("Player has selected " + pieceID + " at square: " + sqrID);
	gameEvent.fire("PieceSelected", {pieceID: pieceID, sqrID: sqrID, moves: this.boardManager.getSqrsPieceCan(pieceID)});
}