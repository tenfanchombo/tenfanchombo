import { Pipe, PipeTransform } from "@angular/core";
import { TileIndex, TileInfo, TilePosition, WALL_SIZE } from "@tenfanchombo/game-core";

const TILE_WIDTH = 24 - 1;
const TILE_HEIGHT = 32 - 1;

@Pipe({ name: 'tileTransform', standalone: true }) export class TileTransformPipe implements PipeTransform {
    transform(tile: TileInfo, index: TileIndex, wallSplits: TileIndex[]) {
        let x = 0;
        let y = 0;

        switch (tile.position) {
            case TilePosition.Wall: {
                y = 230;
                x = (Math.ceil(tile.index / -2) + 8) * TILE_WIDTH;

                const sideStart = Math.floor(index / WALL_SIZE) * WALL_SIZE;
                const sideEnd = sideStart + WALL_SIZE;
                const splitsOnThisSide = wallSplits.filter(ti => ti >= sideStart && ti <= sideEnd);

                if (splitsOnThisSide.length > 1) {
                    x += 10;
                }
                const afterSplits = splitsOnThisSide.filter(ti => ti < index).length;
                x += afterSplits * -10;

                if (tile.index % 2 === 1) {
                    x -= 4;
                    y -= 3;
                }
                break;
            }
            case TilePosition.Hand: {
                y = 290;
                x = (tile.index - 7) * TILE_WIDTH;
                break;
            }
            case TilePosition.Discards: {
                y = Math.floor(TILE_HEIGHT * (2.75 + Math.floor(tile.index / 6)));
                x = Math.floor(TILE_WIDTH * ((tile.index % 6) - 2.5));
                break;
            }
            case TilePosition.Palm: {
                break;
            }
            case TilePosition.Melds: {
                break;
            }
        }

        switch (tile.seat) {
            case 0: break;
            case 1: [x, y] = [-y, x]; break;
            case 2: [x, y] = [-x, -y]; break;
            case 3: [x, y] = [y, -x]; break;
        }

        const rotate = `rotate(${tile.seat * 90}deg)`;
        return `translateX(${x}px) translateY(${y}px) ${rotate}`
    }
}
