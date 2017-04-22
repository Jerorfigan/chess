var settings = {

	// General Graphics

	fps: 30, 					           				// frames per second
	spf: 1/30, 					           				// seconds per frame
	fpms: 30/1000, 				           				// frames per millisecond
	mspf: 1000/30, 				           				// milliseconds per frame 
	canvasWidth: 500,                      				// in px
	canvasHeight: 500,                     				// in px
	//tilesetAtlasPath: "http://ambrosemcjunkin.com/js/games/chess/img/pieces_tileset.json",    
	tilesetAtlasPath: "assets/img/pieces_tileset.json",   

	// Game board
	rankAndFileMarkerFont: 'Lucida Console',
	rankAndFileMarkerFontSize: 14,                      // in px
	rankAndFileMarkerFontWeight: 'Bold',
	boardRankAndFileMarkerColor: 0x7c2216,
	boardEdgeOutlineSize: 1,                            // in px
	boardEdgeOutlineColor: 0x000000,
	boardEdgeSize: 15,                                  // in px
	boardEdgeColor: 0xFFFFFF,
	boardSqrBorderSize: 5,                 				// in px
	boardSqrBorderColor: 0x000000,
	boardSqrWhiteColor: 0xFFFFFF,
	boardSqrBlackColor: 0x666666,
	boardSqrHighlightColor: 0xa0f2ff,
	boardSqrHighlightColorForSelectedPiece: 0xfff760,

	// Game settings

	humanPlayer: "W",
	aiPlayer: "B",

	// AI settings
	aiSkillLevel: 3,									// 1 (novice), 2 (intermediate), 3 (expert)
	piecePointValueQueen: 6,
	piecePointValueBishop: 3,
	piecePointValueKnight: 3,
	piecePointValueRook: 4,
	piecePointValuePawn: 1,
	piecePointValuePawnTraveledOneRank: 1,
	piecePointValuePawnTraveledTwoRanks: 2,
	piecePointValuePawnTraveledThreeRanks: 3,
	piecePointValuePawnTraveledFourRanks: 4,
	piecePointValuePawnTraveledFiveRanks: 5,
	aiPriorityLevel_GainMaterialAdvantage: 100,         // 0% - 100%
	aiPriorityLevel_ProtectKing: 5, 					// 0% - 100%
	aiPriorityLevel_CaptureAndDefend: 10,               // 0% - 100%
	aiRewardAmount_OpponentInCheckForFree: 10,
	aiRewardAmount_OpponentKingMoveDenied: 2/3,
	aiRewardAmount_AlliedKingMovePreserved: 1/5
};

module.exports = settings;