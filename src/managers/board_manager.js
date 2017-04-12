var R = require("../../lib/ramda.min.js");
var gameEvent = require("../game_event.js");
var settings = require("../settings.js");

var STARTING_SQRS = {
	WK: "e1", WQ: "d1", WBc: "c1", WBf: "f1",  WNb: "b1", WNg: "g1", WRa: "a1", WRh: "h1", WPa: "a2", WPb: "b2", WPc: "c2", WPd: "d2", WPe: "e2", WPf: "f2", WPg: "g2", WPh: "h2",
	BK: "e8", BQ: "d8", BBc: "c8", BBf: "f8",  BNb: "b8", BNg: "g8", BRa: "a8", BRh: "h8", BPa: "a7", BPb: "b7", BPc: "c7", BPd: "d7", BPe: "e7", BPf: "f7", BPg: "g7", BPh: "h7"
};

var BoardManager = function(){	
	this.resetBoard();

	// Register for events
	gameEvent.fire("BoardSetup", {pieces: this.board2piece});
};

/*********/
/* Reset */
/*********/

BoardManager.prototype.resetBoard = function(){
	// Init maps
	this.pieces = {};
	initPieces.call(this);

	this.board2piece = {};
	initBoard2Piece.call(this);

	this.board2attacker = {};
	initBoard2Attacker.call(this);

	// Init turn counter
	this.turnID = 1;
};

/**************************************/
/* Move control/discovery/validation routines */
/**************************************/

/**
 * Moves the piece the specified piece to the specified square.
 * @param {string} pieceID the piece ID of the piece
 * @param {string} toSqrID the square ID of the square
 * @param {boolean} speculating true, to signify that this is a speculative move, not an actual move, and to suppress console
 * 								logging and events. False by default.
 */
BoardManager.prototype.movePieceToSqr = function(pieceID, toSqrID, speculating){
	var fromSqrID = this.getSqrWithPiece(pieceID),
		playerMovingPiece = this.getPieceOwner(pieceID),
		playerTitle = playerMovingPiece == settings.humanPlayer ? "Player" : "AI",
		opponent = this.getOtherPlayer(playerMovingPiece),
		speculating = !speculating ? false : speculating;

	if(!speculating){
		console.log(playerTitle + ": Moving " + pieceID + " from " + fromSqrID + " to " + toSqrID);
	}

	// Remove piece from square it moved from
	removePieceFromBoard.call(this, pieceID);

	// Are we capturing a piece?
	if(!this.isSquareEmpty(toSqrID)){
		var capturedPieceID = this.getPieceAtSqr(toSqrID);
		removePieceFromBoard.call(this, capturedPieceID);
		if(!speculating){
			console.log(pieceID + " captures " + capturedPieceID);
			gameEvent.fire("PieceCaptured", {capturedPieceID: capturedPieceID, sqrID: toSqrID});
		}
	// Did we performed an En passant capture?
	}else if(this.getPieceType(pieceID) == "P" && getSqrFile(fromSqrID) != getSqrFile(toSqrID)){
		var targetOfEnPassantAttackSqrID = this.whosTurnIsIt() == "W" ? 
			getSqrFile(toSqrID) + (getSqrRank(toSqrID, true) - 1) :
			getSqrFile(toSqrID) + (getSqrRank(toSqrID, true) + 1);

		var capturedPieceID = this.getPieceAtSqr(targetOfEnPassantAttackSqrID);
		removePieceFromBoard.call(this, capturedPieceID);
		if(!speculating){
			console.log(movingPieceID + " captures " + capturedPieceID);
			gameEvent.fire("PieceCaptured", {capturedPieceID: capturedPieceID, sqrID: targetOfEnPassantAttackSqrID});
		}
	// Did we castle?
	}else if(this.getPieceType(pieceID) == "K" && Math.abs(getSqrFile(fromSqrID, true) - getSqrFile(toSqrID, true)) == 2){
		var castleKingside = getSqrFile(fromSqrID, true) - getSqrFile(toSqrID, true) < 0,
			rookPieceID = castleKingside ? playerMovingPiece + "Rh" : playerMovingPiece + "Ra",
			rookSqrIDAfterCastling = castleKingside ? getFileFromNumeral(getSqrFile(toSqrID, true) - 1) + getSqrRank(toSqrID) :
				String.fromCharCode(getSqrFile(toSqrID, true) + 1) + getSqrRank(toSqrID);

		removePieceFromBoard.call(this, rookPieceID);
		addPieceToBoardAtSqr.call(this, rookPieceID, rookSqrIDAfterCastling);

		// Update move history of rook
		this.pieces[rookPieceID].moveHistory[this.turnID] = rookSqrIDAfterCastling;

		if(!speculating){
			console.log(playerMovingPiece + " castled " + (castleKingside ? "kingside" : "queenside"));
		}
	}

	// Add the piece to square it moved to
	addPieceToBoardAtSqr.call(this, pieceID, toSqrID);
	
	// Update move history of piece that moved
	this.pieces[pieceID].moveHistory[this.turnID] = toSqrID;

	// Check if we need to promote pawn
	if(this.getPieceType(pieceID) == "P" && shouldPawnBePromoted.call(this, pieceID)){
		promotePawn.call(this, pieceID, speculating);
	}

	// We may have opened up new attacks or closed off old attacks for strafing pieces (Queen, Bishop and Rook), so update their attack data as well
	var strafingPieces = this.getAllPiecesForPlayer(playerMovingPiece, "UNCAPTURED", ["P", "N", "K"]);
	updateAttackDataForPieces.call(this, strafingPieces);

	if(!speculating){
		gameEvent.fire("BoardUpdated", {pieces: this.board2piece});
	}

	// Check for end of game conditions
	if(isPlayerInCheck.call(this, opponent) && hasCheckmateOccurred.call(this)){
		if(!speculating){
			console.log("Checkmate. " + playerMovingPiece + " wins.");
			gameEvent.fire("Checkmate", {winningPlayer: playerMovingPiece});
			return;
		}
	}else if(hasStalemateOccured.call(this)){
		if(!speculating){
			console.log("Stalemate.");
			gameEvent.fire("Stalemate");
			return;
		}
	}

	// Increment turn, needs to be the last thing we do
	this.turnID++;
};

