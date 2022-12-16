import {
    CallType,
    LogEntryType,
    MoveFunctions,
    PlayerIndex,
    TileIndex,
    TilePosition
} from '@tenfanchombo/game-core';
import { InternalGameDocument } from "./internal/documents";

const allPlayers: readonly PlayerIndex[] = [0, 1, 2, 3];

export const moveHandlers: {[K in keyof MoveFunctions]: MoveFunctions[K] extends (...args: infer P) => void ? (game: InternalGameDocument, callingPlayer: PlayerIndex, ...args: P) => void : never } = {
    rollDice(game: InternalGameDocument, callingPlayer: PlayerIndex) {
        // TODO: should we store the seed or current w/x in the InternalGameDocument so this is deterministic?
        game.ledger.push({
            type: LogEntryType.DiceRolled,
            callingPlayer,
            values: [
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1,
            ]
        });
    },

    splitWall(game: InternalGameDocument, callingPlayer: PlayerIndex, tileIndex: TileIndex) {
        const topTile = tileIndex | 1;
        game.ledger.push({
            type: LogEntryType.WallSplit,
            callingPlayer,
            afterTile: topTile
        });
    },

    takeTile(game: InternalGameDocument, callingPlayer: PlayerIndex, tileIndex: TileIndex) {
        game.tiles[tileIndex] = {
            position: TilePosition.Hand,
            seat: callingPlayer,
            index: nextIndex(game, TilePosition.Hand, callingPlayer),
            rotated: false,
            tile: game.tiles[tileIndex].tile,
            seenBy: includePlayer(game.tiles[tileIndex].seenBy, callingPlayer)
        };

        // TODO: reindex player hand if needed

        game.ledger.push({
            type: LogEntryType.TookTile,
            callingPlayer,
            tileIndex
        });
    },

    flipTileInWall(game: InternalGameDocument, callingPlayer: PlayerIndex, tileIndex: TileIndex) {
        // TODO: handle flipping after kan
        game.tiles[tileIndex].seenBy = allPlayers;
        // TODO: handle flipping after kan
        game.ledger.push({
            type: LogEntryType.FlippedTileInWall,
            callingPlayer,
            tileIndex
        });
    },

    discard(game: InternalGameDocument, callingPlayer: PlayerIndex, tileIndex: TileIndex) {
        game.tiles[tileIndex] = {
            position: TilePosition.Discards,
            seat: callingPlayer,
            index: nextIndex(game, TilePosition.Discards, callingPlayer),
            rotated: false,
            tile: game.tiles[tileIndex].tile,
            seenBy: allPlayers
        };

        game.ledger.push({
            type: LogEntryType.DiscardedTile,
            callingPlayer,
            tileIndex
        });
    },

    makeCall(game: InternalGameDocument, callingPlayer: PlayerIndex, call: CallType) {
        throw new Error("Function not implemented.");
    },

    warnPlayer(game: InternalGameDocument, callingPlayer: PlayerIndex, player: PlayerIndex) {
        throw new Error("Function not implemented.");
    },

    returnTileToWall(game: InternalGameDocument, callingPlayer: PlayerIndex, tileIndex: TileIndex) {
        throw new Error("Function not implemented.");
    },

    returnTileToPlayersDiscards(game: InternalGameDocument, callingPlayer: PlayerIndex, tileIndex: TileIndex, player: PlayerIndex) {
        throw new Error("Function not implemented.");
    },
}

function includePlayer(players: readonly PlayerIndex[], player: PlayerIndex) {
    return allPlayers.filter(p => p === player || players.includes(p));
}

function nextIndex(game: InternalGameDocument, position: TilePosition, seat: PlayerIndex) {
    const indexes = game.tiles.filter(t => t.position === position && t.seat === seat).map(t => t.index);
    return indexes.map((_, i) => i).find(i => !indexes.includes(i)) ?? indexes.length
}