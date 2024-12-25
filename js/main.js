//
// This implementation of Deckfish is by M. C. DeMarco.
// Deckfish is a 2p game for the Decktet by Alfonso Velasco.
//

/* global decktet, LZString */

// jQuery style selectors.
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);


var main = {};

(function(context) {

	var defaultSettings = {
												 blackmoons: true,
												 highScore: [0,0,0,0,0,0],
												 level: 1,
												 magnification: false,
												 seating: 'hotseat',
												 starting: 'yellow'
												};

	var version = "0.0.1";

	const debugging = true;
	const debugLevel = -1; //Turn up to 2 or off on release.
	const letterOrder = ['a','b','c','d','e','f','g'];
	const suitOrder = ["Moons","Suns","Waves","Leaves","Wyrms","Knots"];
	const rows = 6;
	const columns = 7;

//game
//turn
//auto(mata)
//board
//deck  - uses decktet.js
//io    - uses lz-string.js
//logic
//message
//score
//settings
//ui
//dom



context.game = (function () {

	let phase = 'load'; // load, meeple, move, exchange, score
	let starter = 0;

	return {
		controller: controller,
		init: init,
		getPhase: getPhase,
		getStartPlayer: getStartPlayer,
		isBot: isBot,
		isSolo: isSolo,
		newGame: newGame,
		reload: reload,
		replay: replay,
		setPhase: setPhase,
		setStarter: setStarter
	};

	function controller(previous) {
		//Determines the next action from state and the previous action.
		console.log("In the new controller after " + previous);

		if (previous == 'load') {
			//If there was no previous action, we are probably starting a game.
			setStartPlayer();
			if (!isSolo())
				context.message.gamelog("The start player is " + context.turn.getColorFromTurn(starter) + ".",1);
			context.meeple.controller(previous);
		}

		if (previous == 'meeple') {
			context.turn.controller(previous,starter);
		}

		if (previous == 'turn') {
			//Move on to scoring.
			context.score.controller(previous);
		}
	}

	function getPhase() {
		return phase;
	}

	function getStartPlayer() {
		return starter;
	}

	function init() {
		//The initialization function called on document ready.
		
		context.deck.init();
		context.message.init();
		context.settings.init();
		context.ui.init();
		
		context.io.loadCheck();

		context.ui.initListeners();
	}

	function isBot() {
		return !!(context.settings.get('seating') == 'bot');
	}

	function isSolo() {
		return !!(context.settings.get('seating') == 'solo');
	}

	function newGame() {
		//Shuffle the old deck.
		context.message.gamelog("Shuffling...",1);
		context.board.shuffle();
		game();
	}

	function reload() {
		reload = true;
		context.message.gamelog("Reloading game at last " + phase,1);

		context.deck.reload();

		//Once we have a game, we can activate the replay button.
		context.dom.replayButton();

		//Return to the suspended listening state.
		var solo =  isSolo();

		if (phase == 'load' || phase == 'meeple') {
			//Reactivate meeple stage
			if (solo)
				context.meeple.setMeepTurn(0);
			else {
				//Meeples are ordered and marked, so we can derive the next turn from them.
				var meeps = context.meeple.getAll();
				console.log(meeps);
				var prevple = meeps.length ? meeps[meeps.length - 1][2] : context.game.getStartPlayer();
				context.meeple.setMeepTurn(prevple);
			}
			context.meeple.controller('reload');
		} else if (phase == 'move') {
			//Reactivate the turn.  
			//This is the only one that needed controller support.
			context.turn.controller('reload');
		} else if (phase == 'exchange') {
			//Need the turn header.
			context.ui.turner(context.turn.getTurn(),'');
			//Reactivate the exchange.  
			context.board.controller('reload');
		} else if (phase == 'score') {
			//Recalc and rewrite the final status.
			
			//TODO
		}
	}

	function replay() {
		context.message.gamelog("Not shuffling...",1);

		game();
	}

	function setPhase(newPhase) {
		phase = newPhase;
	}

	function setStarter(starty) {
		//For loading a game that has already started.
		starter = starty;
	}

	function setStartPlayer() {
		//This only happens the once, so we may as well do further bookkeeping here.
		var starty = context.settings.get('starting');
		var solo = isSolo();

		if (!solo) {
			if (starty == "random")
				starter = context.auto.randZero(2);
			else 
				starter = (starty == "yellow" ? 0 : 1);

			context.message.log("Start player is " + context.turn.getColorFromTurn(starter), -1);
		}

		if (solo)
			context.score.solo();
		else
			context.score.init(starter);
		
		return;
	}

	/* private */

	function clean() {
		//Erase existing cards.
		$$(".cardspace").forEach(elt => elt.style.backgroundImage = "");

		//Unhighlight.  Don't really need both.
		context.dom.unglowAll();
		//it's important to nuke the tableau
		unsetAll();

		//Clear instructions and any open panels.
		context.message.turn('');
		context.dom.show('');
		context.dom.questionButton();
		context.dom.unlog();
		context.ui.unturner();
		context.dom.unmeeple();

		context.score.clean();

		context.ui.unlisten();
	}

	function game() {
		//Clear the screen.
		clean();
		const gameType = context.settings.get('seating');
		context.message.gamelog("Starting new " + (gameType == 'bot' || gameType == 'solo' ? gameType : "two player") + " game.",1);

		context.board.initializeTableau();

		//Once we have a game, we can activate the replay button.
		context.dom.replayButton();

		controller('load');
	}

	function unsetAll() {
		phase = 'load';
		starter = 0;

		context.turn.unsetAll();
		context.meeple.unsetAll();
		context.select.unset();
		context.board.unsetTableau();
	}

})();



context.turn = (function () {

	let turn = 1;
	let turnCount = 0;
	let mopup = false;

	return {
		controller: controller,
		getColorFromTurn: getColorFromTurn,
		getCurrentColor: getCurrentColor,
		getMopup: getMopup,
		getTurn: getTurn,
		getTurnCount: getTurnCount,
		incTurnCount: incTurnCount,
		myTurn: myTurn,
		setMopup: setMopup,
		setTurn: setTurn,
		setTurnCount: setTurnCount,
		unsetAll: unsetAll 
	};

	function controller(previous,startPlayer) {
		//because it needs logic
		//startPlayer is only passed from the game controller for the first move.
		console.log("In the turn controller after " + previous);

		context.game.setPhase('move');

		if (previous == 'failedautomove' && mopup) {
			context.game.controller('turn');
			return;
		}
		
		if (previous == 'meeple') {
			turnCount = 1;
			//We're on the first move.
			if (context.game.isSolo())
				turn = 0;
			else
				turn = startPlayer;
			//continue
		} else if (previous == 'reload') {
			//We use the existing values instead of incrementing.
			context.message.log("Reactivating turn.",1);
			//continue.
		} else {
			//e.g., previous = exchange
			//Increment the turn.
			incTurnCount();

			//We need to decide whether to increment the player.
console.log("solo, mopup, fail, other", context.game.isSolo(), mopup, previous);
			if (context.game.isSolo()) {
				turn = 0;
			} else if (mopup) {
				//Already checked for double mop so one mop means no player change.
			} else if (previous == 'failedautomove') {
				mopup = true;
				turn = (turn + 1) % 2;
			} else {
				turn = (turn + 1) % 2;
			}
			//continue
		}

		//Make a promise?
		context.io.autoshave();

		//Need to take a turn, so all we need to know is if it's a bot game.
		if (context.game.isBot() && turn == 1) {
			//This function returns to the controller on its own.
			inhuturn();
		} else {
			huturn();
		}
	}
	
	function getColorFromTurn(theTurn) {
		//Used for meepTurns.
		return theTurn ? "purple" : "yellow";
	}
	
	function getCurrentColor() {
		return turn ? "purple" : "yellow";
	}

	function getMopup() {
		if (context.game.isSolo())
			return true;
		else
			return mopup;
	}

	function getTurn() {
		//for scoring and IO
		return turn;
	}
	
	function getTurnCount() {
		//for logging and IO
		return turnCount;
	}
	
	function incTurnCount() {
		//Increments turn count
		turnCount++;
	}
	
	function myTurn(loc) {
		//for moving; loc has already been determined to have a meeple.
		//Determine color of meeple at loc.
		var mee = context.meeple.get(loc);
		var me = getTurn();
		return mee[2] == me;
	}

	function setMopup(bool) {
		mopup = !!(bool);
	}

	function setTurn(thePlayer) {
		//Set saved turn (player) for reloading game.
		turn = thePlayer;
	}

	function setTurnCount(theTurn) {
		//Set saved turn count for reloading game.
		turnCount = theTurn;
	}

	function unsetAll() {
		turn = 1;
		turnCount = 0;
		mopup = false;
	}

	/* private */

	function huturn(thePlayer) {
		//await human interaction and return
		console.log("In huturn at " + turnCount);
		turner();
		context.ui.listen('move');
		console.log("Leaving huturn at " + turnCount);
	}

	function inhuturn() {
		//The bot moves.
		console.log("In inhuturn at " + turnCount);

		context.message.gamelog("purple's turn:", 1);
		if (context.auto.mover()) {
			context.turn.controller('automove');
		} else {
			context.message.gamelog('No moves remaining.',2);
			context.turn.controller('failedautomove');
		}
		console.log("Leaving inhuturn at " + turnCount);
		return;
	}

	function turner(thePlayer,noMessage) {
		if (thePlayer == undefined)
			thePlayer = turn;

		var playaCola = thePlayer ? "purple" : "yellow";
		if (!noMessage)
			context.message.gamelog(playaCola + "'s turn:", 1);

		context.ui.turner(thePlayer,'Move a meeple.');
		context.dom.questionButton('Pass?');
	}

})();



context.auto = (function () {

	return {
		exchanger: exchanger,
		meepler: meepler,
		mover: mover,
		passer: passer,
		randZero: randZero,
		seeder: seeder
	}

	function exchanger() {
		//TODO: implement random/nonrandom exchanging
	}

	function meepler(permitIllegal) {
		//Automatically select meeple spot.
		//At level 3 or with flag, the bot cheats and takes pawns or courts.
		var loc;
		var meeps = context.meeple.getAll();
		var firstMeeple = (meeps.length === 0);
		if (!permitIllegal)
			permitIllegal = !!(context.settings.get('level') > 2);

		if (firstMeeple) {
			loc = [randZero(rows),randZero(columns)];
		} else {
			//loc is the latest meeple's spot
			var meep = meeps[meeps.length - 1];
			loc = [meep[0],meep[1]];
		}
		//Firstmeeple no longer needed.
		var target = findNextMeeplace(loc,permitIllegal);

		//The target has been tested but gets retested here.
		//Only purple is autoplaced so force purple.
		context.logic.clickedForMeeple(target,permitIllegal,true);
	}

	function mover() {
		context.message.log("Automoving the bot", -2);
		const makeRankedMove = (context.settings.get('level') > 1);

		//The automaton makes a random move.
		var momeepIdx = randZero(3);
		var meeples = context.meeple.getAll(1);
		var currIdx, momeep, momeepLoc;
		for (var m=0; m<3; m++) {
			currIdx = (momeepIdx + m) % 3;
			momeep = meeples[currIdx];
			momeepLoc = [momeep[0],momeep[1]];
			context.message.log("Purple meeple select: " + momeepLoc, -2);
			context.select.set(momeepLoc);
			if (autoMove(momeepLoc,makeRankedMove)) {
				//skipping exchange for now
				return true;
			}
		}
		//Didn't find a move.  This changes the phase or ends the game.
		context.select.unset();
		return false;
	}

	function passer() {
		//Check if a player who wants to pass has any moves.
		var playa = context.turn.getTurn();
		context.message.gamelog("Pressed the Pass? button.",2);

		//Prevent issues with clicking aronud during this process.
		context.ui.unlisten();

		var meeples = context.meeple.getAll(playa);
		var momeep, momeepLoc;
		for (var m=0; m<3; m++) {
			momeep = meeples[m];
			momeepLoc = [momeep[0],momeep[1]];
			context.message.log("Meeple test before passing: " + context.message.translate(momeepLoc),-2);
			context.select.set(momeepLoc);
			if (autoMove(momeepLoc)) {
				context.board.controller('automove');
				return;
			}
		}
		//Else no moves were found.
		context.select.unset();
		context.message.gamelog('No moves remaining.',2);
		context.turn.controller('failedautomove');
	}

	function randZero(n) {
		//returns a random int in [0,n).
		return Math.floor(Math.random() * n);
	}

	function seeder() {
		//Place three initial meeples without ever setting the turn for solo mode.
		context.message.gamelog("Placing obstacles.",1);
		meepler(true);
		meepler(true);
		meepler(true);
		context.message.gamelog("Meeple placement...",1);
	}

	//Private

	function assembleTargets(meepleLoc,ranked) {
		var unfilteredTargets = collectTargets(meepleLoc);
		var filteredTargets = filterTargets(unfilteredTargets);
		if (ranked) 
			return rankTargets(filteredTargets);
		else
			return filteredTargets;
	}

	function collectTargets(meepleLoc) {
		const orthoSuits = new Set(["Moons","Waves","Leaves","Wyrms"]);

		//get card
		var idx = context.board.getTableau(meepleLoc);

		//get suits
		var suits = context.deck.getCard(idx).Suits;

		//get targets
		var myTargets = [];
		if (suits.has('Suns'))
			myTargets = myTargets.concat(collectSunTargets(meepleLoc));
		if (suits.has('Knots'))		
			myTargets = myTargets.concat(collectKnotTargets(meepleLoc));
		if (suits.intersection(orthoSuits).size > 0)
			myTargets = myTargets.concat(collectOrthogonalTargets(meepleLoc));

		return myTargets;
	}

	function collectKnotTargets(meepleLoc) {
		context.message.log("Collecting knot targets...",-3);
		var meepleRow = meepleLoc[0];
		var meepleCol = meepleLoc[1];
		var targets = [];

		//Straight lines.
		if (context.logic.checkLocation([meepleRow,meepleCol - 3]))
			targets.push([meepleRow,meepleCol - 3]);
		if (context.logic.checkLocation([meepleRow,meepleCol + 3]))
			targets.push([meepleRow,meepleCol + 3]);

		if (context.logic.checkLocation([meepleRow - 3,meepleCol]))
			targets.push([meepleRow - 3,meepleCol]);
		if (context.logic.checkLocation([meepleRow + 3,meepleCol]))
			targets.push([meepleRow + 3,meepleCol]);

		//Around almost a circle.
		if (context.logic.checkLocation([meepleRow,meepleCol - 1]))
			targets.push([meepleRow,meepleCol - 1]);
		if (context.logic.checkLocation([meepleRow,meepleCol + 1]))
			targets.push([meepleRow,meepleCol + 1]);

		if (context.logic.checkLocation([meepleRow - 1,meepleCol]))
			targets.push([meepleRow - 1,meepleCol]);
		if (context.logic.checkLocation([meepleRow + 1,meepleCol]))
			targets.push([meepleRow + 1,meepleCol]);

		//Zig-zagging.
		if (context.logic.checkLocation([meepleRow - 1,meepleCol - 2]))
			targets.push([meepleRow - 1,meepleCol - 2]);
		if (context.logic.checkLocation([meepleRow + 1,meepleCol - 2]))
			targets.push([meepleRow + 1,meepleCol - 2]);

		if (context.logic.checkLocation([meepleRow - 1,meepleCol + 2]))
			targets.push([meepleRow - 1,meepleCol + 2]);
		if (context.logic.checkLocation([meepleRow + 1,meepleCol + 2]))
			targets.push([meepleRow + 1,meepleCol + 2]);

		if (context.logic.checkLocation([meepleRow - 2,meepleCol - 1]))
			targets.push([meepleRow - 2,meepleCol - 1]);
		if (context.logic.checkLocation([meepleRow - 2,meepleCol + 1]))
			targets.push([meepleRow - 2,meepleCol + 1]);

		if (context.logic.checkLocation([meepleRow + 2,meepleCol - 1]))
			targets.push([meepleRow + 2,meepleCol - 1]);
		if (context.logic.checkLocation([meepleRow + 2,meepleCol + 1]))
			targets.push([meepleRow + 2,meepleCol + 1]);

		return targets;
	}

	function collectOrthogonalTargets(meepleLoc) {
		var targets = [];

		for (var r=0; r < rows; r++) {
			if (r != meepleLoc[0]) 
				targets.push([r,meepleLoc[1]]);
		}

		for (var c=0; c < columns; c++) {
			if (c != meepleLoc[1]) 
				targets.push([meepleLoc[0],c]);
		}

		return targets;
	}

	function collectSunTargets(meepleLoc) {
		var meepleRow = meepleLoc[0];
		var meepleCol = meepleLoc[1];
		var targets = [];

		//If the first space diagonally is off the board, the second will be, too.
		if (context.logic.checkLocation([meepleRow - 1,meepleCol - 1])) {
			targets.push([meepleRow - 1,meepleCol - 1]);
			if (context.logic.checkLocation([meepleRow - 2,meepleCol - 2])) {
				targets.push([meepleRow - 2,meepleCol - 2]);
			}
		}
		if (context.logic.checkLocation([meepleRow - 1,meepleCol + 1])) {
			targets.push([meepleRow - 1,meepleCol + 1]);
			if (context.logic.checkLocation([meepleRow - 2,meepleCol + 2]))
				targets.push([meepleRow - 2,meepleCol + 2]);
		}
		if (context.logic.checkLocation([meepleRow + 1,meepleCol + 1])) {
			targets.push([meepleRow + 1,meepleCol + 1]);
			if (context.logic.checkLocation([meepleRow + 2,meepleCol + 2]))
				targets.push([meepleRow + 2,meepleCol + 2]);
		}
		if (context.logic.checkLocation([meepleRow + 1,meepleCol - 1])) {
			targets.push([meepleRow + 1,meepleCol - 1]);
			if (context.logic.checkLocation([meepleRow + 2,meepleCol - 2]))
				targets.push([meepleRow + 2,meepleCol - 2]);
		}

		return targets;
	}

	function filterTargets(targets) {
		var realTargets = targets.filter((target) => !(context.board.isExcuseOrGap(target)));
		return realTargets;
	}

	function findNextMeeplace(loc,permitIllegal) {
		//The bot places a meeple.
		//Search from the passed in location until we find...
		var minIdx, maxIdx;
		if (permitIllegal || context.settings.get('level') > 2) {
			//looking for PAWN or COURT
			minIdx = 37;
			maxIdx = 44;
		} else {
			//looking for Ace or CROWN
			minIdx = 1;
			maxIdx = 12;
		}

		context.message.log("Meeplace search starting from " + loc,-2);
		var testloc, idx;
		for (var r = loc[0]; r < rows + loc[0]; r++) {
			for (var c = loc[1]; c < columns + loc[1]; c++) {
				testloc = [r%rows,c%columns];

				//To keep the search contained here we do all checks as well.
				idx = context.board.getTableau(testloc);
				//3 and 9 are the Moon cards, which we avoid as traps.
				if (idx < minIdx || idx > maxIdx || idx == 3 || idx == 9)
					continue;
				if (context.meeple.hasMeeple(testloc))
					continue;

				context.message.log("Meeplace search found " + testloc,-2);
				return testloc;
			}
		}
		//There should always be enough desireable spaces for the fn to return a location.
	}

	function rankTargets(targets) {
		var rankedTargets = targets.toSorted((a,b) => context.board.getTableau(b) - context.board.getTableau(a));
		return rankedTargets;
	}

	function autoMove(meepleLoc,ranked) {
		//The automaton makes the first (unranked) or best (ranked) 
		//move for this meeple.
console.log("In automove with ranked? " + !!ranked);
		var someTargets = assembleTargets(meepleLoc,ranked);
		for (var t = 0; t<someTargets.length; t++) {
			if (context.logic.clickedForMove(someTargets[t],true)) {
				context.message.log("Found a move for the chosen meeple.",-2);
				return true;
			}
		}
		//Else this meeple didn't move.
		context.message.log("Found no move for the chosen meeple.",-2);
		return false;
	}

})();



context.board = (function () {

	let tableau = [];//Array of arrays
	let market = [];
	let shuff = Array.from({length: 45}, (e, i)=> i);

	return {
		controller: controller,
		equals: equals,
		exchange: exchange,
		initializeTableau: initializeTableau,
		isExcuse: isExcuse,
		isExcuseOrGap: isExcuseOrGap,
		getFullMarket: getFullMarket,
		getFullTableau: getFullTableau,
		getMarket: getMarket,
		getShuffle: getShuffle,
		getTableau: getTableau,
		setFullMarket: setFullMarket,
		setFullTableau: setFullTableau,
		setShuffle: setShuffle,
		setTableau: setTableau,
		shuffle: shuffle,
		unsetTableau: unsetTableau
	};

	function controller(thePlayer) {
		//This is the exchange controller.
		//It's so empty b/c thePlayer only matters for purposes of auto-exchanging, 
		//which isn't implemented yet.
		console.log("In the exchange controller.");
		context.game.setPhase('exchange');

		//Make a promise?
		context.io.autoshave();

		//await human interaction and return to the turn controller.
		context.message.turn('Exchange cards?');
		context.dom.questionButton('Skip');

		context.ui.listen('exchange');
	}

	function equals(locA,locB) {
		return (locA[0] == locB[0] && locA[1] == locB[1]);
	}

	function exchange(loc) {
		var row = loc[0];
		var col = loc[1];
		//Exchange the selected card with the card passed in.
		var marketIdx, marketLoc, tableauIdx, tableauLoc;
		var sel = context.select.get();
		if (loc[1] == -1) {
			marketLoc = loc;
			tableauLoc = sel;
		} else {
			marketLoc = sel;
			tableauLoc = loc;
		}
		marketIdx = getMarket(marketLoc);
		tableauIdx = getTableau(tableauLoc);

		context.message.gamelog("Exchanged tableau card " + context.message.translate(tableauLoc) + " with market card " + context.message.translate(marketLoc) + ".",2);

		setMarket(marketLoc,tableauIdx);
		setTableau(tableauLoc,marketIdx);

		context.select.unset();
	}

	function initializeTableau() {
		//Also moves the cards back if replaying.

		//Clear the tableau.
		tableau = new Array();
		market = new Array();

		//Edit the tableau to make initial placements.
		var i;
		for (var r = 0; r < rows; r++) {
			tableau[r] = new Array();
			for (var c = 0; c < columns; c++) {
				i = r * columns + c;
				setTableau([r,c],shuff[i]);  //A shuffling of cardNo, which matches the initial indices of deck.
			}
		}

		//Place the last three cards in the market.
		for (var m=0; m<3; m++) {
			setMarket([m,-1], shuff[i + 1 + m]);
		}

		context.message.log(tableau,-3);
	}

	function isExcuse(loc) {
		var idx = getTableau(loc);
		return context.deck.isExcuseIndex(idx);
	}

	function isExcuseOrGap(loc) {
		var idx = getTableau(loc);
		return (idx < 1);
	}

	function getFullMarket(loc) {
		return market;
	}

	function getFullTableau(loc) {
		return tableau;
	}

	function getMarket(loc) {
		return market[loc[0]];
	}

	function getShuffle() {
		return shuff;
	}

	function getTableau(loc) {
		return tableau[loc[0]][loc[1]];
	}

	function setFullMarket(arry) {
		market = arry;
	}

	function setFullTableau(arry) {
		tableau = arry;
	}

	function setMarket(loc,idx) {
		market[loc[0]] = idx;

		//Also set images.
		var card = context.deck.getCard(idx);
		context.dom.setImage(loc,card);
	}

	function setShuffle(shffl) {
		shuff = shffl;
	}

	function setTableau(loc,idx) {
		tableau[loc[0]][loc[1]] = idx;

		//Also set images.
		var card = context.deck.getCard(idx);
		context.dom.setImage(loc,card);
	}

	function shuffle() {
		//returns a shuffling of array indices

		//shuffle shuff.
		for (var i = 0; i < shuff.length; i++) {
			// move card from i to n
			var n = 0;
			while (n == 0 || n == i) {
				n = Math.floor(Math.random() * (shuff.length - 1)) + 1;
			}
			var temp = shuff[i];
			shuff[i] = shuff[n];
			shuff[n] = temp;
		}
	}

	function unsetTableau() {
		tableau = [];
		market = [];
	}

})();



context.deck = (function () {

	let deck = [];

	return {
		getCard: getCard,
		have: have,
		init: init,
		isExcuseIndex: isExcuseIndex,
		reload: reload
	};

	function getCard(idx) {
		if (idx > deck.length - 1) {
			context.message.log("Fishing with no deck index " + idx,-2);
		}
		return deck[idx];
	}

	function have() {
    return !!(deck.length > 0);
	}

	function init() {
		context.message.gamelog("Unwrapping a fresh decktet...",1);
		// Build the deck.
		deck = create();
	}

	function isExcuseIndex(idx) {
		return (idx === 0);
	}

	function reload() {
		//When reloading a tableau from storage, we need to redisplay the cards
		var i,idx,card;
		for (var r = 0; r < rows; r++) {
			for (var c = 0; c <= columns; c++) {
				idx = context.board.getTableau([r,c]);
				card = getCard(idx);
				context.dom.setImage([r,c],card,true);
			}
		}

		//And the market
		for (var m = 0; m < 3; m++) {
			idx = context.board.getMarket([m,-1]);
			card = getCard(idx);
			context.dom.setImage([m,-1],card,true);
		}
	}

	/* private */

	function create() {

		//Just a basic deck, not a myrmex deck despite the lingering name.
		var myrmexDeck = decktet.create.deck(1);

		context.message.log("Deck of size " + myrmexDeck.length,-3);

		//No longer shuffle the deck using the utility 
		//because we want to keep our indices for automaton move sorting.
		//myrmexDeck = decktet.shuffle.deck(myrmexDeck);
		//myrmexDeck = decktet.shuffle.sort(myrmexDeck); // Sort to debug deck structure.

		//Convenience set.
		myrmexDeck = addSuitSets(myrmexDeck);

		return myrmexDeck;
	}

	function addSuitSets(myrmexDeck) {
		//We need a separate function because JSON doesn't support sets.
		for (var i = 0; i < myrmexDeck.length; i++) {

			//Add a Set of suits to make suit comparisons easier.
			myrmexDeck[i].Suits = new Set();
			if (myrmexDeck[i].Suit1)
				myrmexDeck[i].Suits.add(myrmexDeck[i].Suit1);
			else
				continue;
			if (myrmexDeck[i].Suit2)
				myrmexDeck[i].Suits.add(myrmexDeck[i].Suit2);
			else
				continue;
			if (myrmexDeck[i].Suit3)
				myrmexDeck[i].Suits.add(myrmexDeck[i].Suit3);
			else
				continue;
		}

		return myrmexDeck;
	}

  function randomPop(suits) {
		//Suits is an array.  It needn't be actual suits.
		return suits[suits.length * Math.random() | 0];
	}

})();



context.io = (function () {

	let reload = false;

	return {
		autoshave: autoshave,
		getReload: getReload,
		getState: getState,
		loadCheck: loadCheck,
		saveToStorage: saveToStorage,		
		setState: setState,
		shareURL: shareURL,
	}

	//When passing state between functions, it should be an object.

	function autoshave() {
		//Autosave on state changes, or automatically update the share link.
		//TODO: the share bit
		saveToStorage();
	}

	function getReload() {
		return reload;
	}

	function getState() {
		//Convert the state into our canonical, unzipped so far, state string.
		//TODO: the zipping
		var currentState = {
			phase: context.game.getPhase(),
			starter: context.game.getStartPlayer(),
			turn: context.turn.getTurn(),
			turnCount: context.turn.getTurnCount(),
			mopup: context.turn.getMopup(),
			shuffle: context.board.getShuffle(),
			tableau: context.board.getFullTableau(),
			market: context.board.getFullMarket(),
			meeples: context.meeple.getAll(),
			scores: context.score.get(),
			level: context.settings.get('level'),
			seating: context.settings.get('seating')
		};
		//Note that the deck is canonical and does not need saving.
		//The scores come converted from array of object to array of array.

		//Pass around the unzipped state string.
		return currentState;
	}

	function loadCheck() {
		//TODO: Resolve conflicts between a URL and a stored game.
		//Get the query string.
		let params = new URLSearchParams(window.location.search);
		let compressedGame = params.get('game');

		if (compressedGame) {
			loadFromURL(compressedGame);
			//Calls reload or errors.
		} else {
			//Check local storage instead.
			loadFromStorage();
		}
	}

	function setState(s) {
		//Load the game from a set state.  This will be tricksy.
		context.game.setPhase(s.phase);
		context.game.setStarter(s.starter);

		context.turn.setTurn(s.turn);
		context.turn.setTurnCount(s.turnCount);
		context.turn.setMopup(s.mopup);

		context.board.setShuffle(s.shuffle);
		context.board.setFullTableau(s.tableau);
		context.board.setFullMarket(s.market);

		context.meeple.setAll(s.meeples);

		context.score.set(s.scores);

		context.settings.set('level',s.level);
		context.settings.set('seating',s.seating);

		context.message.log("Reloaded state...",-1);
	}

	function saveToStorage() {
		var storableState = compress(getState());
		context.settings.setGame(storableState);
	}

	function shareURL() {
		//context.message.log("Sharing is caring",-3);
		let compressedGame = compress(getState());
		let url = new URL(window.location);
		url.searchParams.set("game",compressedGame);
		history.pushState({}, "", url);

		//TODO: add to clipboard, requires https
		writeToClipboard(url);
	}

	/* private */

	async function writeToClipboard(url) {
		try {
			await navigator.clipboard.writeText(url);
		} catch (error) {
			context.message.log("Error writing URL to clipboard: " + error.message,3);
		}
	}

	function compress(obj) {
		return LZString.compressToEncodedURIComponent(JSON.stringify(obj));
	}

	function decompress(str) {
		//TODO
		return JSON.parse(LZString.decompressFromEncodedURIComponent(str));
	}

	function loadFromStorage() {
		var stateString = context.settings.getGame();
		if (!stateString)
			return;

		var stateObj = decompress(stateString);
		context.message.clearLog();
		context.message.log("Reloading game from localStorage.",1);

		loadFromObject(stateObj);
	}

	function loadFromURL(compressedGame) {
		//Combine with the other function eventually.
		var stateObj = decompress(compressedGame);

		//TODO: validate and return false if corrupt.
		//console.log(stateObj);
		context.message.log("Reloading game from URL parameter.",1);

		loadFromObject(stateObj);
	}

	function loadFromObject(stateObj) {
		setState(stateObj);
		context.game.reload();
	}

})();



context.logic = (function () {

	return {
		checkLocation: checkLocation,
		clickedForExchange: clickedForExchange,
		clickedForMeeple: clickedForMeeple,
		clickedForMove: clickedForMove
	};

	function clickedForExchange(loc) {
		var col, newsel;

		if (context.meeple.hasMeeple(loc)) {
			//Can't exchange an occupied card.
			return;
		}
		
		col = loc[1];
 
		if (col > -1) {
			newsel = context.board.getTableau(loc);
			if (newsel == -1) {
				//Can't select a blank.
				return;
			}
		}

		//It doesn't otherwise matter what the card is; we're good.
		if (!context.select.get().length) {
			//Nothing was selected so set the first selection.
			context.select.set(loc);
			return;
		}

		if (col > -1 && context.select.get()[1] > -1) {
			//Another tableau card was previously selected, so unselect it and select this one.
			context.select.set(loc);
			return;
		}

		if (col == -1 && context.select.get()[1] == -1) {
			//Another market card was previously selected, so unselect it and select this one.
			context.select.set(loc);
			return;
		}

		//Otherwise it's time to swap.
		context.board.exchange(loc);

		//re-turn
		context.ui.unlisten('exchange');
		context.turn.controller('exchange');
	}

	function clickedForMeeple(loc,permitIllegal,purple) {
		//Initial meeple placements only.

		//Test location
		if (!checkMeeple(loc,permitIllegal))
			return;

		context.meeple.set(loc,purple);

		var msg = purple ? "purple meeple placed " : context.turn.getColorFromTurn(context.meeple.getMeepTurn()) + " placed meeple " 
		msg = msg + "at " + context.message.translate(loc) + ".";
		context.message.gamelog(msg, 2);

		context.ui.unlisten('meeple');
		if (!purple)
			context.meeple.controller('humeeple');
		else
			context.meeple.controller('automeeple');
	}

	function clickedForMove(loc,auto) {
		//Primary purpose is post-processing clicks,
		//but also processes potential automaton moves.
		//In the latter case, pass in meep selection as well.
		var idx;

		if (auto) {
			//Don't need to check selection, only the move.
		} else {
			//Testing only necessary on a real click.
			context.message.log("Click for move on " + loc,-2);

			if (context.select.get().length == 0) {
				//Still selecting a meeple.
				if (!context.meeple.hasMeeple(loc)) {
					context.message.log("Need meep to move",-2);
					return;
				}
				
				//Test for correct meeple here if necessary.
				if (!context.turn.myTurn(loc)) {
					context.message.log("Not your turn",-2);
					return;
				}
				
				//Set selected.
				context.select.set(loc);
				context.message.log("Selected a meeple to move from " + loc,-2);
				return;
			}
		}

		if (hasMoveTo(loc)) {
			//Make the move here.
			context.meeple.moveSelectedTo(loc,auto);
			//Take and score the card.
			context.score.selected();
			context.board.setTableau(context.select.get(),-1);
			context.select.unset();

			context.ui.unlisten('move');

			if (auto) {
				//automaton handles the turn change.
				return true;
			} else {
				context.board.controller('exchange');
			} 

		} else {

			//Not a legal move.
			//For the automaton, return to the sub-controller.
			if (auto)
				return false;
		}
		return;
	}



	/* private */

	function hasMoveTo(loc) {
		console.log("In hasMoveTo for location " + loc);
		context.message.log("Checking a move to " + loc,-3);

		//First, the low-hanging fruit.
		//Get the new tableau value.
		var targetIdx = context.board.getTableau(loc);

		//If this is a card and nothing else is selected, just set selected.
		if (targetIdx == -1) {
			//Can't move to a gap.
			context.message.log("Cannot move to a gap",-2);
			return false;
		}

		if (context.deck.isExcuseIndex(targetIdx)) {
			//The Excuse.
			context.message.log("Cannot move to the Excuse",-2);
			return false;
		}

		//From here on we need the previously selected card location.
		var meepleLoc = context.select.get();
		console.log("Selected meeple loc is: " + meepleLoc);
		if (context.board.equals(meepleLoc, loc)) {
			//Selected the meeple himself.  In this case, unselect and return.
			context.message.log("Unmeeping...",-2);
			context.select.unset();
			return false;
		}

		//From here on we need the move suit info.
		var meepleCard =  context.deck.getCard(context.board.getTableau(meepleLoc));
		var moveSuits = meepleCard.Suits;
		if (context.meeple.hasMeeple(loc) && !moveSuits.has('Wyrms')) {
			context.message.log("No meeple mash",-2);
			return false;
		}

		//Individual suit/target testing.
		for (let suit of moveSuits) {
			context.message.log("Checking a " + suit + " move...",-3);
			if (hasSuitMoveTo(suit,loc,meepleLoc)) {
				context.message.log("Successful move using " + suit,-3);
				return true;
			}
		}

		return false;
	}

	function hasSuitMoveTo(suit,targetLoc,meepleLoc) {
		context.message.log("Suit: " + suit);

		//Because of wyrms, we always need to check the target for meeples.
		if (suit != 'Wyrms' && context.meeple.hasMeeple(targetLoc)) {
			context.message.log("No meeple mash",-3);
			return false;
		} else if (suit == 'Wyrms' && !context.meeple.hasMeeple(targetLoc)) {
			context.message.log("Must meeple mash",-3);
			return false;
		}

		//Now we check the suits individually.
		var targetRow = targetLoc[0];
		var targetCol = targetLoc[1];
		var meepleRow = meepleLoc[0];
		var meepleCol = meepleLoc[1];
		var testRow, testCol;

		//SUNS
		//Check diagonality, including the optional intervening card.
		if (suit == 'Suns') {
			if (!isSunTarget(meepleLoc,targetLoc))
				return false;

			//Now we know it's a diagonal in range.
			var rowDiff = Math.abs(targetRow - meepleRow);
			if (rowDiff == 2) {
				//Check that the intervening card is passable.
				testRow = (targetRow + meepleRow) / 2;
				testCol = (targetCol + meepleCol) / 2;
				if (!checkPassable(suit,[testRow,testCol])) {
					context.message.log("Intervening card(space) not passable",-3);
					return false;
				}
			}

			//Otherwise suns have passed!
			return true;
		}

		//KNOTS
		if (suit == 'Knots') {
			//Sanity check the target.
			if (!isKnotTarget(meepleLoc,targetLoc))
				return false;

			//Compute paths for the target type (usually two) and test them.
			var paths = getKnotPaths(meepleLoc,targetLoc);
			context.message.log(JSON.stringify(paths),-3);
			var path;

			//Check the passability of the path.
			for (var pp=0; pp < paths.length; pp++) {
				path = paths[pp];
				if (checkPath(path))
					return true;
			}

			//Otherwise knots have failed with no path.
			return false;
		}

		//Some general conditions for !Suns &G !Knots

		//Check orthogonality.  No longer need to sun or knot.
		if (!isOrthogonalTarget(meepleLoc,targetLoc))
			return false;

		if (!checkAllPassable(suit,meepleLoc,targetLoc))
			return false;

		//MOONS
		if (suit == 'Moons') {
			//No additional conditions; the orthog test means we've passed.
			return true;
		}
		
		//LEAVES
		if (suit == 'Leaves') {
			//Test end condition of no neighboring obstacles.
			context.message.log("Checking local obstacles for " + suit,-3);

			//One of these tests is unnecessary and possibly fails, 
			//so altered obstacle test to exclude the meeple space.
			testRow = targetRow;
			testCol = targetCol - 1;
			if (testCol >= 0 && checkObstacle([testRow,testCol],meepleLoc))
				return false;
			testRow = targetRow;
			testCol = targetCol + 1;
			if (testCol < columns && checkObstacle([testRow,testCol],meepleLoc))
				return false;
			testRow = targetRow - 1;
			testCol = targetCol;
			if (testRow >= 0 && checkObstacle([testRow,testCol],meepleLoc))
				return false;
			testRow = targetRow + 1;
			testCol = targetCol;
			if (testRow < rows && checkObstacle([testRow,testCol],meepleLoc))
				return false;

			//Passing leaves.
			return true;
		}

		//For the remaining orthogonal cases, (Wyrms and Waves)
		//we need to know the status of the "next" space.
		context.message.log("Checking the 'next' space for " + suit,-3);
		var next = getNextSpace(targetLoc,meepleLoc);
		var nextRow, nextCol;
		
		//WYRMS
		//End condition checks.
		if (suit == 'Wyrms') {
			//Test end condition of a "passable" space beyond.
			if (!checkLocation(next)) {
				context.message.log("Can't push off the board",-3);
				return false;
			}

			if (!checkPassable(suit,next))
				return false;

			//Here we're done and we should proactively move the other meeple.
			context.meeple.move(targetLoc,next,true);
			return true;
		} 

		//WAVES
		if (suit == 'Waves') {
			//Test end condition of an impediment beyond.
			nextRow = next[0];
			nextCol = next[1];

			if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= columns) {
				//The edge is a legit impediment, and we're also done for waves so...
				return true;
			}
			if (checkImpediment([nextRow,nextCol])) {
				//A gap, meeple, or excuse.
				return true;
			}
			//Did not find the expected obstacle so...
		  return false;
		} 

		//Should not end up here.
		return false;
	}

	function checkLocation(loc) {
		//...is on the board.
		if (loc[0] < 0 || loc[1] < 0 || loc[0] >= rows || loc[1] >= columns)
			return false;
		else
			return true;
	}

	function checkAllPassable(suit,meepleLoc,targetLoc) {
		context.message.log("Check all intervening orthogonal cards/spaces are passable...",-3);
		var targetRow = targetLoc[0];
		var targetCol = targetLoc[1];
		var meepleRow = meepleLoc[0];
		var meepleCol = meepleLoc[1];
		var testRow, testCol;

		if (Math.abs(targetRow - meepleRow) > 1) {
			for (testRow = Math.min(targetRow,meepleRow) + 1; testRow < Math.max(targetRow,meepleRow); testRow++) {
				if (!checkPassable(suit,[testRow,targetCol]))
					return false;
			}
		} else if (Math.abs(targetCol - meepleCol) > 1) {
			for (testCol = Math.min(targetCol,meepleCol) + 1; testCol < Math.max(targetCol,meepleCol); testCol++) {
				if (!checkPassable(suit,[targetRow,testCol]))
					return false;
			}
		} else if (suit == 'Moons') {
			//There are no intervening cards, but Moons must have a gap.
			context.message.log("The moon is a harsh mistress",-3);
			return false;
		} 

		//Otherwise there are no intereving cards to fail the test.
		context.message.log("All passable",-3);
		return true;
	}

	function checkImpediment(loc) {
		//Return true on obstacles and gaps.
		if (context.board.getTableau(loc) == -1)
			return true;
		if (context.board.isExcuse(loc))
			return true;
		if (context.meeple.hasMeeple(loc))
			return true;
		return false;
	}

	function checkMeeple(loc,permitIllegal) {
		//Separating out the initial meeple placement checks.

		//Is the position legal?
		if (context.meeple.hasMeeple(loc)) {
			//Meeple stacking.
			context.message.log("Meep meep",-3);
			return false;
		}

		var idx = context.board.getTableau(loc);
		if (idx < 1) {
			//Should be The Excuse rather than a gap.
			context.message.log("No excuse",-3);
			return false;
		}

		var card = context.deck.getCard(idx);
		if (!permitIllegal && card.Rank != 'Ace' && card.Rank != 'CROWN') {
			//Subsequent meeples by setting.
			context.message.log("Need all aces/crowns",-3);
			return false;
		} 

		return true;
	}

	function checkObstacle(loc,excludeLoc) {
		//Return true on obstacles.
		//Option of not testing a particular position.
		if (context.board.equals(loc, excludeLoc))
			return false;
		if (context.board.isExcuse(loc))
			return true;
		if (context.meeple.hasMeeple(loc))
			return true;
		return false;
	}

	function checkPassable(suit,loc) {
		context.message.log("Checking " + loc + " is passable under " + suit,-3);

		if (context.board.isExcuse(loc))
			return false;

		if (context.meeple.hasMeeple(loc))
			return false;

		var idx = context.board.getTableau(loc);
		if (idx == -1 && suit == 'Moons')
			return true;
		else if (idx > -1 && suit != 'Moons')
			return true;
		else
			return false;
	}

	function checkPath(path) {
		//Check passability of an individual knot path.
		for (var p=0; p < path.length; p++) {
			if (!checkPassable('Knots',path[p]))
				return false;
		}
		return true;
	}

	function getNextSpace(targetLoc,meepleLoc) {
		var nextRow, nextCol;
		var targetRow = targetLoc[0];
		var targetCol = targetLoc[1];
		var meepleRow = meepleLoc[0];
		var meepleCol = meepleLoc[1];
		if (targetRow == meepleRow)
			nextRow = meepleRow;
		else if (targetRow > meepleRow)
			nextRow = targetRow + 1;
		else 
			nextRow = targetRow - 1;

		if (targetCol == meepleCol)
			nextCol = meepleCol;
		else if (targetCol > meepleCol)
			nextCol = targetCol + 1;
		else 
			nextCol = targetCol - 1;

		return [nextRow,nextCol];
	}

	function getKnotPaths(meepleLoc,targetLoc) {
		context.message.log("Getting knot paths...",-3);

		var targetRow = targetLoc[0];
		var targetCol = targetLoc[1];
		var meepleRow = meepleLoc[0];
		var meepleCol = meepleLoc[1];
		var paths = [];
		var inters = [];
		var testRow, testCol, path1, path2, path3, addy;

		//Straight lines.
		if (meepleRow == targetRow && Math.abs(meepleCol - targetCol) == 3) {
			for (testCol = Math.min(targetCol,meepleCol) + 1; testCol < Math.max(targetCol,meepleCol); testCol++) {
				inters.push([targetRow,testCol]);
			}
			paths.push(inters);
			return paths;
		}
		if (meepleCol == targetCol && Math.abs(meepleRow - targetRow) == 3) {
			for (testRow = Math.min(targetRow,meepleRow) + 1; testRow < Math.max(targetRow,meepleRow); testRow++) {
				inters.push([testRow,targetCol]);
			}
			paths.push(inters);
			return paths;
		}

		//Around almost a circle.
		// This path might leave the board so we prevent that case.
		if (meepleRow == targetRow && Math.abs(meepleCol - targetCol) == 1) {
			if (meepleRow + 1 < rows)
				paths.push([[meepleRow + 1,meepleCol],[meepleRow + 1,targetCol]]);
			if (meepleRow - 1 >= 0)
				paths.push([[meepleRow - 1,meepleCol],[meepleRow - 1,targetCol]])
			context.message.log("circular path",-3);
			return paths;
		}
		if (meepleCol == targetCol && Math.abs(meepleRow - targetRow) == 1) {
			if (meepleCol + 1 < columns)
				paths.push([[meepleRow,meepleCol + 1],[targetRow,meepleCol + 1]]);
			if (meepleCol - 1 >= 0)
				paths.push([[meepleRow,meepleCol - 1],[targetRow,meepleCol - 1]]);
			context.message.log("circular path",-3);
			return paths;
		}

		//Zig-zagging.
		if (Math.abs(meepleRow - targetRow) == 1 && Math.abs(meepleCol - targetCol) == 2) {
			addy = (targetCol - meepleCol) / 2; 
			path1 = [[meepleRow,meepleCol + addy],[meepleRow,targetCol]];
			path2 = [[meepleRow,meepleCol + addy],[targetRow,meepleCol + addy]];
			path3 = [[targetRow,meepleCol],[targetRow,meepleCol + addy]];
			context.message.log("zigzag",-3);
			return [path1,path2,path3];
		}
		if (Math.abs(meepleRow - targetRow) == 2 && Math.abs(meepleCol - targetCol) == 1) {
			addy = (targetRow - meepleRow) / 2; 
			path1 = [[meepleRow + addy,meepleCol],[targetRow,meepleCol]];
			path2 = [[meepleRow + addy,meepleCol],[meepleRow + addy,targetCol]];
			path3 = [[meepleRow,targetCol],[meepleRow + addy,targetCol]];
			context.message.log("zigzag",-3);
			return [path1,path2,path3];
		}

		//Should not arrive here.
		return [];
	}

	function isKnotTarget(meepleLoc,targetLoc) {
		context.message.log("Checking knot targets...",-2);

		var targetRow = targetLoc[0];
		var targetCol = targetLoc[1];
		var meepleRow = meepleLoc[0];
		var meepleCol = meepleLoc[1];
		//Straight lines.
		if (meepleRow == targetRow && Math.abs(meepleCol - targetCol) == 3)
			return true;
		if (meepleCol == targetCol && Math.abs(meepleRow - targetRow) == 3)
			return true;
		//Around almost a circle.
		if (meepleRow == targetRow && Math.abs(meepleCol - targetCol) == 1)
			return true;
		if (meepleCol == targetCol && Math.abs(meepleRow - targetRow) == 1)
			return true;
		//Zig-zagging.
		if (Math.abs(meepleRow - targetRow) == 1 && Math.abs(meepleCol - targetCol) == 2)
			return true;
		if (Math.abs(meepleRow - targetRow) == 2 && Math.abs(meepleCol - targetCol) == 1)
			return true;

		return false;
	}

	function isOrthogonalTarget(meepleLoc,targetLoc) {
		if (targetLoc[0] != meepleLoc[0] && targetLoc[1] != meepleLoc[1]) {
			context.message.log('Not orthogonal',-2);
			return false;
		}
		return true;
	}

	function isSunTarget(meepleLoc,targetLoc) {
		var targetRow = targetLoc[0];
		var targetCol = targetLoc[1];
		var meepleRow = meepleLoc[0];
		var meepleCol = meepleLoc[1];

		var rowDiff = Math.abs(targetRow - meepleRow);
		var colDiff = Math.abs(targetCol - meepleCol);
		if (rowDiff != colDiff) {
			context.message.log("Not diagonal",-3);
			return false;
		}
		if (rowDiff > 2) {
			context.message.log("Too far to sun",-3);
			return false;
		}
		return true;
	}

})();



context.meeple = (function () {

	let meeps = [];
	let meepTurn = 0;

	return {
		controller: controller,
		get: get,
		getAll: getAll,
		getMeepTurn: getMeepTurn,
		hasMeeple: hasMeeple,
		move:	move,
		moveSelectedTo:	moveSelectedTo,
		set: set,
		setAll: setAll,
		set: set,
		setMeepTurn: setMeepTurn,
		unsetAll: unsetAll
	};

	function controller(previous) {
		//Note that the start player actually places meeples second.
		context.message.log("In the meeple controller after " + previous + ".", -1);

		if (meeps.length == 6) {
			context.game.controller('meeple');
			return;
		}

		if (previous == 'load' && context.game.isSolo()) {
			//Pay no attention to startplayer.
			context.auto.seeder();
			controller('seeder');
			//meepTurn inherited from the initial setting.
			return;
		} else if (previous == 'load') {
			context.message.gamelog("Meeple placement...",1);
			//This will get incremented.
			meepTurn = context.game.getStartPlayer();
			//continue.
		}

		//Make a promise?
		context.io.autoshave();

		//Decide whether we need to increment player.
		//We also increment startplayer because he doesn't start the meepling.
		if (context.game.isSolo()) {
			meepTurn = 0;
		} else {
			//Always increment, including on reload.
			meepTurn = (meepTurn + 1) % 2;
		}
		//continue

		console.log("meepTurn: " + meepTurn);
		//turn message here

		if (context.game.isBot() && meepTurn == 1) {
			context.auto.meepler();
			return;
		} else {
			//function responsible for turning clicks on and off, 
			//and running the controller again.
			humeeple();
			return;
		}
	}

	function get(loc) {
		//Get meeple from meeples by location.
		if (!meeps || !meeps.length)
			return false;

		var mee;
		for (var m = 0; m < meeps.length; m++) {
			mee = meeps[m];
			if (context.board.equals(mee,loc))
				return mee;
		}
		return false;
	}

	function getAll(playa) {
		//Get meeples by playa (probably automaton).
		if (playa !== undefined) {
			return meeps.filter((meep) => meep[2] == playa);
		}	else {
			//Else get the whole meeples object for iteration.
			return meeps;
		}
	}

	function getMeepTurn(loc) {
		return meepTurn;
	}

	function hasMeeple(loc) {
		return !!(get(loc));
	}

	function moveMeep(oldloc,newloc,bounce,auto) {
		var mee;
		for (var m = 0; m < meeps.length; m++) {
			mee = meeps[m];
			if (mee[0] == oldloc[0] && mee[1] == oldloc[1]) {
				mee[0] = newloc[0];
				mee[1] = newloc[1];
				context.message.gamelog((bounce ? "Bounced a" : (auto ? "Automatically moved a" : "Moved")) + " meeple from " + context.message.translate(oldloc) + " to " + context.message.translate(newloc) + ".",2);
				break;
			}
		}
	}

	function moveSelectedTo(loc,auto) {
		var oldloc = context.select.get();
		move(oldloc,loc,null,auto);
	}

	function move(oldloc, newloc, bounce, auto) {
		var oldsel = context.dom.getLocSelector(oldloc);
		var newsel = context.dom.getLocSelector(newloc);
		$(newsel).append($(oldsel + " img"));
		//Also adjust the meeps.  We know there's only one at the old location.
		//When wyrming we bump first so there's always only one at the new location as well.
		moveMeep(oldloc,newloc,bounce,auto);
	}

	function set(loc,forcePurple) {
		//Also returned success or failure to ui handler.
		var currentMeeplacer = forcePurple ? 1 : meepTurn;

		context.message.log("Add meep",-2);
		meeps.push([loc[0],loc[1],currentMeeplacer]);

		context.message.log("Placing meeple on " + loc,-2);
		var sel = context.dom.getLocSelector(loc);
		var meemage = context.dom.getMeeple(forcePurple ? "purple" : context.turn.getColorFromTurn(meepTurn));
		$(sel).append(meemage);
		context.dom.faderIn($(sel + " img"));

		context.message.log("Placed ui meeple",-2);
	}

	function setMeepTurn(theTurn) {
		meepTurn = theTurn;
	}

	function setAll(arry) {
		meeps = arry;

		//Also redisplay meeps.
		var meep,sel,meemage;
		for (var m=0; m<meeps.length; m++) {
			meep = meeps[m];
			sel = context.dom.getLocSelector([meep[0],meep[1]]);
			meemage = context.dom.getMeeple(meep[2] == 1 ? "purple" : "yellow");

			$(sel).append(meemage);
			context.dom.faderIn($(sel + " img"));

			context.message.log("Restored ui meeple at " + context.message.translate([meep[0],meep[1]]),-3);
		}

		context.message.log("Restored all meeples",-2);
	}

	function unsetAll() {
		meeps = [];
		meepTurn = 0;
	}

	/* private */

	function humeeple() {
		//Await UI meepling for meepTurner, then return.
		context.ui.turner(meepTurn, "Place a meeple.");

		context.ui.listen('meeple');
	}

	function inhumeeple() {
		context.auto.meepler();
	}

})();



context.message = (function () {

	return {
		clearLog: clearLog,
		gamelog: gamelog,
		init: init,
		log: log,
		over: over,
		translate: translate,
		turn: turn
	};

	function clearLog() {
		context.ui.unlog();
	}

	function init() {
		//Write the version number somewhere semi-visible to fight with the appcache.
		var span = document.createElement("span");
		span.innerText = " " + version + ".";
		$("#versionP").appendChild(span);
		log("Initializing...",0);
	}
	
	function gamelog(message,level,noCount) {
		/* Log levels 
		 1: game log
		 2: game log, indent
		*/
		context.ui.log(message,(level ? level : 2),noCount);
		log(message,level);
	}
	
	function log(message,level,index) {
		/* Log levels 
		-3: obsolete
		-2: extreme
		-1: chatty
		 0: basic code path
		 1: game log
		 2: game log, indent
		 3: real errors
		*/
		if (!debugging || (!level && level !== 0) || level < debugLevel) return;
		var timestamp = new Date();
		console.log(timestamp.toLocaleTimeString() + ": " + message);
	}

	function over(msg,winOnly) {
		//Game over messaging is more complex.
		if (!winOnly)
			turn(msg,1);
		context.ui.win(msg);
	}

	function translate(loc) {
		//Translate tableau or market location to user-friendly terms.
		const number = loc[0] + 1;
		if (loc[1] < 0) 
			return number;
		else
			return number + "" + letterOrder[loc[1]];
	}

	function turn(msg,level) {
		context.dom.turnMessage(msg);
		if (level) {
			//Also log.
			const turnCount = context.turn.getTurnCount();
			log(msg, level, turnCount);
		}
	}

})();



context.score = (function () {

	let	scores = [{},{}];

	return {
		controller: controller,
		clean: clean,
		get: get,
		init: init,
		selected: selected,
		set: set,
		solo: solo
	};

	function controller(previous) {
		//Previous doesn't matter much here; 
		//this is mostly for reloading resolved games.
		console.log("In the score controller after " + previous);

		if (previous == 'turn') {
			//Move on to scoring.
			context.dom.questionButton();
			context.ui.unturner();
		}

		//All cases.
		context.message.turn('No more moves.');
		context.message.gamelog('No more moves for any player.  Scoring...',1,true);
		assess(previous == 'reload');
	}

	function clean() {
		$("#scoreTable").style.display = "none";
		$$("td.score").forEach(elt => elt.innerText = "");
	}

	function get() {
		//Send scores as array.
		return [Object.values(scores[0]),Object.values(scores[1])];
	}

	function init(starter) {
		$("#scoreTable").style.display = "block";
		var starterColor = (starter === 0 ? 'yellow' : 'purple');
		var otherColor = (starter === 0 ? 'purple' : 'yellow');

		renderHeaders(starterColor, otherColor);

		initScores();
	}

	function initHighScores() {
		//Initialize the data from settings.
		context.message.log("In high score init.", -3);

		var highScore = context.settings.get('highScore');

		for (var s=0; s<suitOrder.length; s++) {
			scores[0][suitOrder[s]] = 0;
			scores[1][suitOrder[s]] = highScore[s];
		}

		//We render immediately because it's weird not to.
		render();
	}

	function initSavedScores(scoreArray) {
		//Set scores from array.
		context.message.log("In saved score init.", -3);

		for (var s=0; s<suitOrder.length; s++) {
			scores[0][suitOrder[s]] = scoreArray[0][s];
			scores[1][suitOrder[s]] = scoreArray[1][s];
		}

		render();
	}

	function initScores() {
		//Initialize the data.
		for (var s=0; s<suitOrder.length; s++) {
			scores[0][suitOrder[s]] = 0;
			scores[1][suitOrder[s]] = 0;
		}
	}

	function selected() {
		var playa = context.turn.getTurn();
		var sel = context.select.get();
		context.message.log("scoring " + sel, -3);
		var idx = context.board.getTableau(sel);
		var card = context.deck.getCard(idx);
		var cardSuits = card.Suits;

		//Can't score the excuse, so there are always suits.
		for (let suit of cardSuits) {
			scores[playa][suit]++;
		}
		render();
	}

	function set(scoreArray) {
		//A version of init for reloading scores.
		context.message.log("In saved score 'set'.", -3);

		$("#scoreTable").style.display = "block";

		if (context.game.isSolo())
			renderHeaders('yellow','Highest');
		else if (context.game.getStartPlayer() === 0)
			renderHeaders('yellow','purple');
		else
			renderHeaders('purple','yellow');

		initSavedScores(scoreArray);
	}

	function solo() {
		//A version of init for testing against your high score.
		context.message.log("In solo score init.", -3);

		$("#scoreTable").style.display = "block";
		renderHeaders('yellow','Highest');

		initHighScores();
	}


	/* private */

	function assess(reloaded) {
		context.message.log("Entering assessor...",-2);
		var solo = context.game.isSolo();
		var msg;
		var toSave = Object.values(scores[0]);

		var yellowSort = Object.values(scores[0]).sort();
		var purpleSort = Object.values(scores[1]).sort();
		var winray = yellowSort.map((item, index) => item - purpleSort[index]).filter((item) => item != 0);
		if (winray.length == 0) {
			//it's a tie
			msg = solo ? "tied" : "It's a tie!";
		} else if (solo) {
			msg = winray[0] > 0 ? "beat" : "failed to beat";
		} else {
			msg = (winray[0] > 0 ? "yellow" : "purple") + " wins!";
		}

		if (solo)
			msg = "You " + msg + " your high score."

		context.message.over(msg,true);
		context.message.turn("Game over.");

		if (solo && winray.length && winray[0] > 0 && !reloaded)
			context.settings.set('highScore',toSave);
	}

	function render() {
		var starter = context.game.getStartPlayer();
		var other = (starter + 1) % 2;
		for (var s=0; s<suitOrder.length; s++) {
			$("tr:nth-child(" + (s + 2) + ") td.startPlayerScore").innerText = scores[starter][suitOrder[s]];
			$("tr:nth-child(" + (s + 2) + ") td.otherPlayerScore").innerText = scores[other][suitOrder[s]];
		}
	}

	function renderHeaders(starterColor, other) {

		var otherColor = other == 'Highest' ? '#666666' : other;

		$("th#startPlayerHeader").innerText = starterColor;
		$("th#startPlayerHeader").style.backgroundColor = starterColor;
		$("th#startPlayerHeader").style.color = starterColor == 'yellow' ? 'black' : 'white';

		$("th#otherPlayerHeader").innerText = other;
		$("th#otherPlayerHeader").style.backgroundColor = otherColor;
		$("th#otherPlayerHeader").style.color = other == 'yellow' ? 'black' : 'white';

	}

})();



context.select = (function () {

	let selected = []; //Don't save selection with the game.

	return {
		get: get,
		set: set,
		unset: unset
	};

	function get() {
		return selected;
	}

	function set(loc) {
		//Unhighlight any old one.
		unglow();

		//Now set and highlight.
		selected = loc;
		context.dom.glow(loc);
	}

	function unset() {
		//Also unhighlight.
		unglow();
		selected = [];
	}

	/* private */ 

	function unglow() {
		if (selected && selected.length)
			context.dom.unglow(selected);
	}

})();



context.settings = (function () {

	return {
		init: init,
		checkForChanges: checkForChanges,
		get: get,
		set: set,
		reset: reset,
		getGame: getGame,
		setGame: setGame
	};

	function init() {
		//Initialize settings during page init.
		context.message.log("Getting settings...",0);
		
		// need magnification to set up the button
		// This is a little awkward but never got cleaned up
		if (get('magnification') == true) {
			$('body').classList.add('magnify');
			$('#plusButton').innerText = "Normal";
		}
		$('#plusButton').addEventListener("click", () => {
			if ($('body').classList.contains('magnify')) {
				$('body').classList.remove('magnify');
				set('magnification',false);
				$('#plusButton').innerText = "Enlarge";
			} else {
				$('body').classList.add('magnify');
				set('magnification',true);
				$('#plusButton').innerText = "Normal";
			}
		});

		//The score table is hardcoded in the index, so init here.
		context.dom.emblackenScores();
		
		//Fill in the rest of the settings form
		$("input#emblacken").checked = get('blackmoons');
		$("input#level" + get('level')).checked = true;
		$("input#" + get('seating')).checked = true;
		$("input#" + get('starting')).checked = true;
	}

	function checkForChanges() {
		//We do set and use all other settings.
		if (get('blackmoons') != $("input#emblacken").checked || 
				get('level') != $("input[name=level]:checked").value || 
				get('seating') != $("input[name=seating]:checked").value || 
				get('starting') != $("input[name=starting]:checked").value 
			 ) {

			context.message.log("Settings change detected.",-1);
			set('blackmoons', ($("input#emblacken").checked).toString());
			set('level', parseInt($("input[name=level]:checked").value),10);
			set('seating', ($("input[name=seating]:checked").value).toString());
			set('starting', ($("input[name=starting]:checked").value).toString());

			context.dom.emblackenScores();

			return true;
		} else {
			return false;
		}
	}

	function get(setting) {
		if (window.localStorage && typeof window.localStorage.getItem(setting) !== 'undefined' && window.localStorage.getItem(setting) !== null) {
			var value;
			try {
				value = window.localStorage.getItem(setting);
			} catch (e) {
				value = defaultSettings[setting];
			}
			if ( setting == 'blackmoons' || setting == 'magnification' )
				value = (value.toLowerCase() === "true");
			if ( setting == 'level' )
				value = parseInt(value,10);
			if ( setting == 'highScore' )
				value = JSON.parse(value);
			//No need to convert the value of seating or starting.
			return value;
		} else {
			return defaultSettings[setting];
		}
	}

	function getGame() {
		//Retrieves a game state string from localStorage or returns the empty string.
		var stateString = "";
		if (window.localStorage && typeof window.localStorage.getItem('state') !== 'undefined' && window.localStorage.getItem('state') !== null) {
			try {
				stateString = window.localStorage.getItem('state');
				context.message.log("Retrieved state from local storage.",0);
			} catch (e) {
				var message = e.message ? " b/c " + e.message : "";
				context.message.log("Failed to retrieve state" + message + ".", 0);
			}
		} else {
			context.message.log("Failed to retrieve state for want of local storage.",0);
		}
console.log(stateString);
		return stateString;
	}

	function set(setting, value) {
		if (window.localStorage) {
			try {
				if (setting == 'highScore')
					window.localStorage.setItem(setting, JSON.stringify(value));
				else
					window.localStorage.setItem(setting, value);
				return true;
			} catch (e) {
				return false;
			}
		} else {
			return false;
		}
	}

	function setGame(stateString) {
		//Saves a pre-processed game state to localStorage.
		if (window.localStorage) {
			try {
				window.localStorage.setItem('state', stateString);
				context.message.log("Saved state to local storage.",0);
				return true;
			} catch (e) {
				var message = e.message ? " b/c " + e.message : "";
				context.message.log("Failed to save state" + message + ".", 0);
				return false;
			}
		} else {
			context.message.log("Failed to save state for want of local storage.",0);
			return false;
		}
 	}

	function unset(setting) {
		if (window.localStorage) {
			try {
				window.localStorage.removeItem(setting);
				return true;
			} catch (e) {
				return false;
			}
		} else {
			return false;
		}
	}

	function reset() {
		//Reset all settings to defaults, shortcutting via localStorage.
		try {
			window.localStorage.clear();
			window.location.reload();
		} catch(e) {
			context.message.log("Failed to clear local storage due to: " + e);
		}
	}

})();
	


context.ui = (function () {

	return {
		clickForExchange: clickForExchange,
		clickForMeeple: clickForMeeple,
		clickForMove: clickForMove,
		init: init,
		initListeners: initListeners,
		listen: listen,
		log: log,
		scaler: scaler,
		skipExchange: skipExchange,
		skipMove: skipMove,
		turner: turner,
		unlisten: unlisten,
		unlog: unlog,
		unturner: unturner,
		win: win
	};

	function clickForExchange(ev) {
		var row, col;

		//If we accidentally clicked a meeple we can ignore the event because the exchange isn't allowed.

		if (ev.target.classList.contains("cardspace") || ev.target.classList.contains("marketspace")) {
			//Evaluate a tableau or market click together
			
			row = parseInt(ev.target.dataset.row,10);
			col = parseInt(ev.target.dataset.col,10);
			context.logic.clickedForExchange([row,col]);
		} 
	}

	function skipExchange(ev) {
		context.select.unset();
		context.ui.unlisten('exchange');
		context.turn.controller('skipex');
	}

	function skipMove(ev) {
		context.select.unset();
		context.auto.passer();
	}

	function clickForMeeple(ev) {
		//Ace checking happens in post.
		if (ev.target.classList.contains("cardspace")) {
			let loc = [parseInt(ev.target.dataset.row,10),parseInt(ev.target.dataset.col,10)]
			context.logic.clickedForMeeple(loc);
		}
	}

	function clickForMove(ev) {
		context.message.log("Prime mover",-2);
		var targot = ev.target;

		//Here it's legal to hit a meeple.
		if (targot.tagName == "IMG") {
			targot = ev.target.parentElement;
		}

		if (targot.classList.contains("cardspace")) {
			var loc = [parseInt(targot.dataset.row,10), parseInt(targot.dataset.col,10)];
			context.logic.clickedForMove(loc);
		}
	}

	function init() {

		//Resize listener.
		//window.onresize = context.ui.scaler;
		var resizeDebouncer;
		window.onresize = function(){
			clearTimeout(resizeDebouncer);
			resizeDebouncer = setTimeout(context.ui.scaler, 100);
		};

		//Game should be correctly sized at this point.
		context.ui.scaler();
	}

	function initListeners() {
		//Separated out to delay the ones that can clash with saved game state.
			
		// set up the click events for the panels
		$('#panelLinks').addEventListener('click', (ev) => {
			context.dom.showPanel(ev);
		});
		$$('.close.button').forEach( el => el.addEventListener('click', () => {
			context.dom.show()
		}
		));
		
		// events for the start/replay/undo/check buttons
		$('#startButton').addEventListener('click', () => {
			context.game.newGame();
		});
		$('#replayButton').addEventListener('click', () => {
			context.game.replay();
		});

		$('#shareButton').addEventListener('click', () => {
			///context.io.shareURL();
			//Temporarily testing as a save button.
			context.io.shareURL();
		});

		// special settings panel events
		$('#resetButton').addEventListener('click', () => {
			context.settings.reset();
		});
		$('div#settingsPanel button.close').addEventListener('click', () => {
			context.settings.checkForChanges();
		});
	}

	function listen(newphase) {
		
		if (newphase == 'meeple') {
			//Initial meeple placement.
			$('#playarea').addEventListener('click', context.ui.clickForMeeple);
		}

		if (newphase == 'move') {
			$('#playarea').addEventListener('click', context.ui.clickForMove);
			$('#question').addEventListener('click', context.ui.skipMove);
		}

		if (newphase == 'exchange') {
			$('#playarea').addEventListener('click', context.ui.clickForExchange);
			$('#question').addEventListener('click', context.ui.skipExchange);
		}

	}

	function log(msg,level,noCount) {
		//ui section of log writer.
		var par = document.createElement(level == 1 ? "p" : "div");
		var count = context.turn.getTurnCount();
		//console.log("ui.logging at level " + level + " and count " + count + " message " + msg);

		if (count && !noCount && level == 1) {
			par.classList.add("indexed");
			par.innerHTML = "<b>" + count + ". </b><span>" + msg + "</span>";
		} else {
			par.innerText = msg;
		}

		$('#gamelog').appendChild(par);
	}

	function scaler() {
		context.message.log("Scaling...",-2);
		/*
			sidebarWidth = 125;
			playarea padding 10px;
			cardSize = [174,124];
			card margin 4px;
			card size for multiplication = [178,128]
			extra row for notation = 24px high or so
			var playheight = rows * 178 + 30 + 30;
			var playwidth = (columns + 3) * 128 + 24;
		*/

		var playheight = 1155;
		var playwidth = 1300;

		var winheight = window.innerHeight;
		var winwidth = window.innerWidth;
		var scale;
		
		// Detecting the media query state
		if (winwidth <= 600) {
			scale = Math.min(
				(winheight - 125) / playheight,
				winwidth / playwidth
			);
		} else {
			scale = Math.min(
				winheight / playheight,
				(winwidth - 100) / playwidth
			);
		}

		context.message.log(winheight + "x" + winwidth + " -> " + scale, -3);

		if (scale < 1) {
			//We don't scale up, only down.
			$("#playarea").style.transform = 'scale(' + scale + ')';
 			$("#playarea").style.transformOrigin = '0 0';
		}
	}

	function turner(playa, msg) {
		var playaCola = playa ? "purple" : "yellow";
		var textCola =  playa ? "white" : "black";

		$("#turner").innerText = playaCola;
		$("#turner").style.color = textCola;
		$("#turner").style.borderColor = playaCola;
		$("#turner").style.backgroundColor = playaCola;

		if (msg)
			context.message.turn(msg);
	}

	function unlisten(oldphase) {
		if (!oldphase) {
			$('#playarea').removeEventListener('click', context.ui.clickForExchange);
			$('#playarea').removeEventListener('click', context.ui.clickForMeeple);
			$('#playarea').removeEventListener('click', context.ui.clickForMove);
			$('#question').removeEventListener('click', context.ui.skipExchange);
			$('#question').removeEventListener('click', context.ui.skipMove);
		}
	
		if (oldphase == 'meeple') {
			//Initial meeple placement.
			$('#playarea').removeEventListener('click', context.ui.clickForMeeple);
		}

		if (oldphase == 'move') {
			$('#playarea').removeEventListener('click', context.ui.clickForMove);
			$('#question').removeEventListener('click', context.ui.skipMove);
		}

		if (oldphase == 'exchange') {
			$('#playarea').removeEventListener('click', context.ui.clickForExchange);
			$('#question').removeEventListener('click', context.ui.skipExchange);
		}
	}

	function unlog() {
		$('#gamelog').innerHTML = "";
	}

	function unturner() {
		$("#turner").innerText = "";
		$("#turner").style.color = 'black';
		$("#turner").style.backgroundColor = 'rgba(128,128,128,0)';
		$("#turner").style.borderColor = 'rgba(128,128,128,0)';
	}

	function win(msg) {
		$("#gameOver p").innerText = msg;
		context.dom.show('gameOver');
	}

})();
	


context.dom = (function () {

	return {
		emblackenScores: emblackenScores, 
		errorizer: errorizer,
		fader: fader,
		faderIn: faderIn,
		getLocSelector: getLocSelector,
		getMeeple: getMeeple,
		glow: glow,
		questionButton: questionButton,
		replayButton: replayButton,
		setImage: setImage,
		show: show,
		showPanel: showPanel,
		turnMessage: turnMessage,
		unglow: unglow,
		unglowAll: unglowAll,
		unlog: unlog,
		unmeeple: unmeeple
	};

	function emblackenScores() {
		var emblacken = context.settings.get('blackmoons');

		$("img#scoreMoon").src = "cards/moons" + (emblacken ? "_black" : "") + ".png";
	}

	function errorizer(errSel) {
		$(errSel).classList.add('error');
		window.setTimeout(function(){
			$(errSel).classList.remove('error');
		},5000);
	}

	function fader(elt) {
		//Used for cards.
		var opacity = 1;
		function decrease () {
      opacity -= 0.05;
      if (opacity <= 0){
        // complete
        elt.style.opacity = 0;
				elt.style.backgroundImage = "";
        elt.style.opacity = 1;
        return true;
      }
      elt.style.opacity = opacity;
      requestAnimationFrame(decrease);
    }
    decrease();
	}

	function faderIn(elt) {
		//Used for meeples.
		var opacity = 0;
		function increase () {
      opacity += 0.05;
      if (opacity >= 1){
        // complete
        elt.style.opacity = 1;
        return true;
      }
      elt.style.opacity = opacity;
      requestAnimationFrame(increase);
    }
    increase();
	}

	function getMeeple(color) {
		var image = document.createElement("img");
		image.src = 'css/meeple-' + color + '.svg';
		//Must fade in.
		image.style.opacity = 0;
		image.classList.add(color);
		return image;
	}

	function glow(loc) {
		//Can also unglow.
		if (loc[1] > -1)
			$("div.cardspace[data-row='" + loc[0] + "'][data-col='" + loc[1] + "']").classList.toggle("selected");
		else
			$("div.marketspace[data-row='" + loc[0] + "']").classList.toggle("selected");
	}

	function questionButton(text) {
		if (text) {
			$("#question").innerText = text;
			$("#question").style.visibility = 'visible';
		} else {
			$("#question").innerText = "";
			$("#question").style.visibility = 'hidden';
		}
	}

	function replayButton(disable) {
		//Activate the replay button.
		$("button#replayButton").disabled = false;
	}

	function setImage(loc,card,reload) {
		var sel;
		if (loc[1] == -1)
			sel = getMarketSelector(loc);
		else
			sel = getLocSelector(loc);

		if (!card) {
			//This means it's not the inital layout, but it may be a reload.
			if (!reload)
				fader($(sel));
			//$(sel).style.backgroundImage = "";
			return;
		}

		setFromSelector(sel,card);
	}

	function setFromSelector(sel,card) {
		var emblacken = context.settings.get('blackmoons');
		var cardImage = card.Image;
		if (emblacken && (card.Suit1 == "Moons" || card.Suit2 == "Moons" || card.Suit3 == "Moons"))
			cardImage = cardImage.split(".png")[0] + "_black.png";

		$(sel).style.backgroundImage = "url('cards/" + cardImage + "')";
	}

	function getLocSelector(loc) {
		if (loc[1] == -1)
			return getMarketSelector(loc);
		else
			return "div#tableau" + loc[0] + "-" + loc[1];
	}

	function getMarketSelector(loc) {
		return "div#market" + loc[0];
	}

	function showPanel(ev) {
		//Get the panel Id and pass it to show.
		if (ev.target.dataset.panel)
			show(ev.target.dataset.panel);
	}

	function show(panelID) {
		//Is it showing?
		var showing = panelID ? !!($("#" + panelID).style.display == "block") : false;
		//Is settings showing?
		var settingsShowing = panelID ? !!($("#settingsPanel").style.display == "block") : false;

		//Hide all.
		$$(".panel").forEach( el => el.style.display = "none" );

		//Toggle requested panel.
		if (panelID && !showing) {
			$("#" + panelID).style.display = "block";
		}
		
		//Were settings showing?
		if (settingsShowing) {
			//We closed it, either en masse or for the toggle, so run the close checker.
			context.settings.checkForChanges();
		}

		//In all cases (this function also closes panels) scroll to top.
		window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
	}


	function turnMessage(msg) {
		$('#message').innerText = msg;
	}

	function unglow(loc) {
		//Pure unglow for inits as well.
		if (loc[1] != -1)
			$("div.cardspace[data-row='" + loc[0] + "'][data-col='" + loc[1] + "']").classList.remove("selected");
		else
			$("div.marketspace[data-row='" + loc[0] + "']").classList.remove("selected");
	}

	function unglowAll() {
		//Clear all selections, e.g., for a new round.  Ideally there would be only one but just in case...
		$$("div.cardspace.selected").forEach(el => el.classList.remove("selected"));
		$$("div.marketspace.selected").forEach(el => el.classList.remove("selected"));
	}
		
	function unlog() {
		$('#gamelog').innerHTML = "";
	}
		
	function unmeeple() {
		//Remove any meeples.
		$$("div.cardspace img").forEach(el =>  
			el.remove()
		);
		$$("div.space img").forEach(el =>  
			el.remove()
		);
	}

	function waitForElement(selector) {
		//https://stackoverflow.com/a/61511955
    return new Promise(resolve => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(mutations => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });

      // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
	}
		

})();


})(main);

/* eof */

/* TODO:
 * may still be an endgame turn issue with bot mode
 * IO.
 * turn count may be a bit off in solo games
 * Expand AI levels with a better move choice algorithm, and a "worse" one
 * polyfill sets for ios 16 (test in simulator)
 * hide share button until meeples placed to reduce sharing complications
 * toggle share/save button or autosave?
 * mysterious bot game where bot wouldn't move and yellow could - fixed?
 */
