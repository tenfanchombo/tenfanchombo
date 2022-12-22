import { TileIndex } from "@tenfanchombo/game-core";
import * as CANNON from "cannon-es";
import { DiceManager, Die } from "./dice-manager";
import { TileInstace } from "./tile-instance";

export class TestDice {
    constructor(private readonly world: CANNON.World, scene: THREE.Scene) {

        world.gravity.set(0, -9.82 * 20, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        // world.solver.iterations = 16;

        const diceManager = new DiceManager(world);

        //Floor
        const floorBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane(),
            material: diceManager.floorBodyMaterial
        });
        floorBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(1, 0, 0),
            -Math.PI / 2
        );
        world.addBody(floorBody);

        const colors = ["#ff0000", "#ffff00", "#00ff00", "#0000ff", "#ff00ff"];
        for (let i = 0; i < 2; i++) {
            const die = new Die(diceManager, 20, '#000000', colors[i]);
            scene.add(die.getObject());
            this.dice.push(die);
        }

        // diceManager.prepareValues()

        setInterval(() => {

            const diceValues = [];

            for (let i = 0; i < this.dice.length; i++) {
                
                this.dice[i].getObject().position.x = 15 + i * 40;
                this.dice[i].getObject().position.y = 40 + Math.random() * 15;
                this.dice[i].getObject().position.z = 250 + Math.random() * 40;
                this.dice[i].getObject().quaternion.random();
                this.dice[i].updateBodyFromMesh();
                const xRand = 0; // Math.random() * 20;
                const yRand = 0; // Math.random() * 20;
                const zRand = 0; // Math.random() * 20;
                this.dice[i].body.velocity.set(25 + xRand, 40 + yRand, -150 + zRand);
                this.dice[i].body.angularVelocity.set(
                        20 * Math.random() - 10,
                        20 * Math.random() - 10,
                        20 * Math.random() - 10
                    );

                diceValues.push({ die: this.dice[i], value: i + 1 });
            }

            diceManager.prepareValues(diceValues);
        }, 5000);
    }

    private readonly dice: Die[] = [];

    updatePhysics(delta: number) {
        if (delta) {
            this.world.step(1 / 60);

            for (const die of this.dice) {
                die.updateMeshFromBody();
            }
        }
    }
}