/**
 * Returns all the squares that the specified piece can move to this turn.
 * @param {string} pieceID the piece ID of the piece to find moves for
 * @param {boolean} action "MOVE"/"DEFEND", default "MOVE"
 */
BoardManager.prototype.getSqrsPieceCan = function(pieceID, action){
	validatePieceID(pieceID);
	(function(action){ 
		var validActions = ["MOVE", "DEFEND"];
		if(validActions.indexOf(action) == -1 && typeof action != "undefined") throw "Unexpected value for 'action' parameter";
	})(action);

	var action = !action ? "MOVE" : action,
		validMoves = [],
		offsets = [],
		sqrID = this.getSqrWithPiece(pieceID),
		fileNumeral = getSqrFile(sqrID, true),
		rankNumeral = getSqrRank(sqrID, true),
		turnID = this.turnID,
		pieceOwner = this.getPieceOwner(pieceID),
		opponent = this.getOtherPlayer(pieceOwner),
		thisObj = this;

	function addStrafeOffsets(offsets, diagonal){
		// Build offsets for strafing ranks and files or diagonals
		var directions = diagonal ? ["NW", "NE", "SW", "SE"] : ["N", "W", "S", "E"];
		for(var i = 0; i < directions.length; i++){
			var dir = directions[i];
			switch(dir){
				case "NW":
					fileOffset = -1;
					rankOffset = 1;
				break;
				case "SW":
					fileOffset = -1;
					rankOffset = -1;
				break;
				case "NE":
					fileOffset = 1;
					rankOffset = 1;
				break;
				case "SE":
					fileOffset = 1
					rankOffset = -1
				break;
				case "N":
					fileOffset = 0;
					rankOffset = 1;
				break;
				case "S":
					fileOffset = 0;
					rankOffset = -1;
				break;
				case "W":
					fileOffset = -1;
					rankOffset = 0;
				break;
				case "E":
					fileOffset = 1;
					rankOffset = 0;
				break;
			}
			var offset = {fileOffset: fileOffset, rankOffset: rankOffset},
				limit = 0;
			while(
				isValidOffset(offset)
			)
			{
				offsets.push(offset);
				// If board sqr is occupied, then we are blocked from moving further in this
				// direction
				if(isSqrAtOffsetEmpty(offset)){
					dir == "NW" || dir == "SW" || dir == "W" ? fileOffset-- : dir != "N" && dir != "S" ? fileOffset++ : 0;
					dir == "NW" || dir == "NE" || dir == "N" ? rankOffset++ : dir != "W" && dir != "E" ? rankOffset-- : 0;
				}else{
					break;
				}
				offset = {fileOffset: fileOffset, rankOffset: rankOffset};
				limit++;
				if(limit > 1000){
					throw "Infinite loop prevented";
				}
			}
		}
	} 

	function isValidOffset(offset){
		return ((offset.fileOffset + fileNumeral) >= 1) &&
			((offset.fileOffset + fileNumeral) <= 8) && 
			((offset.rankOffset + rankNumeral) >= 1) &&
			((offset.rankOffset + rankNumeral) <= 8);
	}

	function num2algebraic(numericSqrID){
		return String.fromCharCode(numericSqrID.fileNumeral + 96) + numericSqrID.rankNumeral;
	}

	function addOffsetToNumSqrID(offset, fileNumeral, rankNumeral){
		if(typeof fileNumeral == "object"){
			return {fileNumeral: offset.fileOffset + fileNumeral.fileNumeral, rankNumeral: offset.rankOffset + fileNumeral.rankNumeral};
		}else{
			return {fileNumeral: offset.fileOffset + fileNumeral, rankNumeral: offset.rankOffset + rankNumeral};
		}
	}

	function isSqrAtOffsetEmpty(offset){
		return thisObj.isSquareEmpty(num2algebraic(addOffsetToNumSqrID(offset, fileNumeral, rankNumeral)));
	}

	function sqrAtOffsetContainsOpponentPiece(offset){
		var sqrID = num2algebraic(addOffsetToNumSqrID(offset, fileNumeral, rankNumeral));

		return !thisObj.isSquareEmpty(sqrID) && thisObj.getPieceOwner(thisObj.getPieceAtSqr(sqrID)) == opponent;
	}

	function isEnPassantAttack(offset){
		var sqrIDForEnPassantAttack = 

				offset.fileOffset == -1 ? 		
					num2algebraic(addOffsetToNumSqrID({fileOffset: -1, rankOffset: 0}, fileNumeral, rankNumeral)) : 
					num2algebraic(addOffsetToNumSqrID({fileOffset: 1, rankOffset: 0}, fileNumeral, rankNumeral)),
			
			targetOfEnPassantAttackPieceId = thisObj.getPieceAtSqr(sqrIDForEnPassantAttack),
			
			targetExistsAndIsPawn = targetOfEnPassantAttackPieceId != null && thisObj.getPieceType(targetOfEnPassantAttackPieceId) == "P",
			
			targMoveHist = targetExistsAndIsPawn ? thisObj.getPieceMoveHistory(targetOfEnPassantAttackPieceId) : null,
			
			targetMoveCnt = targMoveHist != null ? getMoveCntFromHistory(targMoveHist) : 0,
			
			targetPawnMovedTwoRanksLastTurn = 

				targetExistsAndIsPawn && targetMoveCnt == 1 && !!targMoveHist[turnID - 1] && 
				((pieceOwner == "W" && targMoveHist[turnID - 1].charAt(1) == 5) || (pieceOwner == "B" && targMoveHist[turnID - 1].charAt(1) == 4));

		return ((pieceOwner == "W" && rankNumeral == 5) || (pieceOwner == "B" && rankNumeral == 4)) && targetExistsAndIsPawn && targetPawnMovedTwoRanksLastTurn;
	}

	function getMoveCntFromHistory(pieceMoveHistory){
		var moveCnt = 0;
		R.forEachObjIndexed(function(sqrID, turnID){
			moveCnt++;
		}, pieceMoveHistory);
		return moveCnt;
	}

	function addCastlingOffsets(offsets){
		var kingSqrID = STARTING_SQRS[pieceOwner + "K"],

			kingMoveCnt = getMoveCntFromHistory(thisObj.getPieceMoveHistory(pieceOwner + "K")),
			
			kingHasNeverMoved = kingMoveCnt == 0,
			
			kingSideRookMoveCnt = getMoveCntFromHistory(thisObj.getPieceMoveHistory(pieceOwner + "Rh")),
			
			kingsideRookHasNeverMoved = kingSideRookMoveCnt == 0,
			
			queensideRookMoveCnt = getMoveCntFromHistory(thisObj.getPieceMoveHistory(pieceOwner + "Ra")),
			
			queensideRookHasNeverMoved = queensideRookMoveCnt == 0;

		if(kingHasNeverMoved){
			if(kingsideRookHasNeverMoved){
				var sqrIDsToMoveThru = [
						kingSqrID, 
						num2algebraic(addOffsetToNumSqrID({fileOffset: 1, rankOffset: 0}, fileNumeral, rankNumeral)),
						num2algebraic(addOffsetToNumSqrID({fileOffset: 2, rankOffset: 0}, fileNumeral, rankNumeral))],
					kingDoesntMoveOutOfOrThroughCheckToCastle = !thisObj.areAnyOfTheseSqrsUnderAttackByPlayer(sqrIDsToMoveThru, opponent),
					noPiecesBetweenKingAndKingsideRook = thisObj.isSquareEmpty(sqrIDsToMoveThru[1]) && thisObj.isSquareEmpty(sqrIDsToMoveThru[2]);

				if(kingDoesntMoveOutOfOrThroughCheckToCastle && noPiecesBetweenKingAndKingsideRook){
					offsets.push({fileOffset: 2, rankOffset: 0});
				}
			}
			if(queensideRookHasNeverMoved){
				var sqrIDsToMoveThru = [
						kingSqrID, 
						num2algebraic(addOffsetToNumSqrID({fileOffset: -1, rankOffset: 0}, fileNumeral, rankNumeral)),
						num2algebraic(addOffsetToNumSqrID({fileOffset: -2, rankOffset: 0}, fileNumeral, rankNumeral))],
					kingDoesntMoveOutOfOrThroughCheckToCastle = !thisObj.areAnyOfTheseSqrsUnderAttackByPlayer(sqrIDsToMoveThru, opponent),
					noPiecesBetweenKingAndQueensideRook = thisObj.isSquareEmpty(sqrIDsToMoveThru[1]) && thisObj.isSquareEmpty(sqrIDsToMoveThru[2]);

				if(kingDoesntMoveOutOfOrThroughCheckToCastle && noPiecesBetweenKingAndQueensideRook){
					offsets.push({fileOffset: -2, rankOffset: 0});
				}
			}
		}
	}

	var pieceType = thisObj.getPieceType(pieceID);
	switch(pieceType){
		case "K":
			for(var fileOffset = fileNumeral > 1 ? -1 : 0; fileOffset <= (fileNumeral < 8 ? 1 : 0); fileOffset++){
				for(var rankOffset = rankNumeral > 1 ? -1 : 0; rankOffset <= (rankNumeral < 8 ? 1 : 0); rankOffset++){
					if(fileOffset == 0 && rankOffset == 0) continue;
					offsets.push({fileOffset: fileOffset, rankOffset: rankOffset});
				}
			}

			// Add castling offsets
			addCastlingOffsets.call(this, offsets);
		break;
		case "Q":
			addStrafeOffsets(offsets);
			addStrafeOffsets(offsets, true);
		break;
		case "B":
			addStrafeOffsets(offsets, true);
		break;
		case "N":
			fileNumeral > 1 && rankNumeral < 7 ? offsets.push({fileOffset: -1, rankOffset: 2}) : 0;
			fileNumeral < 8 && rankNumeral < 7 ? offsets.push({fileOffset: 1, rankOffset: 2}) : 0;
			fileNumeral > 2 && rankNumeral < 8 ? offsets.push({fileOffset: -2, rankOffset: 1}) : 0;
			fileNumeral > 2 && rankNumeral > 1 ? offsets.push({fileOffset: -2, rankOffset: -1}) : 0;
			fileNumeral > 1 && rankNumeral > 2 ? offsets.push({fileOffset: -1, rankOffset: -2}) : 0;
			fileNumeral < 8 && rankNumeral > 2 ? offsets.push({fileOffset: 1, rankOffset: -2}) : 0;
			fileNumeral < 7 && rankNumeral < 8 ? offsets.push({fileOffset: 2, rankOffset: 1}) : 0;
			fileNumeral < 7 && rankNumeral > 1 ? offsets.push({fileOffset: 2, rankOffset: -1}) : 0;
		break;
		case "R":
			addStrafeOffsets(offsets);
		break;
		case "P":
			if(action == "MOVE"){
				var oneSqrForward = {fileOffset: 0, rankOffset: pieceOwner == "W" ? 1 : -1};
				if(isValidOffset(oneSqrForward) && isSqrAtOffsetEmpty(oneSqrForward)){
					offsets.push(oneSqrForward);
					var twoSqrsForward = {fileOffset: 0, rankOffset: pieceOwner == "W" ? 2 : -2};
					if(rankNumeral == (pieceOwner == "W" ? 2 : 7) && isValidOffset(twoSqrsForward) && isSqrAtOffsetEmpty(twoSqrsForward)){
						offsets.push(twoSqrsForward);
					}
				}
			}
			// Add attack moves & en passant attack moves
			var attackOffsets = pieceOwner == "W" ? 
				[{fileOffset: -1, rankOffset: 1}, {fileOffset: 1, rankOffset: 1}] :
				[{fileOffset: -1, rankOffset: -1}, {fileOffset: 1, rankOffset: -1}];
			R.forEach(function(attackOffset){
				if(
					isValidOffset(attackOffset) && 
					(sqrAtOffsetContainsOpponentPiece(attackOffset) || action == "DEFEND" || isEnPassantAttack(attackOffset))
				){
					offsets.push(attackOffset);
				}
			}, attackOffsets);
		break;
	}

	var thisObj = this;
	R.forEach(function(offset){
		if(isValidOffset(offset)){
			var sqrID = num2algebraic(
					addOffsetToNumSqrID(offset, fileNumeral, rankNumeral)
				),
				sqrIsEmpty = thisObj.isSquareEmpty(sqrID),
				sqrContainsOpponentPiece = !sqrIsEmpty && thisObj.getPieceOwner(thisObj.getPieceAtSqr(sqrID)) == opponent;

			if(action == "DEFEND" || sqrIsEmpty || sqrContainsOpponentPiece){
				// If the piece is a king, make sure its not moving into a square under attack
				if(thisObj.getPieceType(pieceID) != "K" || !thisObj.areAnyOfTheseSqrsUnderAttackByPlayer([sqrID], opponent)){
					validMoves.push(sqrID);
				}
			}
		}
	}, offsets);

	return validMoves;
};

