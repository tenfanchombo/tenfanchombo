import { Tile, Wind } from "@tenfanchombo/common";
import { LogEntry } from "./log-entry";

// ================================================
//  This file only contains PUBLIC documents
// ================================================

export type TileIndex = number;
export type PlayerIndex = 0 | 1 | 2 | 3;

export interface PlayerInfo {
    readonly name: string;
    readonly id: string;
    readonly avatarUrl: string;
    readonly seatWind: Wind;
    readonly points: number;
}

export const enum TilePosition {
    Wall = 'wall',
    Hand = 'hand',
    Discards = 'discards',
    Palm = 'palm',
    Melds = 'melds',
}

export interface TileInfo {
    readonly position: TilePosition;
    readonly seat: PlayerIndex;
    readonly index: number;
    readonly rotated: boolean;
    readonly tile: Tile | null;
}

/**
 * The state of the game as seen by the document's owner
 */
export interface GameDocument {
    readonly prevelantWind: Wind;
    readonly players: readonly PlayerInfo[];
    readonly tiles: readonly TileInfo[];
    readonly ledger: readonly LogEntry[];
}
