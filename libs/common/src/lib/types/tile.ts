export const enum TileKind {
    Man = 'm',
    Pin = 'p',
    Sou = 's',
    Honor = 'z'
}

export const enum Wind {
    East = '1',
    South = '2',
    West = '3',
    North = '4'
}

export const enum Dragon {
    Haku = '5',
    Hatsu = '6',
    Chun = '7',
}

export type TileRank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type Tile =
    | `${TileRank}${TileKind.Man | TileKind.Pin | TileKind.Sou}`
    | `${Wind | Dragon}${TileKind.Honor}`;

export type UnknownTile = 'xx'