/**
 * Gets all available moves for the specified player for the current turn.
 * @param {string} player the player identifier
 */
BoardManager.prototype.getAllMovesForPlayer = function(player){
	validatePlayer(player);

	var pieces = this.getAllPiecesForPlayer(player),
		moves = [],
		thisObj = this;

	R.forEach(function(pieceID){
		var movesForPiece = thisObj.getSqrsPieceCan(pieceID);
		if(movesForPiece.length > 0){
			moves.push({"pieceID": pieceID, "moves": movesForPiece});
		}
	}, pieces);

	return moves;
};

/**
 * Returns true if the move from fromSqrID to toSqrID is valid.
 * @param {string} fromSqrID the square ID to move from
 * @param {string} toSqrID the square ID to move to
 */
BoardManager.prototype.isValidMove = function(fromSqrID, toSqrID){
	validateSqrID(fromSqrID);
	validateSqrID(toSqrID);
	if(this.isSquareEmpty(fromSqrID) || this.getPieceOwner(this.getPieceAtSqr(fromSqrID)) != this.whosTurnIsIt()){
		throw "Attempt to move from square that is empty or contains opponent piece";
	}

	var player = this.whosTurnIsIt(),
		pieceID = this.getPieceAtSqr(fromSqrID);

	if(isPlayerInCheck.call(this, player)){
		return R.contains(toSqrID, this.getSqrsPieceCan(pieceID)) && 
			isPlayerOutOfCheckAfterMove.call(this, player, pieceID, toSqrID);
	}else{
		return R.contains(toSqrID, this.getSqrsPieceCan(pieceID)) &&
			!isPlayerInCheckAfterMove.call(this, player, pieceID, toSqrID);
	}
};

