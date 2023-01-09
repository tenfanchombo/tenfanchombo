import { PlayerIndex, TileIndex, TileInfo, TilePosition, WALL_SIZE } from "@tenfanchombo/game-core";
import * as THREE from 'three';

import { TILE_DEPTH, TILE_DEPTH_2, TILE_HEIGHT, TILE_HEIGHT_2, TILE_WIDTH, TILE_WIDTH_2 } from "./tile-instance";

const WALL_FROM_CENTER = 0.2;
const HAND_FROM_CENTER = 0.25;

export class TilePlacementManager {
    private readonly discardAdjustments: THREE.Matrix4[][] = [[], [], [], []];

    tilePlacement(tileIndex: TileIndex, info: TileInfo, wallSplits: TileIndex[]) {
        const m = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), (Math.PI / -2) * info.seat);
        switch (info.position) {
            case TilePosition.Wall: {
                const y = info.index % 2 ? TILE_DEPTH_2 + TILE_DEPTH : TILE_DEPTH_2;
                let x = (Math.ceil(info.index / -2) + 8) * TILE_WIDTH;
                const sideStart = Math.floor(tileIndex / WALL_SIZE) * WALL_SIZE;
                const sideEnd = sideStart + WALL_SIZE;
                const splitsOnThisSide = wallSplits.filter(ti => ti >= sideStart && ti <= sideEnd);

                if (splitsOnThisSide.length > 1) {
                    x += TILE_WIDTH_2;
                }
                const afterSplits = splitsOnThisSide.filter(ti => ti < tileIndex).length;
                x += afterSplits * -TILE_WIDTH_2;

                m.multiply(new THREE.Matrix4().makeTranslation(x, y, WALL_FROM_CENTER));
                if (info.tile === null) {
                    m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
                } else {
                    m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / -2));
                }
                break;
            }
            case TilePosition.Hand: {
                m.multiply(new THREE.Matrix4().makeTranslation((info.index - 8) * TILE_WIDTH, info.public ? TILE_DEPTH_2 : TILE_HEIGHT_2, HAND_FROM_CENTER));
                if (info.public) {
                    m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / -2));
                }
                break;
            }
            case TilePosition.Discards: {
                m.multiply(this.getDiscardMatrix(info.seat, info.index));
                break;
            }
        }
        return m;
    }

    private getDiscardMatrix(seat: PlayerIndex, index: number): THREE.Matrix4 {
        return new THREE.Matrix4().makeTranslation((TILE_WIDTH + 0.001) * ((index % 6) - 2.5), TILE_DEPTH_2, (TILE_HEIGHT + 0.001) * (2.75 + Math.floor(index / 6)))
            .multiply(new THREE.Matrix4().makeRotationX(Math.PI / -2))
            .multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 80 * (Math.random() * 2 - 1)));
        /*
        The above code spreads each discard a little and then applies a random small rotation
        We could persist the calculated placement and the try and fit the next discard closer, creating a more realistic discard pile

        const adjustments = this.discardAdjustments[seat];
        while (adjustments.length <= index) {
            adjustments.push(
                new THREE.Matrix4().makeTranslation((TILE_WIDTH + 0.001) * ((adjustments.length % 6) - 2.5), TILE_DEPTH_2, (TILE_HEIGHT + 0.001) * (2.75 + Math.floor(adjustments.length / 6)))
                    .multiply(new THREE.Matrix4().makeRotationX(Math.PI / -2))
                    .multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 80 * (Math.random() * 2 - 1))));
        }
        return adjustments[index];
        */
    }
}
