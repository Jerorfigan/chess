var R = require("../../lib/ramda.min.js");
var gameEvent = require("../game_event.js");
var settings = require("../settings.js");

var BoardManager = function(){	
	// Constants
	this.pieceStartPos = {
		WK: "e1", WQ: "d1", WBc: "c1", WBf: "f1",  WNb: "b1", WNg: "g1", WRa: "a1", WRh: "h1", WPa: "a2", WPb: "b2", WPc: "c2", WPd: "d2", WPe: "e2", WPf: "f2", WPg: "g2", WPh: "h2",
		BK: "e8", BQ: "d8", BBc: "c8", BBf: "f8",  BNb: "b8", BNg: "g8", BRa: "a8", BRh: "h8", BPa: "a7", BPb: "b7", BPc: "c7", BPd: "d7", BPe: "e7", BPf: "f7", BPg: "g7", BPh: "h7"
	};
	this.pieces = ["K", "Q", "Bc", "Bf", "Nb", "Ng", "Ra", "Rh", "Pa", "Pb", "Pc", "Pd", "Pe", "Pf", "Pg", "Ph"];
	this.players = ["W", "B"];
	
	// Init maps
	this.pieceDataByID = {};
	this.board2piece = {};
	this.board2attacker = {};
	initPieceDataByID.call(this);
	initBoard2Piece.call(this);

	this.turnID = 1;

	gameEvent.fire("BoardSetup", {pieces: this.board2piece});
};

BoardManager.prototype.getCurrentTurn = function(){
	return this.turnID;
};

BoardManager.prototype.getMovesFrom = function(sqrID){
	return getValidMoves.call(this, sqrID);
};

BoardManager.prototype.isValidMove = function(fromSqrID, toSqrID){
	var player = this.board2piece[fromSqrID].charAt(0);
	if(isPlayerInCheck.call(this, player)){
		return R.contains(toSqrID, getValidMoves.call(this, fromSqrID)) && 
			isPlayerOutOfCheckAfterMove.call(this, player, fromSqrID, toSqrID);
	}else{
		return R.contains(toSqrID, getValidMoves.call(this, fromSqrID));
	}
};

BoardManager.prototype.movePiece = function(sourceSqrID, targetSqrID){
	if(!this.board2piece[sourceSqrID]) throw "Attempt to move piece from empty square";

	console.log("Moving " + this.board2piece[sourceSqrID] + " from " + sourceSqrID + " to " + targetSqrID);

	// Update board2attacker, noting locations no longer under attack by this piece from old sqr
	removeOldAttackDataForMovingPiece.call(this, sourceSqrID);

	// Update board2piece map
	var movingPieceID = this.board2piece[sourceSqrID];
	delete this.board2piece[sourceSqrID];
	if(this.board2piece[targetSqrID]){
		gameEvent.fire("PieceCaptured", {capturedPieceID: this.board2piece[targetSqrID], sqrID: targetSqrID});
	// Check if we performed an en passant capture
	}else if(movingPieceID.charAt(1) == "P" && sourceSqrID.charAt(0) != targetSqrID.charAt(0)){
		var targetOfEnPassantAttackSqrID = movingPieceID.charAt(0) == "W" ? 
			targetSqrID.charAt(0) + (parseInt(targetSqrID.charAt(1)) - 1) :
			targetSqrID.charAt(0) + (parseInt(targetSqrID.charAt(1)) + 1);

		gameEvent.fire("PieceCaptured", {capturedPieceID: this.board2piece[targetOfEnPassantAttackSqrID], sqrID: targetOfEnPassantAttackSqrID});
		this.board2piece[targetOfEnPassantAttackSqrID] = null;
	// Check if we castled
	}else if(movingPieceID.charAt(1) == "K" && Math.abs(sourceSqrID.charCodeAt(0) - targetSqrID.charCodeAt(0)) == 2){
		var player = movingPieceID.charAt(0),
			castleKingside = sourceSqrID.charCodeAt(0) - targetSqrID.charCodeAt(0) < 0,
			rookID = castleKingside ? player + "Rh" : player + "Ra",
			rookSqrID = castleKingside ? this.pieceDataByID[player + "Rh"].file + this.pieceDataByID[player + "Rh"].rank :
				this.pieceDataByID[player + "Ra"].file + this.pieceDataByID[player + "Ra"].rank,
			sqrToPlaceRook = castleKingside ? String.fromCharCode(targetSqrID.charCodeAt(0) - 1) + targetSqrID.charAt(1) :
				String.fromCharCode(targetSqrID.charCodeAt(0) + 1) + targetSqrID.charAt(1);

		delete this.board2piece[rookSqrID];
		this.board2piece[sqrToPlaceRook] = rookID;
		console.log(player + " castled " + (castleKingside ? "kingside." : "queenside."));
	}
	this.board2piece[targetSqrID] = movingPieceID;
	// Update pieceDataByID
	var movingPiece = this.pieceDataByID[movingPieceID];
	movingPiece.rank = targetSqrID.charAt(1);
	movingPiece.file = targetSqrID.charAt(0);
	movingPiece.moveHistory[this.turnID++] = targetSqrID;

	// Update board2attacker, noting new locations now under attack by this piece from new sqr
	addNewAttackDataForMovingPiece.call(this, targetSqrID);

	gameEvent.fire("BoardUpdated", {pieces: this.board2piece});

	var opponentPlayer = movingPieceID.charAt(0) == "W" ? "B" : "W";
	if(isPlayerInCheck.call(this, opponentPlayer) && hasCheckmateOccurred.call(this, targetSqrID)){
		var winningPlayer = movingPieceID.charAt(0);
		gameEvent.fire("Checkmate", {winningPlayer: winningPlayer});
		console.log("Checkmate. " + winningPlayer + " wins.");
	}else if(hasStalemateOccured.call(this)){
		gameEvent.fire("Stalemate");
		console.log("Stalemate.");
	}else if(shouldPawnBePromoted.call(this, sourceSqrID)){
		promotePawnAtSqr.call(this, sourceSqrID);
		conole.log("Pawn promoted");
	}
};