/**
 * Returns true if the specified piece can move to the specified square.
 * @param {string} pieceID the piece ID of the piece
 * @param {string} toSqrID the square ID of the square
 */
BoardManager.prototype.canPieceMoveToSqr = function(pieceID, toSqrID){
	return this.isValidMove(this.getSqrWithPiece(pieceID), toSqrID);
};

/*****************************/
/* Attack discovery routines */
/*****************************/

/**
 * Get the pieces belonging to the specified player attacking the specified square.
 * @param {string} player the player identifier
 * @param {string} attackedSqrID the squard ID of the attacked square
 * @param {array} excludingPieces array of piece IDs to exclude from the assessment
 */
BoardManager.prototype.getPlayerPiecesAttackingSquare = function(player, attackedSqrID, excludingPieces){
	var excludingPieces = !excludingPieces ? [] : excludingPieces,
		thisObj = this;

	return this.board2attacker[attackedSqrID] ? 
		R.filter(function(attackingPieceID){ return thisObj.getPieceOwner(attackingPieceID) == player && excludingPieces.indexOf(attackingPieceID) == -1; }, this.board2attacker[attackedSqrID]) :
		[];
};

/**
 * Get the pieces attacking the specified piece.
 * @param {string} attackedPieceID the piece ID of the attacked piece
 * @param {array} excludingPieces array of piece IDs to exclude from the assessment
 */
BoardManager.prototype.getPiecesAttackingPiece = function(attackedPieceID, excludingPieces){
	var excludingPieces = !excludingPieces ? [] : excludingPieces,
		attackedPieceSqrID = this.getSqrWithPiece(attackedPieceID),
		attackingPlayer = this.getOtherPlayer(this.getPieceOwner(attackedPieceID)),
		attackers = this.getPlayerPiecesAttackingSquare(attackingPlayer, attackedPieceSqrID, excludingPieces);

	return attackers ? attackers : [];
};

/**
 * Returns true if any of the specified squares are under attack by the specified player.
 * @param {array} sqrs the array of square IDs to check if under attack
 * @param {string} player the player identifier of the player to check if attacking squares
 * @param {array} excludingPieces array of piece IDs to exclude from the assessment
 */
BoardManager.prototype.areAnyOfTheseSqrsUnderAttackByPlayer = function(sqrs, player, excludingPieces){
	var excludingPieces = !excludingPieces ? [] : excludingPieces,
		thisObj = this;
	(function(sqrs){
		if(sqrs.constructor !== Array) throw "Expected Array for 'sqrs' parameter";
	})(sqrs);

	return R.any(function(sqrID){
		return thisObj.getPlayerPiecesAttackingSquare(player, sqrID, excludingPieces).length != 0;
	}, sqrs);
};

/****************************/
/* Piece discovery routines */
/****************************/

/**
 * Returns the square containing the specified piece, or null if no square contains the piece.
 * @param {string} pieceID the piece ID to get the containing square of
 */
BoardManager.prototype.getSqrWithPiece = function(pieceID){
	validatePieceID(pieceID);

	return this.pieces[pieceID] ? this.pieces[pieceID].sqrID : null;
};

/**
 * Returns the piece ID occupying the specified square, or null if square is empty.
 * @param {string} sqrID the square ID to get the piece at
 */
