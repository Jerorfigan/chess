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
	this.piece2board = {};
	this.board2piece = {};
	initPiece2Board.call(this);
	initBoard2Piece.call(this);

	gameEvent.fire("BoardSetup", {pieces: this.board2piece});
};

BoardManager.prototype.getMovesFrom = function(sqrID){
	return getValidMoves.call(this, sqrID);
};

BoardManager.prototype.isValidMove = function(fromSqrID, toSqrID){
	return R.contains(toSqrID, getValidMoves.call(this, fromSqrID));
};

BoardManager.prototype.movePiece = function(sourceSqrID, targetSqrID){
	if(!this.board2piece[sourceSqrID]) throw "Attempt to move piece from empty square";

	console.log("Moving " + this.board2piece[sourceSqrID] + " from " + sourceSqrID + " to " + targetSqrID);

	// Update board2piece map
	var movingPieceID = this.board2piece[sourceSqrID];
	delete this.board2piece[sourceSqrID];
	if(this.board2piece[targetSqrID]){
		gameEvent.fire("PieceCaptured", {capturedPieceID: this.board2piece[targetSqrID], sqrID: targetSqrID});
	}
	this.board2piece[targetSqrID] = movingPieceID;
	// Update piece2board map
	var movingPiece = this.piece2board[movingPieceID];
	movingPiece.rank = targetSqrID.charAt(1);
	movingPiece.file = targetSqrID.charAt(0);

	gameEvent.fire("BoardUpdated", {pieces: this.board2piece});
};

BoardManager.prototype.squareHasPlayerPiece = function(sqrID){
	return !!this.board2piece[sqrID] && this.board2piece[sqrID].charAt(0) == settings.playerColor; 
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

function getValidMoves(sqrID){
	var pieceID = this.board2piece[sqrID],
		validMoves = [],
		offsets = [],
		board2piece = this.board2piece,
		fileNumeral = sqrID.charCodeAt(0) - 96, // 1 thru 8 corresponding to a thru h
		rankNumeral = parseInt(sqrID.charAt(1));

	function addStrafeOffsets(offsets, diagonal){
		// Build offsets for strafing the diagonals
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

	switch(pieceID.charAt(1)){
		case "K":
			for(var fileOffset = fileNumeral > 1 ? -1 : 0; fileOffset <= (fileNumeral < 8 ? 1 : 0); fileOffset++){
				for(var rankOffset = rankNumeral > 1 ? -1 : 0; rankOffset <= (rankNumeral < 8 ? 1 : 0); rankOffset++){
					if(fileOffset == 0 && rankOffset == 0) continue;
					offsets.push({fileOffset: fileOffset, rankOffset: rankOffset});
				}
			}
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
			var player = pieceID.charAt(0);
			var oneSqrForward = {fileOffset: 0, rankOffset: player == "W" ? 1 : -1};
			if(isSqrAtOffsetEmpty(oneSqrForward)){
				offsets.push(oneSqrForward);
				var twoSqrsForward = {fileOffset: 0, rankOffset: player == "W" ? 2 : -2};
				if(rankNumeral == (player == "W" ? 2 : 7) && isSqrAtOffsetEmpty(twoSqrsForward)){
					offsets.push(twoSqrsForward);
				}
			}
			// Add attack moves
			var attackOffsets = player == "W" ? 
				[{fileOffset: -1, rankOffset: 1}, {fileOffset: 1, rankOffset: 1}] :
				[{fileOffset: -1, rankOffset: -1}, {fileOffset: 1, rankOffset: -1}];
			R.forEach(function(attackOffset){
				if(sqrAtOffsetContainsOpponentPiece(attackOffset)){
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
			validMoves.push(move);
		}
	}, offsets);

	return validMoves;
}