import { Tile, Wind } from '@tenfanchombo/common';
import { LogEntry, PlayerIndex, PlayerInfo, TilePosition } from '@tenfanchombo/game-core';

// These interfaces are very similar to the public ones with only a couple 
// properties different. The big difference comes in it's mutability

export interface InternalTileInfo {
    position: TilePosition;
    seat: PlayerIndex;
    index: number;
    rotated: boolean;
    readonly tile: Tile;
    seenBy: readonly PlayerIndex[];
}

/** The internal state of a game that should never be seen by the client */
export interface InternalGameDocument {
    prevelantWind: Wind;
    readonly players: readonly PlayerInfo[];
    tiles: InternalTileInfo[];
    ledger: LogEntry[];
}