BoardManager.prototype.getPieceAtSqr = function(sqrID){
	validateSqrID(sqrID);

	return this.board2piece[sqrID];
};

/**
 * Returns true if the square is empty.
 * @param {string} sqrID the square ID to check
 */
BoardManager.prototype.isSquareEmpty = function(sqrID){
	return this.getPieceAtSqr(sqrID) == null;
};

/**
 * Returns true if the specified square contains a piece belonging to the player.
 * @param {string} sqrID the square ID of the square to check
 */
BoardManager.prototype.squareHasPlayerPiece = function(sqrID, player){
	return !this.isSquareEmpty(sqrID) && this.getPieceOwner(this.getPieceAtSqr(sqrID)) == player; 
};

/**
 * Returns the player identifier owning the specified piece.
 * @param {string} pieceID the piece ID to get the owner of
 */
BoardManager.prototype.getPieceOwner = function(pieceID){
	validatePieceID(pieceID);

	return pieceID.charAt(0);
};

/**
 * Returns the type of the specified piece.
 * @param {string} pieceID the piece ID
 */
BoardManager.prototype.getPieceType = function(pieceID){
	validatePieceID(pieceID);

	// For promoted pawns, return the type of the promotion
	if(pieceID.charAt(1) == "P" && pieceID.charAt(3) != ""){
		return pieceID.charAt(3);
	}else{
		return pieceID.charAt(1);
	}
};

/**
 * Returns the move history of the specified piece.
 * @param {string} pieceID the piece ID
 */
BoardManager.prototype.getPieceMoveHistory = function(pieceID){
	validatePieceID(pieceID);

	return this.pieces[pieceID].moveHistory
};

/**
 * Returns the piece count for the specified player, optionally filtered by which flag: "UNCAPTURED"/"CAPTURED"/"BOTH".
 * Default is "UNCAPTURED".
 * @param {string} player the player identifier to get a piece count for
 * @param {string} which "UNCAPTURED"/"CAPTURED"/"BOTH", default is "UNCAPTURED"
 */
BoardManager.prototype.getPieceCntForPlayer = function(player, which){
	var pieces = this.getAllPiecesForPlayer(player, which),
		pieceCnt = {total: 0, queens: 0, bishops: 0, knights: 0, rooks: 0, pawns: 0},
		thisObj = this;

	R.forEach(function(pieceID){
		switch(thisObj.getPieceType(pieceID)){
			case "Q": pieceCnt.queens++; break;
			case "B": pieceCnt.bishops++; break;
			case "N": pieceCnt.knights++; break;
			case "R": pieceCnt.rooks++; break;
			case "P": pieceCnt.pawns++; break;
		}
		pieceCnt.total++;
	}, pieces);

	return pieceCnt;
};

/**
 * Returns all pieces for the specified player, optionally filtered by "which" flag ("UNCAPTURED"/"CAPTURED"/"BOTH", default
 * is "UNCAPTURED"), and an array of piece IDs/piece types to exclude.
 * @param {string} player the player identifier
 * @param {string} which "UNCAPTURED"/"CAPTURED"/"BOTH", default is "UNCAPTURED"
 * @param {array} excluding array of piece IDs to exclude
 */
BoardManager.prototype.getAllPiecesForPlayer = function(player, which, excluding){
	validatePlayer(player);
	(function validateWhichFlag(which){
		if(which){
			var validFlagValues = ["UNCAPTURED", "CAPTURED", "BOTH"];
			if(validFlagValues.indexOf(which) == -1){
				throw "Invalid value for 'which' parameter";
			}
		}
	})(which);

	var pieces = [],
		which = !which ? "UNCAPTURED" : which,
		excluding = !excluding ? [] : excluding,
		thisObj = this;

	R.forEachObjIndexed(function(pieceData, pieceID){
		if(
			thisObj.getPieceOwner(pieceID) == player && 
			((which == "UNCAPTURED" && pieceData.sqrID != null) || (which == "CAPTURED" && pieceData.sqrID == null) || which == "BOTH") &&
			excluding.indexOf(pieceID) == -1 && excluding.indexOf(thisObj.getPieceType(pieceID)) == -1
		){
			pieces.push(pieceID);
		}
	}, this.pieces);

	return pieces;
};

/*******************/
/* Player routines */
/*******************/

/**
 * Returns the other player identifier given the specified player identifier.
 */
BoardManager.prototype.getOtherPlayer = function(player){
	validatePlayer(player);

	return player == "W" ? "B" : "W";
};

/*****************/
/* Turn routines */
/*****************/

/**
 * Returns the player identifier whos turn is now.
 */
BoardManager.prototype.whosTurnIsIt = function(){
	return this.turnID % 2 == 0 ? "B" : "W";
};

/**
 * Returns the player identifier whos turn is next.
 */
BoardManager.prototype.whosTurnIsNext = function(){
	return this.turnID % 2 == 0 ? "W" : "B" ;
};

/************************/
/* Board state routines */
/************************/

/**
 * Returns a copy of the current board state.
 */
BoardManager.prototype.saveBoardState = function(){
	return {
		"board2piece": R.clone(this.board2piece),
		"board2attacker": R.clone(this.board2attacker),
		"pieces": R.clone(this.pieces),
		"turnID": this.turnID
	};
};

/**
 * Overwrites the current board state with the passed copy.
 * @param {object} boardState a copy of the board state 
 */
BoardManager.prototype.loadBoardState = function(boardState){
	// Do some validation of the passed in board state for good measure
	var expectedStateKeys = ["board2piece", "board2attacker", "pieces", "turnID"];
	R.forEachObjIndexed(function(state, stateKey, stateContainer){
		if(expectedStateKeys.indexOf(stateKey) == -1){
			throw "Invalid state key encountered";
		}else{
			expectedStateKeys = R.remove(expectedStateKeys.indexOf(stateKey), 1, expectedStateKeys);
		}
		if(
			(stateKey != "turnID" && typeof state != "object") || 
			(stateKey == "turnID" && !Number.isInteger(state))
		){
			throw "Invalid state value encountered";
		}
	}, boardState);
	if(expectedStateKeys.length != 0){
		throw "Missing expected state keys: " + JSON.stringify(expectedStateKeys);
	}

	this.board2piece = R.clone(boardState.board2piece);
	this.board2attacker = R.clone(boardState.board2attacker);
	this.pieces = R.clone(boardState.pieces);
	this.turnID = boardState.turnID;
};