BoardManager.prototype.squareHasPlayerPiece = function(sqrID){
	return !!this.board2piece[sqrID] && this.board2piece[sqrID].charAt(0) == settings.playerColor; 
};

module.exports = BoardManager;

function isPlayerInCheck(player){
	var kingSqrID = this.pieceDataByID[player + "K"].file + this.pieceDataByID[player + "K"].rank;
	return !!this.board2attacker[kingSqrID];
}

function isPlayerOutOfCheckAfterMove(player, fromSqrID, toSqrID){
	var movingPiece = this.board2piece[fromSqrID],
		kingSqrID = this.pieceDataByID[player + "K"].file + this.pieceDataByID[player + "K"].rank,
		attackingPieceID = this.board2attacker[kingSqrID][0],
		attackerType = attackingPieceID.charAt(1),
		attackingPieceSqrID = this.pieceDataByID[attackingPieceID].file + this.pieceDataByID[attackingPieceID].rank,
		kingCanMoveOutOfCheck = movingPiece.charAt(1) == "K" && !this.board2attacker[toSqrID],
		pieceAttackingKingIsCaptured = toSqrID == attackingPieceSqrID,
		attackersPathCanBeBlocked =	
			(attackerType == "Q" || attackerType == "B" || attackerType == "R") && 
			movingPieceID.charAt(1) != "K" &&
			getSqrsInbetweenSqrs(kingSqrID, attackingPieceSqrID).indexOf(toSqrID) != -1;

	return kingCanMoveOutOfCheck || pieceAttackingKingIsCaptured || attackersPathCanBeBlocked;
}

function getSqrsInbetweenSqrs(sqr1, sqr2){
	var inbetweenSqrs = [],
		sqr1file = sqr1.charAt(0),
		sqr1rank = sqr1.charAt(1),
		sqr2file = sqr2.charAt(0),
		sqr2rank = sqr2.charAt(1);

	if(sqr1file == sqr2file){
		for(var rank = sqr1rank < sqr2rank ? sqr1rank : sqr2rank; rank < (sqr1rank < sqr2rank ? sqr2rank : sqr1rank); rank++){
			inbetweenSqrs.push(sqr1file + rank);
		}
	}else if(sqr1rank == sqr2rank){
		for(var file = sqr1file < sqr2file ? sqr1file : sqr2file; file < (sqr1file < sqr2file ? sqr2file : sqr1file); file++){
			inbetweenSqrs.push(file + sqr1rank);
		}
	}else{
		var fileCode = sqr1file < sqr2file ? sqr1file.charCodeAt(0) + 1 : sqr2file.charCodeAt(0) + 1,
			rankDelta = sqr1file < sqr2file ? (sqr1rank > sqr2rank ? -1 : 1) : (sqr1rank > sqr2rank ? 1 : -1),
			rank = sqr1file < sqr2file ? parseInt(sqr1rank) + rankDelta: parseInt(sqr2rank) + rankDelta;
		while(
			(String.fromCharCode(fileCode) + rank) != sqr2 &&  
			(String.fromCharCode(fileCode) + rank) != sqr1 
		){
			inbetweenSqrs.push(String.fromCharCode(fileCode) + rank);
			fileCode++;
			rank = rank + rankDelta;
		}
	}

	return inbetweenSqrs;
}

