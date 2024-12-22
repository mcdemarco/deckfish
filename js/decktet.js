//
//  This file was created by Felbrigg Herriot for Adaman and released under a Creative Commons Attribution NonCommercial ShareAlike 3.0 License.
//  It was refactored with multiple decks by M.C.DeMarco for Myrmex.
//

var decktet = {};

(function(context) { 
	
	// source deck of cards--was "deck"; not used?
	var deckIn;

context.create = (function () {

	return {
		deck: deck
	};

	function card(rank, suit1, suit2, suit3, name, face, image, value, deckNo, cardNo) {
		// Create and return a card object
		return {
			Rank: rank,
			Suit1: suit1,
			Suit2: suit2,
			Suit3: suit3,
			Name: name,
			Face: face,
			Image: image,
			FaceUp: false,
			Value: value,
			DeckNo: deckNo,
			Selected: false,
			CardNo: cardNo
		};
	}

	function deck(decks) {
		// Create a new decktet deck
		var deck = new Array();
		for (var d=1;d<=decks;d++) {
			deck.push(card('', '', '', '', 'the EXCUSE', false, 'excuse.png', 0, d, 0));
			deck.push(card('Ace', 'Knots', '', '', 'Ace of Knots', false, '1_ace_knots.png', 1, d, 1));
			deck.push(card('Ace', 'Leaves', '', '', 'Ace of Leaves', false, '1_ace_leaves.png', 1, d, 2));
			deck.push(card('Ace', 'Moons', '', '', 'Ace of Moons', false, '1_ace_moons.png', 1, d, 3));
			deck.push(card('Ace', 'Suns', '', '', 'Ace of Suns', false, '1_ace_suns.png', 1, d, 4));
			deck.push(card('Ace', 'Waves', '', '', 'Ace of Waves', false, '1_ace_waves.png', 1, d, 5));
			deck.push(card('Ace', 'Wyrms', '', '', 'Ace of Wyrms', false, '1_ace_wyrms.png', 1, d, 6));
			deck.push(card('CROWN', 'Knots', '', '', 'the WINDFALL', false, 'crown_knots.png', 10, d, 7));
			deck.push(card('CROWN', 'Leaves', '', '', 'the END', false, 'crown_leaves.png', 10, d, 8));
			deck.push(card('CROWN', 'Moons', '', '', 'the HUNTRESS', true, 'crown_moons.png', 10, d, 9));
			deck.push(card('CROWN', 'Suns', '', '', 'the BARD', true, 'crown_suns.png', 10, d, 10));
			deck.push(card('CROWN', 'Waves', '', '', 'the SEA', false, 'crown_waves.png', 10, d, 11));
			deck.push(card('CROWN', 'Wyrms', '', '', 'the CALAMITY', false, 'crown_wyrms.png', 10, d, 12));
			deck.push(card('2', 'Moons', 'Knots', '', 'the AUTHOR', true, '2_author.png', 2, d, 13));
			deck.push(card('2', 'Suns', 'Wyrms', '', 'the DESERT', false, '2_desert.png', 2, d, 14));
			deck.push(card('2', 'Waves', 'Leaves', '', 'the ORIGIN', false, '2_origin.png', 2, d, 15));
			deck.push(card('3', 'Moons', 'Waves', '', 'the JOURNEY', false, '3_journey.png', 3, d, 16));
			deck.push(card('3', 'Suns', 'Knots', '', 'the PAINTER', true, '3_painter.png', 3, d, 17));
			deck.push(card('3', 'Leaves', 'Wyrms', '', 'the SAVAGE', true, '3_savage.png', 3, d, 18));
			deck.push(card('4', 'Wyrms', 'Knots', '', 'the BATTLE', false, '4_battle.png', 4, d, 19));
			deck.push(card('4', 'Moons', 'Suns', '', 'the MOUNTAIN', false, '4_mountain.png', 4, d, 20));
			deck.push(card('4', 'Waves', 'Leaves', '', 'the SAILOR', true, '4_sailor.png', 4, d, 21));
			deck.push(card('5', 'Suns', 'Waves', '', 'the DISCOVERY', false, '5_discovery.png', 5, d, 22));
			deck.push(card('5', 'Moons', 'Leaves', '', 'the FOREST', false, '5_forest.png', 5, d, 23));
			deck.push(card('5', 'Wyrms', 'Knots', '', 'the SOLDIER', true, '5_soldier.png', 5, d, 24));
			deck.push(card('6', 'Moons', 'Waves', '', 'the LUNATIC', true, '6_lunactic.png', 6, d, 25));
			deck.push(card('6', 'Leaves', 'Knots', '', 'the MARKET', false, '6_market.png', 6, d, 26));
			deck.push(card('6', 'Suns', 'Wyrms', '', 'the PENITENT', true, '6_penitent.png', 6, d, 27));
			deck.push(card('7', 'Suns', 'Knots', '', 'the CASTLE', false, '7_castle.png', 7, d, 28));
			deck.push(card('7', 'Waves', 'Wyrms', '', 'the CAVE', false, '7_cave.png', 7, d, 29));
			deck.push(card('7', 'Moons', 'Leaves', '', 'the CHANCE MEETING', false, '7_chance_meeting.png', 7, d, 30));
			deck.push(card('8', 'Wyrms', 'Knots', '', 'the BETRAYAL', false, '8_betrayal.png', 8, d, 31));
			deck.push(card('8', 'Moons', 'Suns', '', 'the DIPLOMAT', true, '8_diplomat.png', 8, d, 32));
			deck.push(card('8', 'Waves', 'Leaves', '', 'the MILL', false, '8_mill.png', 8, d, 33));
			deck.push(card('9', 'Waves', 'Wyrms', '', 'the DARKNESS', false, '9_darkness.png', 9, d, 34));
			deck.push(card('9', 'Leaves', 'Knots', '', 'the MERCHANT', true, '9_merchant.png', 9, d, 35));
			deck.push(card('9', 'Moons', 'Suns', '', 'the PACT', false, '9_pact.png', 9, d, 36));
			deck.push(card('PAWN', 'Waves', 'Leaves', 'Wyrms', 'the BORDERLAND', false, 'pawn_borderland.png', 11, d, 37));
			deck.push(card('PAWN', 'Moons', 'Suns', 'Leaves', 'the HARVEST', false, 'pawn_harvest.png', 11, d, 38));
			deck.push(card('PAWN', 'Suns', 'Waves', 'Knots', 'the LIGHT KEEPER', true, 'pawn_light_keeper.png', 11, d, 39));
			deck.push(card('PAWN', 'Moons', 'Wyrms', 'Knots', 'the WATCHMAN', true, 'pawn_watchman.png', 11, d, 40));
			deck.push(card('COURT', 'Moons', 'Waves', 'Knots', 'the CONSUL', true, '11_court_consul.png', 12, d, 41));
			deck.push(card('COURT', 'Suns', 'Waves', 'Wyrms', 'the ISLAND', false, '11_court_island.png', 12, d, 42));
			deck.push(card('COURT', 'Moons', 'Leaves', 'Wyrms', 'the RITE', false, '11_court_rite.png', 12, d, 43));
			deck.push(card('COURT', 'Suns', 'Leaves', 'Knots', 'the WINDOW', false, '11_court_window.png', 12, d, 44));
		}
		return deck;
	}

})();

context.remove = (function () {

	return {
		card: card,
		cardByDeck: cardByDeck,
		rank: rank,
		rankByDeck: rankByDeck,
		rankBySuit: rankBySuit,
		theExcuse: theExcuse,
		pawns: pawns,
		courts: courts
	};

	function card(deck, theName) {
		// remove all instances of a card from the deck by using its name
		for (var i = 0; i < deck.length; i++) {
			if (deck[i].Name == theName) {
				deck.splice(i, 1);
			}
		}
		return deck;
	}

	function cardByDeck(deck, theName, deckNo) {
		// remove one instance of a card from one deck by using its name and deck number
		for (var i = 0; i < deck.length; i++) {
			if (deck[i].Name == theName && deck[i].DeckNo == deckNo) {
				deck.splice(i, 1);
				break;
			}
		}
		return deck;
	}

	function rank(deck,rank) {
		// remove cards of a particular rank
		for (var i = deck.length-1; i >= 0 ; i--) {
			if (deck[i].Rank == rank) {
				deck.splice(i, 1);
			}
		}
		return deck;
	}

	function rankByDeck(deck,rank,deckNo) {
		// remove cards of a particular rank from a single deck
		for (var i = deck.length-1; i >= 0 ; i--) {
			if (deck[i].Rank == rank && deck[i].DeckNo == deckNo) {
				deck.splice(i, 1);
			}
		}
		return deck;
	}

	function rankBySuit(deck,rank,suit) {
		// remove cards of a particular rank and suit, for 3x10
		// does not handle multi-suited cards but could
		for (var i = deck.length-1; i >= 0 ; i--) {
			if (deck[i].Rank == rank && deck[i].Suit1 == suit) {
				deck.splice(i, 1);
			}
		}
		return deck;
	}

	function theExcuse(deck) {
		// remove excuses from a deck
		return card(deck, 'the EXCUSE');
	}

	function pawns(deck) {
		// remove the PAWN cards from the deck
		return rank(deck, 'PAWN');
	}

	function courts(deck) {
		// remove the COURT cards from the deck
		return rank(deck, 'COURT');
	}
	
})();

})(decktet);

/* eof */
