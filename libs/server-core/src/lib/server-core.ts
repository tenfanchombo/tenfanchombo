import { createNewDeck, randomNumberGenerator, Wind } from "@tenfanchombo/common";
import { GameDocument, MoveFunctions, PlayerIndex, PlayerInfo, TilePosition, WALL_SIZE } from "@tenfanchombo/game-core";
import { InternalGameDocument } from "./internal/documents";
import { moveHandlers } from "./move-handler";
import { DocumentStore } from "./stores";

export function createNewGameDocument(players: readonly PlayerInfo[], rng: Iterator<number> = randomNumberGenerator()): InternalGameDocument {
    return {
        players,
        prevelantWind: Wind.East,
        ledger: [],
        tiles: createNewDeck(rng).map((tile, index) => ({
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
        (...args: unknown[]) => store.update(gameId, (previous) => (<any>handler)(previous, previous.players.findIndex(p => p.id === playerId), ...args))
    ])) as unknown as MoveFunctions;
}
