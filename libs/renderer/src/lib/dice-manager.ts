import * as CANNON from 'cannon-es';
import * as THREE from 'three';

import { TILE_DEPTH_2, TILE_HEIGHT_2, TILE_WIDTH_2, TileInstance } from './tile-instance';

export const DIE_SIZE = 0.016;
export const DIE_MASS = 0.0041;

const PROFILE_SIMULATION = false;

const P = +1;
const N = -1;
const rotateValueToSide: (number[] | undefined)[][] = [
    [], //  x       1          2          3          4          5          6
    /* 1 */[[], undefined, [0, 0, P], [N, 0, 0], [P, 0, 0], [0, 0, N], [P, 0, 0]],
    /* 2 */[[], [0, 0, N], undefined, [0, N, 0], [0, P, 0], [0, 0, N], [0, 0, 1]],
    /* 3 */[[], [P, 0, 0], [0, P, 0], undefined, [P, 0, 0], [0, N, 0], [N, 0, 0]],
    /* 4 */[[], [N, 0, 0], [0, N, 0], [0, P, 0], undefined, [0, P, 0], [P, 0, 0]],
    /* 5 */[[], [0, 0, 1], [0, P, 0], [0, P, 0], [0, N, 0], undefined, [0, 0, N]],
    /* 6 */[[], [0, 0, N], [0, 0, N], [P, 0, 0], [N, 0, 0], [0, 0, P], undefined],
];

function getDisplayedValue(dieBody: CANNON.Body) {
    const points = [
        /* 1 */ new CANNON.Vec3(0, N, 0),
        /* 2 */ new CANNON.Vec3(P, 0, 0),
        /* 3 */ new CANNON.Vec3(0, 0, P),
        /* 4 */ new CANNON.Vec3(0, 0, N),
        /* 5 */ new CANNON.Vec3(N, 0, 0),
        /* 6 */ new CANNON.Vec3(0, P, 0),
    ]

    const translatedPoints = points.map(p => dieBody.pointToWorldFrame(p).y);
    return translatedPoints.indexOf(Math.max(...translatedPoints)) + 1;
}

