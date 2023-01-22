import { TilePlacement } from "@tenfanchombo/game-core";
import * as THREE from 'three';

import { TilePlacementManager } from "./tile-placement-manager";

export class TilePlaceHolder {
    constructor(tile: THREE.Group, private readonly tilePlacementManager: TilePlacementManager, public readonly placement: TilePlacement) {
        const geometry = (tile.children[0] as THREE.Mesh).geometry;
        const material = new THREE.MeshPhysicalMaterial({
            roughness: 0.1,
            transmission: 0.9,
            opacity: 0.1,
            color: 0x80ffff,
            vertexColors: false,
        });

        this.object = new THREE.Mesh(geometry, material);
        this.updatePlacement

        //this.object.visible = false;
    }

    updatePlacement() {
        const m = this.tilePlacementManager.tilePlacement(this.placement);
        this.object.position.setFromMatrixPosition(m);
        this.object.rotation.setFromRotationMatrix(m);
    }

    public readonly object: THREE.Mesh;
}