module.exports = BoardManager;


/********************/
/********************/
/* Private routines */
/********************/
/********************/

/******************/
/* Piece routines */
/******************/

/**
 * Removes the specified piece from the board.
 * @param {string} pieceID the piece ID
 */
function removePieceFromBoard(pieceID){
	validatePieceID(pieceID);
	(function(){
		if(this.getSqrWithPiece(pieceID) == null) throw "Piece not found on board";
	}).call(this);

	var sqrID = this.getSqrWithPiece(pieceID);

	// Update board2piece and pieces maps
	delete this.board2piece[sqrID];
	this.pieces[pieceID].sqrID = null;

	updateAttackDataForPiece.call(this, pieceID);
};

function addPieceToBoardAtSqr(pieceID, sqrID){
	validatePieceID(pieceID);
	(function(){
		if(this.getSqrWithPiece(pieceID) != null) throw "Piece already found on board";
	}).call(this);

	// Update board2piece and pieces maps
	this.board2piece[sqrID] = pieceID;
	this.pieces[pieceID].sqrID = sqrID;

	updateAttackDataForPiece.call(this, pieceID);
}

/*******************/
/* Square routines */
/*******************/

/**
 * Returns the file string of specified square ("a" - "h"). If numeric is true,
 * returns the file asNumeral (1 (a) - 8 (h)) as an integer. Default is false.
 */
function getSqrFile(sqrID, asNumeral){
	validateSqrID(sqrID);
	(function(asNumeral){
		if(typeof asNumeral != "boolean" && typeof asNumeral != "undefined"){
			throw "Expected boolean or undefined for 'asNumeral' parameter";
		}
	})(asNumeral);

	var asNumeral = !asNumeral ? false : asNumeral;

	return asNumeral ? sqrID.charCodeAt(0) - 96 : sqrID.charAt(0);
}

/**
 * Returns the file identifier ("a" - "h") from its correspoding numeral 1-8.
 * @param {integer} fileNumeral the file numeral
 */
function getFileFromNumeral(fileNumeral){
	(function(fileNumeral){
		if(!Number.isInteger(fileNumeral)) throw "Expected integer for 'fileNumeral' parameter";
		if(fileNumeral < 1 || fileNumeral > 8) throw "File numeral out of range";
	})(fileNumeral);

	return String.fromCharCode(96 + fileNumeral);
}

/**
 * Returns the string rank of the specified square ("1"-"8"). If asNumeral is true,
 * returns the rank as an integer. Default is false.
 */
function getSqrRank(sqrID, asNumeral){
	validateSqrID(sqrID);
	(function(asNumeral){
		if(typeof asNumeral != "boolean" && typeof asNumeral != "undefined"){
			throw "Expected boolean or undefined for 'asNumeral' parameter";
		}
	})(asNumeral);

	var asNumeral = !asNumeral ? false : asNumeral;

	return asNumeral ? parseInt(sqrID.charAt(1)) : sqrID.charAt(1);
}

/**
 * Maps a square ID to a coordinate pair, with the origin being at the bottom-left hand-side of the board.
 * Examples:
 * a5 => {x: 1, y: 5}
 * c7 => {x: 3, y: 7}
 * @param {string} sqrID the square ID
 */
function sqrID2coord(sqrID){
	return {x: getSqrFile(sqrID, true), y: getSqrRank(sqrID, true)};
}

/**
 * Maps a coordinate pair to a square ID, with the origin being at the bottom-left hand-side of the board.
 * Examples:
 * {x: 1, y: 5} => a5
 * {x: 3, y: 7} => c7
 * @param {object} coord {x: <x coord representing file>, y: <y coord representing row>}
 */
function coord2sqrID(coord){
	return getFileFromNumeral(coord.x) + coord.y;
}

/**
 * Get the squares inbetween (not inclusive) the specified squares. Assumes incoming squares are on the same rank, file or diagonal.
 * @param {string} sqr1ID the square ID of square 1
 * @param {string} sqr2ID the square ID of square 2
 */
function getSqrsInbetweenSqrs(sqr1ID, sqr2ID){
	validateSqrID(sqr1ID);
	validateSqrID(sqr2ID);

	var inbetweenSqrs = [],
		sqr1Coord = sqrID2coord(sqr1ID),
		sqr2Coord = sqrID2coord(sqr2ID),
		// Find the pseudo-magnitude and pseudo-unit vector from 1 to 2 normalized to square deltas
		pseudoMagnitude = Math.max(Math.abs(sqr2Coord.x - sqr1Coord.x), Math.abs(sqr2Coord.y - sqr1Coord.y)),
		pseudoUnitVecFrom1to2 = pseudoMagnitude > 0 ? {x: (sqr2Coord.x - sqr1Coord.x) / pseudoMagnitude, y: (sqr2Coord.y - sqr1Coord.y) / pseudoMagnitude} : {x: 0, y: 0};

	for(var multiplier = 1; multiplier < pseudoMagnitude; multiplier++){
		inbetweenSqrs.push(
			coord2sqrID({x: sqr1Coord.x + pseudoUnitVecFrom1to2.x * multiplier, y: sqr1Coord.y + pseudoUnitVecFrom1to2.y * multiplier})
		);
	}

	return inbetweenSqrs;
}

/*****************************/
/* Check evaluation routines */
/*****************************/

/**
 * Returns true if the player is in check.
 * @param {string} player the player identifier
 */
function isPlayerInCheck(player){
	validatePlayer(player);

	var kingSqrID = this.getSqrWithPiece(player + "K"),
		opponent = this.getOtherPlayer(player);

	return this.areAnyOfTheseSqrsUnderAttackByPlayer([kingSqrID], opponent);
}

