import { Dragon, Tile, TileKind, TileRank, Wind } from '../types/tile';
import { randomNumberGenerator } from './random';

export function createDummySetOfTiles(): Tile[] {
    return [
        '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m',
        '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p',
        '1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s',
        '1z', '2z', '3z', '4z',
        '5z', '6z', '7z'
    ];
}

export function tileKind(tile: Tile): TileKind {
    return tile[1] as TileKind;
}

export function tileRank(tile: Tile): TileRank {
    return tile[0] as TileRank;
}

export function tileValue(tile: Tile): number {
    return +tile[0];
}

export function buildTile(kind: TileKind | string, rank: TileRank | string): Tile {
    switch (kind) {
        case TileKind.Man:
        case TileKind.Pin:
        case TileKind.Sou:
            if (rank !== '1' && rank !== '2' && rank !== '3' && rank !== '4' && rank !== '5' && rank !== '6' && rank !== '7' && rank !== '8' && rank !== '9') {
                throw new Error('Tile rank is out of range');
            }
            return `${rank}${kind}`;
        case TileKind.Honor:
            if (rank !== '1' && rank !== '2' && rank !== '3' && rank !== '4' && rank !== '5' && rank !== '6' && rank !== '7') {
                throw new Error('Tile rank is out of range');
            }
            return `${rank}${kind}`;
        default:
            throw new Error('Tile kind is out of range');
    }
}

export function getDoraFromIndicator(indicator: Tile): Tile {
    if (tileKind(indicator) === TileKind.Honor) {
        switch (tileRank(indicator)) {
            case Wind.East: return `${Wind.South}${TileKind.Honor}`;
            case Wind.South: return `${Wind.West}${TileKind.Honor}`;
            case Wind.West: return `${Wind.North}${TileKind.Honor}`;
            case Wind.North: return `${Wind.East}${TileKind.Honor}`;
            case Dragon.Haku: return `${Dragon.Hatsu}${TileKind.Honor}`;
            case Dragon.Hatsu: return `${Dragon.Chun}${TileKind.Honor}`;
            case Dragon.Chun: return `${Dragon.Haku}${TileKind.Honor}`;
        }
    }

    return buildTile(tileKind(indicator), (tileValue(indicator) % 9 + 1).toString());
}

export function createNewDeck(rng?: Iterator<number>): Tile[] {
    const deck = [...createDummySetOfTiles(), ...createDummySetOfTiles(), ...createDummySetOfTiles(), ...createDummySetOfTiles()];

    rng ??= randomNumberGenerator();

    return deck
        .map(tile => ({ tile, v: rng?.next().value }))
        .sort((t1, t2) => t1.v - t2.v)
        .map(t => t.tile);
}

export function allSuitsPresent(tiles: readonly Tile[]) {
    const presentSuits = tiles.map(t => t[0]);
    return [TileKind.Man, TileKind.Pin, TileKind.Sou].every(suit => presentSuits.includes(suit));
}

export function tileToUnicode(tile: Tile | null | '--') {
    if (tile && tile !== '--') {
        switch (tileKind(tile)) {
            case TileKind.Man: return String.fromCodePoint(0x1F006 + tileValue(tile));
            case TileKind.Sou: return String.fromCodePoint(0x1F00F + tileValue(tile));
            case TileKind.Pin: return String.fromCodePoint(0x1F018 + tileValue(tile));
            case TileKind.Honor:
                switch (tileRank(tile)) {
                    case Dragon.Haku: return String.fromCodePoint(0x1F006);
                    case Dragon.Hatsu: return String.fromCodePoint(0x1F005);
                    case Dragon.Chun: return String.fromCodePoint(0x1F004);
                    default: return String.fromCodePoint(0x1EFFF + tileValue(tile));
                }
        }
    }
    return String.fromCodePoint(0x1F3B4); //String.fromCodePoint(0x1F02B);
}

// export function handToUnicode(tiles: TileDef[]) {
//     return tiles.map(tileToUnicode).join(' ');
// }