function hasCheckmateOccurred(sqrIDOfLastMove){
	var playerWhoMovedLast = this.board2piece[sqrIDOfLastMove].charAt(0),
		opponentPlayer = playerWhoMovedLast == "W" ? "B" : "W",
		opponentKingSqrID = this.pieceDataByID[opponentPlayer + "K"].file + this.pieceDataByID[opponentPlayer + "K"].rank,
		attackingPieceID = this.board2attacker[opponentKingSqrID][0],
		attackerType = attackingPieceID.charAt(1),
		attackingPieceSqrID = this.pieceDataByID[attackingPieceID].file + this.pieceDataByID[attackingPieceID].rank,
		opponentKingCantMoveOutOfCheck = getValidMoves.call(this, opponentKingSqrID).length == 0,
		attackingPieceCantBeCaptured = !this.board2attacker[attackingPieceSqrID] || R.filter(function(pieceID){ return pieceID.charAt(0) == opponentPlayer; }, this.board2attacker[attackingPieceSqrID]).length == 0,
		attackersPathCanBeBlocked = (attackerType == "Q" || attackerType == "B" || attackerType == "R") && 
			R.filter(
				function(sqrID){ 
					return R.filter(
						function(pieceID){ 
							return pieceID.charAt(0) == opponentPlayer; 
						}, 
						this.board2attacker[sqrID]).length != 0; 
				}, 
				getSqrsInbetweenSqrs(opponentKingSqrID, attackingPieceSqrID)
			).length != 0;

	return opponentKingCantMoveOutOfCheck && attackingPieceCantBeCaptured && !attackersPathCanBeBlocked; 
}

function hasStalemateOccured(){
	// TODO
	return false;
}

function shouldPawnBePromoted(){
	// TODO
	return false;
}

function promotePawnAtSqr(sqrID){
	// TODO
}

function removeOldAttackDataForMovingPiece(oldSqrID){
	var movingPieceID = this.board2piece[oldSqrID],
		oldSqrsUnderAttackByMovingPiece = getValidMoves.call(this, oldSqrID, true),
		thisObj = this;
	R.forEach(function(sqrID){
		if(thisObj.board2attacker[sqrID]){
			thisObj.board2attacker[sqrID] = R.filter(function(pieceID){ return pieceID != movingPieceID; }, thisObj.board2attacker[sqrID]);
			// Remove sqr from hash if it is no longer under attack
			if(thisObj.board2attacker[sqrID].length == 0){
				delete thisObj.board2attacker[sqrID];
			}
		}
	}, oldSqrsUnderAttackByMovingPiece);
}

function addNewAttackDataForMovingPiece(newSqrID){
	var movingPieceID = this.board2piece[newSqrID],
		newSqrsUnderAttackByMovingPiece = getValidMoves.call(this, newSqrID, true),
		thisObj = this;
	R.forEach(function(sqrID){
		if(!thisObj.board2attacker[sqrID]){
			thisObj.board2attacker[sqrID] = [];
			thisObj.board2attacker[sqrID].push(movingPieceID);
		}else if(thisObj.board2attacker[sqrID].indexOf(movingPieceID) == -1){
			thisObj.board2attacker[sqrID].push(movingPieceID);
		}
	}, newSqrsUnderAttackByMovingPiece);
}

function initBoard2Attacker(){
	// Record which squares are under attack by any and all pieces on the board in board2attacker
	var thisObj = this;
	R.forEachObjIndexed(function(sqrID, pieceID){
		var sqrsUnderAttackByPiece = getValidMoves.call(this, sqrID, true);
		R.forEach(function(sqrID){
			if(!thisObj.board2attacker[sqrID]){
				thisObj.board2attacker[sqrID] = [];
			}
			thisObj.board2attacker[sqrID].push(pieceID);
		}, sqrsUnderAttackByPiece);
	}, this.pieceStartPos);
}

