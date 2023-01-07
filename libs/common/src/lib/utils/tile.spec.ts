import { Dragon, TileKind, Wind } from "../types/tile";
import { distinct } from "./array";
import { createDummySetOfTiles, getDoraFromIndicator, tileKind, tileToUnicode } from "./tile";

describe('Tile utils', () => {
    it('should create a set of tiles', () => {
        const tiles = createDummySetOfTiles();
        expect(tiles.length).toBe(9 + 9 + 9 + 4 + 3);
        expect(tiles.filter(distinct).length).toBe(tiles.length);
        expect(tiles.filter(t => tileKind(t) === TileKind.Man).length).toBe(9);
        expect(tiles.filter(t => tileKind(t) === TileKind.Pin).length).toBe(9);
        expect(tiles.filter(t => tileKind(t) === TileKind.Sou).length).toBe(9);
        expect(tiles.filter(t => tileKind(t) === TileKind.Honor).length).toBe(4 + 3);
    });

    it('should calculate dora', () => {
        expect(getDoraFromIndicator('3m')).toEqual('4m');
    });

    it('should know that trees burn to ash', () => {
        const w = `${Dragon.Haku}${TileKind.Honor}` as const;
        const g = `${Dragon.Hatsu}${TileKind.Honor}` as const;
        const r = `${Dragon.Chun}${TileKind.Honor}` as const;
        // trees burn to ash
        expect(getDoraFromIndicator(g)).toEqual(r);
        expect(getDoraFromIndicator(r)).toEqual(w);
        expect(getDoraFromIndicator(w)).toEqual(g);
    })

    it('should translate tiles to unicode', () => {
        //expect(tileToUnicode(null)).toMatch('🀫');
        //expect(tileToUnicode('--')).toMatch('🀫');
        expect(tileToUnicode(null)).toMatch('🎴');
        expect(tileToUnicode('--')).toMatch('🎴');

        expect(tileToUnicode(`${Wind.East}${TileKind.Honor}`)).toMatch('🀀');
        expect(tileToUnicode(`${Wind.South}${TileKind.Honor}`)).toMatch('🀁');
        expect(tileToUnicode(`${Wind.West}${TileKind.Honor}`)).toMatch('🀂');
        expect(tileToUnicode(`${Wind.North}${TileKind.Honor}`)).toMatch('🀃');
        expect(tileToUnicode(`${Dragon.Chun}${TileKind.Honor}`)).toMatch('🀄');
        expect(tileToUnicode(`${Dragon.Hatsu}${TileKind.Honor}`)).toMatch('🀅');
        expect(tileToUnicode(`${Dragon.Haku}${TileKind.Honor}`)).toMatch('🀆');
        expect(tileToUnicode(`1${TileKind.Man}`)).toMatch('🀇');
        expect(tileToUnicode(`2${TileKind.Man}`)).toMatch('🀈');
        expect(tileToUnicode(`3${TileKind.Man}`)).toMatch('🀉');
        expect(tileToUnicode(`4${TileKind.Man}`)).toMatch('🀊');
        expect(tileToUnicode(`5${TileKind.Man}`)).toMatch('🀋');
        expect(tileToUnicode(`6${TileKind.Man}`)).toMatch('🀌');
        expect(tileToUnicode(`7${TileKind.Man}`)).toMatch('🀍');
        expect(tileToUnicode(`8${TileKind.Man}`)).toMatch('🀎');
        expect(tileToUnicode(`9${TileKind.Man}`)).toMatch('🀏');
        expect(tileToUnicode(`1${TileKind.Sou}`)).toMatch('🀐');
        expect(tileToUnicode(`2${TileKind.Sou}`)).toMatch('🀑');
        expect(tileToUnicode(`3${TileKind.Sou}`)).toMatch('🀒');
        expect(tileToUnicode(`4${TileKind.Sou}`)).toMatch('🀓');
        expect(tileToUnicode(`5${TileKind.Sou}`)).toMatch('🀔');
        expect(tileToUnicode(`6${TileKind.Sou}`)).toMatch('🀕');
        expect(tileToUnicode(`7${TileKind.Sou}`)).toMatch('🀖');
        expect(tileToUnicode(`8${TileKind.Sou}`)).toMatch('🀗');
        expect(tileToUnicode(`9${TileKind.Sou}`)).toMatch('🀘');
        expect(tileToUnicode(`1${TileKind.Pin}`)).toMatch('🀙');
        expect(tileToUnicode(`2${TileKind.Pin}`)).toMatch('🀚');
        expect(tileToUnicode(`3${TileKind.Pin}`)).toMatch('🀛');
        expect(tileToUnicode(`4${TileKind.Pin}`)).toMatch('🀜');
        expect(tileToUnicode(`5${TileKind.Pin}`)).toMatch('🀝');
        expect(tileToUnicode(`6${TileKind.Pin}`)).toMatch('🀞');
        expect(tileToUnicode(`7${TileKind.Pin}`)).toMatch('🀟');
        expect(tileToUnicode(`8${TileKind.Pin}`)).toMatch('🀠');
        expect(tileToUnicode(`9${TileKind.Pin}`)).toMatch('🀡');
    });

    //     it('should translate hands to unicode', () => {
    //         expect(utils.handToUnicode([TileDef.Chun, TileDef.Hatsu, TileDef.Man1, TileDef.Pin2])).toMatch('🀄 🀅 🀇 🀚');
    //     });

    //     it('should make/deconstruct tiles correctly', () => {
    //         for (const suit of [TileSuit.None, TileSuit.Man, TileSuit.Sou, TileSuit.Pin, TileSuit.Wind, TileSuit.Dragon]) {
    //             for (let value = 1; value <= utils.valuesInSuit(suit); value++) {
    //                 const tile = utils.makeTileDef(suit, value);
    //                 expect(utils.getSuitFromTile(tile)).toBe(suit);
    //                 expect(utils.getValueFromTile(tile)).toBe(value);
    //             }
    //         }
    //     });

    //     it('should create new decks', () => {
    //         const deck = utils.createNewDeck();
    //         expect(deck.length).toBe(136);

    //         for (const tile of Object.keys(TileDef).map(k => TileDef[k]).filter(t => t && typeof t === 'number')) {
    //             const numberOfTheseTiles = deck.filter(t => t === tile);
    //             expect(numberOfTheseTiles.length).toBe(4);
    //         }
    //     });
});
