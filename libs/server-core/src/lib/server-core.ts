import { createUnshuffledDeck, RandomNumberGenerator, shuffleTiles, Wind } from "@tenfanchombo/common";
import { GameDocument, MoveFunctions, PlayerIndex, PlayerInfo, TilePosition, WALL_SIZE } from "@tenfanchombo/game-core";
import { SHA256 } from 'crypto-js'

import { InternalGameDocument } from "./internal/documents";
import { moveHandlers } from "./move-handler";
import { DocumentStore } from "./stores";

export function createNewGameDocument(players: readonly PlayerInfo[], seed?: number): InternalGameDocument {
    seed ??= new RandomNumberGenerator().next(0xFFFFFFFF);
    const deck = shuffleTiles(createUnshuffledDeck(), seed);
    return {
        players,
        prevelantWind: Wind.East,
        ledger: [],
        seed,
        deckIntegrity: SHA256(deck.join('')).toString(),
        tiles: deck.map((tile, index) => ({
            position: TilePosition.Wall,
            seat: Math.floor(index / WALL_SIZE) as PlayerIndex,
            index: index % WALL_SIZE,
            rotated: false,
            tile,
            seenBy: []
        }))
    };
}

export function createPlayerGameDocument(game: InternalGameDocument, playerId: string): GameDocument {
    const playerIndex = game.players.findIndex(p => p.id === playerId) as PlayerIndex;

    // InternalGameDocument is mutable and also contains properties that we don't want to accidentally store
    // so explicitly copy each property
    return {
        prevelantWind: game.prevelantWind,
        players: game.players,
        deckIntegrity: game.deckIntegrity,
        tiles: game.tiles.map(tile => ({
            position: tile.position,
            seat: tile.seat,
            index: tile.index,
            rotated: tile.rotated,
            tile: tile.seenBy.includes(playerIndex) ? tile.tile : null,
            public: tile.seenBy.length === 4
        })),
        ledger: [...game.ledger]
    };
}

export function createMoveProxy(gameId: string, playerId: string, store: DocumentStore): MoveFunctions {
    return Object.fromEntries(Object.entries(moveHandlers).map(([name, handler]) => [
        name,
        (...args: unknown[]) => store.update(gameId, (previous) => (<(...args: unknown[]) => void>handler)(previous, previous.players.findIndex(p => p.id === playerId), ...args))
    ])) as unknown as MoveFunctions;
}