/**
 * Returns true if the player is out of check after the specified move, false otherwise.
 * @param {string} player the player identifier
 * @param {string} pieceID the piece ID of the piece to move
 * @param {string} toSqrID the square ID of the square to move the piece to
 */
function isPlayerOutOfCheckAfterMove(player, pieceID, toSqrID){
	// Save the board state
	var boardState = this.saveBoardState(),
		playerIsOutOfCheckAfterMove = false;

	// Make the move, and set speculating flag to yes, so we suppress console output and events
	this.movePieceToSqr(pieceID, toSqrID, true);

	// Is player out of check after the move?
	if(!isPlayerInCheck.call(this, player)){
		playerIsOutOfCheckAfterMove = true;
	}

	// Restore board state
	this.loadBoardState(boardState);

	return playerIsOutOfCheckAfterMove;
}

/**
 * Returns true if the player is in check after the specified move, false otherwise.
 * @param {string} player the player identifier
 * @param {string} pieceID the piece ID of the piece to move
 * @param {string} toSqrID the square ID of the square to move the piece to
 */
function isPlayerInCheckAfterMove(player, pieceID, toSqrID){
	// Save the board state
	var boardState = this.saveBoardState(),
		playerIsCheckAfterMove = false;

	// Make the move, and set speculating flag to yes, so we suppress console output and events
	this.movePieceToSqr(pieceID, toSqrID, true);

	// Is player in check after the move?
	if(isPlayerInCheck.call(this, player)){
		playerIsCheckAfterMove = true;
	}

	// Restore board state
	this.loadBoardState(boardState);

	return playerIsCheckAfterMove;
}

/**
 * Returns true if a checkmate has occurred.
 */
function hasCheckmateOccurred(){
	var playerWhoMovedLast = this.whosTurnIsIt(),

		playerMovingNext = this.whosTurnIsNext(),

		kingUnderAttackPieceID = playerMovingNext + "K",

		kingUnderAttackSqrID = this.getSqrWithPiece(kingUnderAttackPieceID),

		kingUnderAttackCantMoveOutOfCheck = this.getSqrsPieceCan(kingUnderAttackPieceID).length == 0,

		pieceAttackingKingPieceID = this.getPiecesAttackingPiece(kingUnderAttackPieceID)[0],

		pieceAttackingKingSqrID = this.getSqrWithPiece(pieceAttackingKingPieceID),

		pieceAttackingKingType = this.getPieceType(pieceAttackingKingPieceID),

		piecesAttackingPieceAttackingKing = this.getPiecesAttackingPiece(pieceAttackingKingPieceID),

		piecesDefendingPieceAttackingKing = this.getPlayerPiecesAttackingSquare(playerWhoMovedLast, pieceAttackingKingSqrID),

		pieceAttackingKingCantBeCaptured = piecesAttackingPieceAttackingKing.length == 0 ||

			(
				piecesAttackingPieceAttackingKing.length == 1 && 
				piecesAttackingPieceAttackingKing[0] == kingUnderAttackPieceID &&
			 	piecesDefendingPieceAttackingKing.length > 0
			),

		pieceAttackingKingCantBeBlocked = 

			(pieceAttackingKingType != "Q" && pieceAttackingKingType != "B" && pieceAttackingKingType != "R") || 
			
			!this.areAnyOfTheseSqrsUnderAttackByPlayer(getSqrsInbetweenSqrs(kingUnderAttackSqrID, pieceAttackingKingSqrID), playerMovingNext, [kingUnderAttackPieceID]);

	return kingUnderAttackCantMoveOutOfCheck && pieceAttackingKingCantBeCaptured && pieceAttackingKingCantBeBlocked; 
}

/**
 * Returns true if a stalemate has occurred.
 */
function hasStalemateOccured(){
	var playerWhoMovedLast = this.whosTurnIsIt(),

		playerMovingNext = this.whosTurnIsNext(),

		playerMovingNextNotInCheckAndHasNoValidMoves = 

			!isPlayerInCheck.call(this, playerMovingNext) && this.getAllMovesForPlayer(playerMovingNext).length == 0,

		playerWhoMovedLastPieceCnt = this.getPieceCntForPlayer(playerWhoMovedLast),

		playerMovingNextPieceCnt = this.getPieceCntForPlayer(playerMovingNext),

		onlyOneKnightOrOneBishopLeftForPlayerWhoMovedLast = 

			(playerWhoMovedLastPieceCnt.total == 2 && playerWhoMovedLastPieceCnt.knights == 1) ||
			(playerWhoMovedLastPieceCnt.total == 2 && playerWhoMovedLastPieceCnt.bishops == 1),

		onlyOneKnightOrOneBishopLeftForPlayerMovingNext = 

			(playerMovingNextPieceCnt.total == 2 && playerMovingNextPieceCnt.knights == 1) ||
			(playerMovingNextPieceCnt.total == 2 && playerMovingNextPieceCnt.bishops == 1);

	return (onlyOneKnightOrOneBishopLeftForPlayerWhoMovedLast && onlyOneKnightOrOneBishopLeftForPlayerMovingNext) || 
		playerMovingNextNotInCheckAndHasNoValidMoves;
}

/***************************/
/* Pawn promotion routines */
/***************************/

/**
 * Returns true if the pawn with the specified piece ID should be promoted.
 * @param {string} pieceID the piece ID of the pawn to check for promotion eligibility
 */
function shouldPawnBePromoted(pieceID){
	validatePieceID(pieceID);

	var owner = this.getPieceOwner(pieceID),
		sqrID = this.getSqrWithPiece(pieceID),
		sqrRank = getSqrRank(sqrID);

	return (owner == "W" && sqrRank == 8) || (owner == "B" && sqrRank == 1);
}

/**
 * Promote a pawn. Appends the promotion to the end of its piece ID. 
 * @param {string} pieceID the piece ID of the pawn to promote
 * @param {boolean} speculating true, to signify that this is a speculative promotion, not an actual promotion, and to suppress console
 * 							    logging and events.
 */
