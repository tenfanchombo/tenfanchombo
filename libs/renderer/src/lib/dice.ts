import * as THREE from "three";

import { createDiceAnimation, Die, DIE_SIZE } from "./dice-manager";
import { TileInstance } from "./tile-instance";

export class TestDice {
    constructor(scene: THREE.Scene, private readonly tiles: TileInstance[], dieMesh: THREE.Group) {
        for (let i = 0; i < 2; i++) {
            const die = new Die(dieMesh);
            die.object.position.set((i - 0.5) * DIE_SIZE * 2, DIE_SIZE / 2, 0);
            scene.add(die.object);
            this.dice.push(die);
        }
    }

    roll(values: readonly number[]) {
        this.animations = createDiceAnimation(this.dice, values, this.tiles);
        this.animationClock = new THREE.Clock();
    }

    readonly dice: Die[] = [];
    private animations: THREE.AnimationAction[] | undefined;
    private animationClock: THREE.Clock | undefined;

    animateIfNeeded() {
        if (this.animations && this.animationClock) {
            const delta = this.animationClock.getDelta();
            for (const action of this.animations) {
                action.getMixer().update(delta);
            }

            if (!this.animations[0].enabled) {
                this.animations = undefined;
                this.animationClock = undefined;
            }

        }
    }
}
