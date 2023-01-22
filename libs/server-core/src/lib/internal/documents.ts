import { Tile, Wind } from '@tenfanchombo/common';
import { LogEntry, PlayerInfo, TilePlacement } from '@tenfanchombo/game-core';

// These interfaces are very similar to the public ones with only a couple 
// properties different. The big difference comes in it's mutability

/** The internal state of a game that should never be seen by the client */
export interface InternalGameDocument {
    prevelantWind: Wind;
    seed: number;
    deckIntegrity: string;
    readonly players: readonly PlayerInfo[];
    tiles: (TilePlacement & { readonly tile: Tile })[];
    ledger: LogEntry[];
}