function promotePawn(pieceID, speculating){
	validatePieceID(pieceID);

	var owner = this.getPieceOwner(pieceID),
		sqrID = this.getSqrWithPiece(pieceID),
		choice = "",
		limit = 0;

	if(!speculating && owner == settings.humanPlayer){
		var promotions = ["Q", "N", "R", "B"];

		while(promotions.indexOf(choice) == -1){
			choice = prompt("Which piece would you like to promote your pawn at " + sqrID + " to? Q/N/R/B");
			choice = choice.trim();
			if(promotions.indexOf(choice == -1)) console.log("Invalid choice.");
			limit++;
			if(limit > 1000){
				throw "Infinite loop prevented";
			}
		}
	}else{
		choice = "Q";
	}

	var promotedPieceID = pieceID + choice, 
		pieceData = this.pieces[pieceID];

	// Update pieces and board2piece with new promoted piece ID
	delete this.pieces[pieceID];
	this.board2piece[sqrID] = promotedPieceID;
	this.pieces[promotedPieceID] = pieceData;

	// Remove old attack data for pawn
	updateAttackDataForPiece.call(this, pieceID);
	// Add new attack data for promoted piece
	updateAttackDataForPiece.call(this, promotedPieceID);

	if(!speculating){
		console.log("Pawn at " + sqrID + " promoted to " + choice);
	}
}

/******************************/
/* Board attack data routines */
/******************************/

/**
 * Updates the attack data stored in board2attacker for the specified piece.
 * @param {string} pieceID the piece ID of the piece to update attack data for
 */
function updateAttackDataForPiece(pieceID){
	validatePieceID(pieceID);

	var sqrID = this.getSqrWithPiece(pieceID),
		sqrsUnderAttackByPiece = sqrID ? this.getSqrsPieceCan(pieceID, "DEFEND") : [],
		thisObj = this;

	// Remove old attack data for piece from board2attacker
	R.forEachObjIndexed(function(attackers, sqrID, board2attacker){
		board2attacker[sqrID] = R.filter(function(attacker){ return attacker != pieceID; }, board2attacker[sqrID]);
		// Remove square from hash if it is no longer under attack
		if(board2attacker[sqrID].length == 0){
			delete board2attacker[sqrID];
		}
	}, this.board2attacker);

	// Add new attack data for piece to board2attacker
	R.forEach(function(sqrID){
		// Is there no attack data for this square?
		if(!thisObj.board2attacker[sqrID]){
			thisObj.board2attacker[sqrID] = [];
			thisObj.board2attacker[sqrID].push(pieceID);
		// Is this square missing attack data for this piece?
		}else if(thisObj.board2attacker[sqrID].indexOf(pieceID) == -1){
			thisObj.board2attacker[sqrID].push(pieceID);
		}
	}, sqrsUnderAttackByPiece);
}

/**
 * Updates the attack data stored in board2attacker for the specified pieces.
 * @param {array} pieces the array of pieces to update attack data for
 */
function updateAttackDataForPieces(pieces){
	var thisObj = this;

	R.forEach(function(pieceID){
		updateAttackDataForPiece.call(thisObj, pieceID);
	}, pieces);
}

/***************************/
/* Initialization routines */
/***************************/

/**
 * Initializes the board2attacker map, which maps a square ID to an array of piece IDs attacking that square.
 */
function initBoard2Attacker(){
	var thisObj = this;
	R.forEachObjIndexed(function(startingSqrID, startingPieceID){
		updateAttackDataForPiece.call(thisObj, startingPieceID);
	}, STARTING_SQRS);
}

/**
 * Initializes the pieces map, which maps a piece ID to data for that piece.
 */
function initPieces(){
	var thisObj = this;
	R.forEachObjIndexed(function(startingSqrID, startingPieceID){
		thisObj.pieces[startingPieceID] = {
				sqrID: startingSqrID,
				moveHistory: {}
			};
	}, STARTING_SQRS);
}

/**
 * Initializes the board2piece map, which maps a square ID to its occupying piece ID.
 */
function initBoard2Piece(){
	var thisObj = this;
	R.forEachObjIndexed(function(startingSqrID, startingPieceID){
		thisObj.board2piece[startingSqrID] = startingPieceID;
	}, STARTING_SQRS);
}

/***********************/
/* Validation routines */
/***********************/

/**
 * Validates a given piece ID.
 * @param {string} pieceID the piece ID to validate
 */
function validatePieceID(pieceID){
	var pieces = ["K", "Q", "Bc", "Bf", "Nb", "Ng", "Ra", "Rh", "Pa", "Pb", "Pc", "Pd", "Pe", "Pf", "Pg", "Ph"],
		promotions = ["Q", "B", "N", "R"],
		players = ["W", "B"];

	if(
		typeof pieceID != "string" || 
		// Verify ID length
		(pieceID.length  < 2 || pieceID.length > 4) ||
		// Verify player designator
		players.indexOf(pieceID.charAt(0)) == -1 ||
		// Verify piece designator for non-promoted pawns
		(pieceID.length < 4 && pieces.indexOf(pieceID.substr(1)) == -1) ||
		// Verify promoted pawn designator
		(pieceID.length == 4 && pieceID.charAt(1) != "P") ||
		(pieceID.length == 4 && pieces.indexOf(pieceID.substr(1, 2)) == -1) ||
		(pieceID.length == 4 && promotions.indexOf(pieceID.substr(-1)) == -1)
	){
		throw "Invalid piece ID";
	}
}

/**
 * Validates a given square ID.
 * @param {string} sqrID the square ID to validate
 */
function validateSqrID(sqrID){
	if(
		typeof sqrID != "string" || 
		sqrID.length != 2 || 
		(sqrID.charCodeAt(0) < 97 || sqrID.charCodeAt(0) > 104) ||
		(isNaN(parseInt(sqrID.charAt(1))) || parseInt(sqrID.charAt(1)) < 1 || parseInt(sqrID.charAt(1)) > 8)
	){
		throw "Invalid square ID";
	}
}

/**
 * Validates a given player identifier.
 * @param {string} player the player identifier to validate
 */
function validatePlayer(player){
	if(player != "W" && player != "B"){
		throw "Invalid player";
	}
}