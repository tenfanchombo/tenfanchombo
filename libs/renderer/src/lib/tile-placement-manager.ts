import { PlayerIndex, TileIndex, TilePlacement, TilePosition, WALL_SIZE } from "@tenfanchombo/game-core";
import * as THREE from 'three';

import { TILE_DEPTH, TILE_DEPTH_2, TILE_HEIGHT, TILE_HEIGHT_2, TILE_WIDTH, TILE_WIDTH_2 } from "./tile-instance";

const WALL_FROM_CENTER = 0.2;
const HAND_FROM_CENTER = 0.25;
const MELDS_FROM_CENTER = 0.267;

export class TilePlacementManager {

    private readonly discardAdjustments: THREE.Matrix4[][] = [[], [], [], []];

    private wallSplits: TileIndex[] = [];

    updateSplits(splits: number[]) {
        this.wallSplits = [...splits];
    }

    tilePlacement(info: TilePlacement) {
        const m = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), (Math.PI / -2) * info.seat);
        switch (info.position) {
            case TilePosition.Wall: {
                const y = info.index % 2 ? TILE_DEPTH_2 + TILE_DEPTH : TILE_DEPTH_2;
                let x = (Math.ceil(info.index / -2) + 8) * TILE_WIDTH;
                const sideStart = info.seat * WALL_SIZE;
                const sideEnd = sideStart + WALL_SIZE;
                const splitsOnThisSide = this.wallSplits.filter(ti => ti >= sideStart && ti <= sideEnd);

                if (splitsOnThisSide.length > 1) {
                    x += TILE_WIDTH_2;
                }
                const afterSplits = splitsOnThisSide.filter(ti => ti < sideStart + info.index).length;
                x += afterSplits * -TILE_WIDTH_2;

                m.multiply(new THREE.Matrix4().makeTranslation(x, y, WALL_FROM_CENTER));
                m.multiply(new THREE.Matrix4().makeRotationX(info.flipped ? Math.PI / -2 : Math.PI / 2));
                break;
            }
            case TilePosition.Hand: {
                m.multiply(new THREE.Matrix4().makeTranslation((info.index - 8) * TILE_WIDTH, info.flipped ? TILE_DEPTH_2 : TILE_HEIGHT_2, HAND_FROM_CENTER));
                if (info.flipped) {
                    m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / -2));
                } else if (info.seat === 0) {
                    // m.multiply(new THREE.Matrix4().makeTranslation(0, 0.1, 0));
                    m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / -2 * 0.9));
                }
                break;
            }
            case TilePosition.Discards: {
                m.multiply(new THREE.Matrix4().makeTranslation((TILE_WIDTH + 0.001) * ((info.index % 6) - 2.5), TILE_DEPTH_2, (TILE_HEIGHT + 0.001) * (2.75 + Math.floor(info.index / 6))));
                m.multiply(new THREE.Matrix4().makeRotationX(info.flipped ? Math.PI / -2 : Math.PI / 2));
                m.multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 80 * (Math.random() * 2 - 1)));
                break;
            }
            case TilePosition.Melds: {
                m.multiply(new THREE.Matrix4().makeTranslation(MELDS_FROM_CENTER - (info.index) * TILE_WIDTH, TILE_DEPTH_2, MELDS_FROM_CENTER));
                if (info.rotated) {
                    m.multiply(new THREE.Matrix4().makeTranslation(-(TILE_HEIGHT_2 - TILE_WIDTH_2), 0, (TILE_HEIGHT_2 - TILE_WIDTH_2)));
                }
                m.multiply(new THREE.Matrix4().makeRotationX(info.flipped ? Math.PI / -2 : Math.PI / 2));
                if (info.rotated) {
                    m.multiply(new THREE.Matrix4().makeRotationZ(Math.PI / -2));
                }
                break;
            }
            case TilePosition.Palm: {
                m.multiply(new THREE.Matrix4().makeTranslation(0.035, 0.5, 0.32));
                m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / -3.2));
                m.multiply(new THREE.Matrix4().makeRotationY(Math.PI / -6));
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