export function createDiceAnimation(dice: readonly Die[], values: readonly number[], tiles: readonly TileInstance[]): THREE.AnimationAction[] {
    //const diceBodyMaterial = new CANNON.Material();
    //const floorBodyMaterial = new CANNON.Material();
    //const barrierBodyMaterial = new CANNON.Material();
    const tileShape = new CANNON.Box(new CANNON.Vec3(TILE_WIDTH_2, TILE_HEIGHT_2, TILE_DEPTH_2));
    //const tileMaterial = new CANNON.Material();

    const perfStart = performance.now();
    const world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0),
        broadphase: new CANNON.NaiveBroadphase(),
        allowSleep: true,
    });

    const floorBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Plane(),
        //material: floorBodyMaterial,
        type: CANNON.BODY_TYPES.STATIC
    });

    floorBody.quaternion.setFromAxisAngle(
        new CANNON.Vec3(1, 0, 0),
        -Math.PI / 2
    );
    world.addBody(floorBody);

    // world.addContactMaterial(
    //     new CANNON.ContactMaterial(floorBodyMaterial, diceBodyMaterial, { /* friction: 0.01, restitution: 0 .5 */})
    // );
    // world.addContactMaterial(
    //     new CANNON.ContactMaterial(barrierBodyMaterial, diceBodyMaterial, { /* friction: 0, restitution: 1.0  */})
    // );
    // world.addContactMaterial(
    //     new CANNON.ContactMaterial(diceBodyMaterial, diceBodyMaterial, { /* friction: 0, restitution: 0.5  */})
    // );

    for (const tile of tiles) {
        const tileBody = new CANNON.Body({
            mass: 0,
            shape: tileShape,
            //material: tileMaterial,
            // type: CANNON.BODY_TYPES.STATIC
        });

        tileBody.position.set(tile.tile.position.x, tile.tile.position.y, tile.tile.position.z);
        tileBody.quaternion.set(tile.tile.quaternion.x, tile.tile.quaternion.y, tile.tile.quaternion.z, tile.tile.quaternion.w);

        world.addBody(tileBody);
    }

    const dieStartingPoints = dice.map((d, i) => ({
        position: new THREE.Vector3(0.015 + i * 0.040, 0.10 + Math.random() * 0.015, 0.250 + Math.random() * 0.040),
        quaternion: new THREE.Quaternion().random()
    }));

    const dieBodies = dieStartingPoints.map((ds) => {
        const dieBody = new CANNON.Body({
            mass: DIE_MASS,
            shape: new CANNON.Box(new CANNON.Vec3(DIE_SIZE / 2, DIE_SIZE / 2, DIE_SIZE / 2)),
            // material: diceBodyMaterial,
            allowSleep: true,
            type: CANNON.BODY_TYPES.DYNAMIC,
            linearDamping: 0.1,
            angularDamping: 0.1
        });

        dieBody.position.set(ds.position.x, ds.position.y, ds.position.z);
        dieBody.quaternion.set(ds.quaternion.x, ds.quaternion.y, ds.quaternion.z, ds.quaternion.w);
        const xRand = Math.random() * 0.02;
        const yRand = Math.random() * 0.2;
        const zRand = Math.random() * 0.1;
        dieBody.velocity.set(0.025 + xRand, 0.040 + yRand, -1.50 + zRand);
        dieBody.angularVelocity.set(
            20 * Math.random() - 10,
            20 * Math.random() - 10,
            20 * Math.random() - 10
        );
        world.addBody(dieBody);
        return dieBody;
    });

    world.hasActiveBodies = true;

    let time = 0.6;
    const times = [0, time];
    const positionTracks: { x: number, y: number, z: number }[][] = dice.map((d, i) => [
        d.object.position.clone(),
        dieBodies[i].position.clone()
    ]);
    const quaternionTracks: CANNON.Quaternion[][] = dice.map((d, i) => [
        new CANNON.Quaternion(d.object.quaternion.x, d.object.quaternion.y, d.object.quaternion.z, d.object.quaternion.w),
        dieBodies[i].quaternion.clone()
    ]);

    const MAX_FRAMES = 500;
    const STEPS_PER_FRAME = 10;

    for (let frame = 0; frame < MAX_FRAMES && world.hasActiveBodies; frame++) {
        for (let sf = 0; sf < STEPS_PER_FRAME; sf++) {
            world.step(world.default_dt / STEPS_PER_FRAME);
        }
        time += world.default_dt * 4;
        times.push(time);
        for (let di = 0; di < dice.length; di++) {
            const db = dieBodies[di];
            positionTracks[di].push(db.position.clone());
            quaternionTracks[di].push(db.quaternion.clone());
        }
    }
    if (PROFILE_SIMULATION) {
        console.info(
            `simulated die roll in ${Math.ceil(performance.now() - perfStart)}ms, taking ${positionTracks[0].length / 3} frames`,
            dieBodies.map(dieBody => getDisplayedValue(dieBody))
        );
    }

    for (let di = 0; di < dice.length; di++) {
        const dieBody = dieBodies[di];
        const value = values[di];

        const displayedValue = getDisplayedValue(dieBody);

        const rotationAxis = rotateValueToSide[value][displayedValue];
        // console.log(`${displayedValue} was rolled, wanted ${value}`);
        if (rotationAxis) {
            const angle = value + displayedValue === 7 ? Math.PI : Math.PI / 2;
            const rotation = new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(...rotationAxis), angle);
            for (let ti = 1; ti < quaternionTracks[di].length; ti++) {
                quaternionTracks[di][ti] = quaternionTracks[di][ti].mult(rotation);
            }
        }
    }

    return dice.map((d, i) => {
        const mixer = new THREE.AnimationMixer(d.object);
        const positionTrack = new THREE.VectorKeyframeTrack('.position', times, positionTracks[i].map(p => [p.x, p.y, p.z]).flat());
        const quaternionTrack = new THREE.QuaternionKeyframeTrack('.quaternion', times, quaternionTracks[i].map(q => [q.x, q.y, q.z, q.w]).flat());

        const animationClip = new THREE.AnimationClip(undefined, time, [positionTrack, quaternionTrack]);
        const action = mixer.clipAction(animationClip);
        action.setLoop(THREE.LoopOnce, 1);
        mixer.timeScale = 1;
        action.clampWhenFinished = true;
        action.play();
        return action;
    });
}

export class Die {
    constructor(dieMesh: THREE.Group) {
        this.object = dieMesh.clone();

        this.object.receiveShadow = true;
        this.object.castShadow = true;

        this.object.children[0].receiveShadow = true;
        this.object.children[0].castShadow = true;
    }

    readonly object: THREE.Group;
}
