import { Wind } from "@tenfanchombo/common";
import {
    calculateStartOfWall,
    calculateWallFromDiceValue,
    DECK_SIZE,
    findAllInLedger,
    findFirstInLedger,
    GameDocument,
    getDiceValue,
    LogEntryType,
    MoveFunctions,
    PlayerIndex,
    PlayerInfo,
    TileIndex,
    TilePosition
} from "@tenfanchombo/game-core";

export const moveValidators: { [K in keyof MoveFunctions]: MoveFunctions[K] extends (...args: infer P) => void ? (game: GameDocument, callingPlayer: PlayerIndex, ...args: P) => (true | string) : never } = {

    rollDice(game: GameDocument, callingPlayer: PlayerIndex) {
        if (findFirstInLedger(game, LogEntryType.DiceRolled)) {
            return "Dice have already been roled";
        }

        if (game.players[callingPlayer].seatWind !== Wind.East) {
            return "East should roll the dice";
        }

        return true;
    },

    splitWall(game: GameDocument, callingPlayer: PlayerIndex, tileIndex: TileIndex) {
        const diceValue = getDiceValue(game);
        if (!diceValue) {
            return 'Dice have not been rolled yet';
        }

        const splits = findAllInLedger(game, LogEntryType.WallSplit);

        if (splits.length >= 2) {
            // TODO: update this when we handle Kans
            return 'Wall is already split';
        }

        const sideToSplit = calculateWallFromDiceValue(diceValue);
        const playerOnSplittingSide = playerFromWind(game.players, sideToSplit);
        if (playerOnSplittingSide.id !== game.players[callingPlayer].id) {
            return `${playerOnSplittingSide.name} should be splitting the wall`;
        }

        if (splits.length === 0) {
            const startOfWall = calculateStartOfWall(diceValue);
            const placeToSplit = startOfWall - 2;
            if (tileIndex !== placeToSplit) {
                return 'Not the correct place to split the wall. Count the number shown on the dice from the right side of your wall. ' + placeToSplit;
            }
        } else if (splits.length === 1) {
            if (tileIndex != (splits[0].afterTile + DECK_SIZE - 14) % DECK_SIZE) {
                return 'Not the correct place to split the wall. The dead wall should contain 14 tiles';
            }
        }

        return true;
    },

    takeTile(game: GameDocument, callingPlayer: PlayerIndex, tileIndex: TileIndex) {
        if (findAllInLedger(game, LogEntryType.WallSplit).length < 2) {
            return 'Please wait until after the dice have been rolled and the wall has been split before taking tiles';
        }

        // if (game.players.some(p => p.hand.length < 13 && p.melds.length == 0)) {
        //     // we are still dealing, so apply some special handling
        // }

        const nextTileInWall = nextDrawableTile(game);
        if (tileIndex !== nextTileInWall) {
            return 'Wrong tile to take: ' + nextTileInWall;
        }

        return true;
    },

    flipTile(game: GameDocument, callingPlayer: PlayerIndex, tileIndex: TileIndex) {
        const personToFlip = calculateWallFromDiceValue(getDiceValue(game));
        const playerOnSplittingSide = playerFromWind(game.players, personToFlip);
        if (game.players[callingPlayer].seatWind !== personToFlip) {
            return `${playerOnSplittingSide.name} should be flipping the dora`;
        }

        const tileToflip = (calculateStartOfWall(getDiceValue(game)) + DECK_SIZE - 6) % DECK_SIZE;
        if (tileIndex !== tileToflip) {
            return 'Wrong tile to flip';
        }

        return true;
    },

    discard(game: GameDocument, callingPlayer: PlayerIndex, tileIndex: TileIndex) {
        if (game.tiles[tileIndex].position !== TilePosition.Hand || game.tiles[tileIndex].seat !== callingPlayer) {
            return 'Cannot discard a tile you don\'t have';
        }
        // TODO: consider KAN
        if (game.tiles.filter(t => t.position !== TilePosition.Wall && t.seat === callingPlayer).length !== 14) {
            return 'Not your turn to discard';
        }
        return true;
    },

    makeCall(/*game: GameDocument, callingPlayer: PlayerIndex, call: CallType*/) {
        throw new Error("Function not implemented.");
    },

    moveToMeld() {
        return 'Can not meld with training wheels on';
    },

    warnPlayer(/*game: GameDocument, callingPlayer: PlayerIndex, player: PlayerIndex*/) {
        throw new Error("Function not implemented.");
    },

    returnTileToWall(/*game: GameDocument, callingPlayer: PlayerIndex, tileIndex: TileIndex*/) {
        throw new Error("Function not implemented.");
    },

    returnTileToPlayersDiscards(/*game: GameDocument, callingPlayer: PlayerIndex, tileIndex: TileIndex, player: PlayerIndex*/) {
        throw new Error("Function not implemented.");
    },
}

function nextDrawableTile(game: GameDocument): TileIndex | undefined {
    const firstTile = calculateStartOfWall(getDiceValue(game));

    let drawingOrder = new Array(DECK_SIZE).fill(1).map((_, i) => i ^ 1);
    drawingOrder = [...drawingOrder.slice(firstTile ^ 1, DECK_SIZE), ...drawingOrder.slice(0, firstTile ^ 1)];

    return drawingOrder.find(t => game.tiles[t].position === TilePosition.Wall); // TODO: handle empty
}

function playerFromWind(players: readonly PlayerInfo[], wind: Wind): PlayerInfo {
    const playerInfo = players.find(p => p.seatWind === wind)
    if (!playerInfo) {
        throw new Error(`Cannot find a player with that wind: ${wind}`);
    }
    return playerInfo;
}