function initPieceDataByID(){
	var thisObj = this;
	R.forEach(function(player){
		R.forEach(function(piece){
			var pieceID = player + piece;
			thisObj.pieceDataByID[pieceID] = {
				rank: thisObj.pieceStartPos[pieceID].charAt(1),
				file: thisObj.pieceStartPos[pieceID].charAt(0),
				pieceAbbrev: piece.charAt(0),
				moveHistory: {}
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

function getValidMoves(sqrID, onlyCountSqrsUnderAttackForPawns){
	var pieceID = this.board2piece[sqrID],
		validMoves = [],
		offsets = [],
		board2piece = this.board2piece,
		board2attacker = this.board2attacker,
		pieceDataByID = this.pieceDataByID,
		fileNumeral = sqrID.charCodeAt(0) - 96, // 1 thru 8 corresponding to a thru h
		rankNumeral = parseInt(sqrID.charAt(1)),
		turnID = this.turnID,
		pieceStartPos = this.pieceStartPos;

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
			while(
				(fileOffset + fileNumeral) >= 1 &&
				(fileOffset + fileNumeral) <= 8 && 
				(rankOffset + rankNumeral)   >= 1 &&
				(rankOffset + rankNumeral)   <= 8
			)
			{
				var offset = {fileOffset: fileOffset, rankOffset: rankOffset};
				offsets.push(offset);
				// If board sqr is occupied, then we are blocked from moving further in this
				// direction
				if(isSqrAtOffsetEmpty(offset)){
					dir == "NW" || dir == "SW" || dir == "W" ? fileOffset-- : dir != "N" && dir != "S" ? fileOffset++ : 0;
					dir == "NW" || dir == "NE" || dir == "N" ? rankOffset++ : dir != "W" && dir != "E" ? rankOffset-- : 0;
				}else{
					break;
				}
			}
		}
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
		return !board2piece[
			num2algebraic(
				addOffsetToNumSqrID(offset, fileNumeral, rankNumeral)
			)
		];
	}

	function sqrAtOffsetContainsOpponentPiece(offset){
		var sqrID = num2algebraic(
			addOffsetToNumSqrID(offset, fileNumeral, rankNumeral)
		);
		return !!board2piece[sqrID] && board2piece[sqrID].charAt(0) != settings.playerColor;
	}

	function isEnPassantAttack(offset, player){
		var sqrIDForEnPassantAttack = offset.fileOffset == -1 ? 
				num2algebraic(addOffsetToNumSqrID({fileOffset: -1, rankOffset: 0}, fileNumeral, rankNumeral)) : 
				num2algebraic(addOffsetToNumSqrID({fileOffset: 1, rankOffset: 0}, fileNumeral, rankNumeral)),
			targetOfEnPassantAttackPieceId = board2piece[sqrIDForEnPassantAttack],
			targetExistsAndIsPawn = targetOfEnPassantAttackPieceId != null && targetOfEnPassantAttackPieceId.charAt(1) == "P",
			targMoveHist = targetExistsAndIsPawn ? pieceDataByID[targetOfEnPassantAttackPieceId].moveHistory : null,
			targetMoveCnt = targMoveHist != null ? getMoveCntFromHistory(targMoveHist) : 0,
			targetPawnMovedTwoRanksLastTurn = targetExistsAndIsPawn && targetMoveCnt == 1 && !!targMoveHist[turnID - 1] && 
				((player == "W" && targMoveHist[turnID - 1].charAt(1) == 5) || (player == "B" && targMoveHist[turnID - 1].charAt(1) == 4));

		return ((player == "W" && rankNumeral == 5) || (player == "B" && rankNumeral == 4)) && targetExistsAndIsPawn && targetPawnMovedTwoRanksLastTurn;
	}

	function getMoveCntFromHistory(pieceMoveHistory){
		var moveCnt = 0;
		R.forEachObjIndexed(function(sqrID, turnID){
			moveCnt++;
		}, pieceMoveHistory);
		return moveCnt;
	}

	function addCastlingOffsets(offsets){
		var player = pieceID.charAt(0),
			kingSqrID = pieceStartPos[player + "K"],
			kingMoveCnt = getMoveCntFromHistory(pieceDataByID[player + "K"].moveHistory),
			kingHasNeverMoved = kingMoveCnt == 0,
			kingSideRookMoveCnt = getMoveCntFromHistory(pieceDataByID[player + "Rh"].moveHistory),
			kingsideRookHasNeverMoved = kingSideRookMoveCnt == 0,
			queensideRookMoveCnt = getMoveCntFromHistory(pieceDataByID[player + "Ra"].moveHistory),
			queensideRookHasNeverMoved = queensideRookMoveCnt == 0;

		if(kingHasNeverMoved){
			if(kingsideRookHasNeverMoved){
				var sqrIDsToMoveThru = [
						kingSqrID, 
						num2algebraic(addOffsetToNumSqrID({fileOffset: 1, rankOffset: 0}, fileNumeral, rankNumeral)),
						num2algebraic(addOffsetToNumSqrID({fileOffset: 2, rankOffset: 0}, fileNumeral, rankNumeral))],
					kingDoesntMoveOutOfOrThroughCheckToCastle = !areAnyOfTheseSqrsUnderAttackByOpponent(sqrIDsToMoveThru),
					noPiecesBetweenKingAndKingsideRook = !board2piece[sqrIDsToMoveThru[1]] && !board2piece[sqrIDsToMoveThru[2]];

				if(kingDoesntMoveOutOfOrThroughCheckToCastle && noPiecesBetweenKingAndKingsideRook){
					offsets.push({fileOffset: 2, rankOffset: 0});
				}
			}
			if(queensideRookHasNeverMoved){
				var sqrIDsToMoveThru = [
						kingSqrID, 
						num2algebraic(addOffsetToNumSqrID({fileOffset: -1, rankOffset: 0}, fileNumeral, rankNumeral)),
						num2algebraic(addOffsetToNumSqrID({fileOffset: -2, rankOffset: 0}, fileNumeral, rankNumeral))],
					kingDoesntMoveOutOfOrThroughCheckToCastle = !areAnyOfTheseSqrsUnderAttackByOpponent(sqrIDsToMoveThru),
					noPiecesBetweenKingAndQueensideRook = !board2piece[sqrIDsToMoveThru[1]] && !board2piece[sqrIDsToMoveThru[2]];

				if(kingDoesntMoveOutOfOrThroughCheckToCastle && noPiecesBetweenKingAndQueensideRook){
					offsets.push({fileOffset: -2, rankOffset: 0});
				}
			}
		}
	}

	function areAnyOfTheseSqrsUnderAttackByOpponent(sqrs){
		return R.any(function(sqrID){
			return !!board2attacker[sqrID] && 
				R.any(function(attackerID){
					return attackerID.charAt(0) != settings.playerColor;
				}, board2attacker[sqrID]);
		}, sqrs);
	}

	switch(pieceID.charAt(1)){
		case "K":
			for(var fileOffset = fileNumeral > 1 ? -1 : 0; fileOffset <= (fileNumeral < 8 ? 1 : 0); fileOffset++){
				for(var rankOffset = rankNumeral > 1 ? -1 : 0; rankOffset <= (rankNumeral < 8 ? 1 : 0); rankOffset++){
					if(fileOffset == 0 && rankOffset == 0) continue;
					offsets.push({fileOffset: fileOffset, rankOffset: rankOffset});
				}
			}

			// Add castling offsets
			addCastlingOffsets(offsets);
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
			if(!onlyCountSqrsUnderAttackForPawns){
				var player = pieceID.charAt(0);
				var oneSqrForward = {fileOffset: 0, rankOffset: player == "W" ? 1 : -1};
				if(isSqrAtOffsetEmpty(oneSqrForward)){
					offsets.push(oneSqrForward);
					var twoSqrsForward = {fileOffset: 0, rankOffset: player == "W" ? 2 : -2};
					if(rankNumeral == (player == "W" ? 2 : 7) && isSqrAtOffsetEmpty(twoSqrsForward)){
						offsets.push(twoSqrsForward);
					}
				}
			}
			// Add attack moves & en passant attack moves
			var attackOffsets = player == "W" ? 
				[{fileOffset: -1, rankOffset: 1}, {fileOffset: 1, rankOffset: 1}] :
				[{fileOffset: -1, rankOffset: -1}, {fileOffset: 1, rankOffset: -1}];
			R.forEach(function(attackOffset){
				if(sqrAtOffsetContainsOpponentPiece(attackOffset) || onlyCountSqrsUnderAttackForPawns ||
				   isEnPassantAttack(attackOffset, player)){
					offsets.push(attackOffset);
				}
			}, attackOffsets);
		break;
	}

	var thisObj = this;
	R.forEach(function(offset){
		var move = num2algebraic(
				addOffsetToNumSqrID(offset, fileNumeral, rankNumeral)
			),
			sqrIsEmpty = !thisObj.board2piece[move],
			sqrContainsOpponentPiece = !!thisObj.board2piece[move] && thisObj.board2piece[move].charAt(0) != pieceID.charAt(0);

		if(sqrIsEmpty || sqrContainsOpponentPiece){
			// If the piece is a king, make sure its not moving into a square under attack
			if(pieceID.charAt(1) != "K" || !areAnyOfTheseSqrsUnderAttackByOpponent([move])){
				validMoves.push(move);
			}
		}
	}, offsets);

	return validMoves;
}