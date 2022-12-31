/**
 * Partly inspired by Michael Wolf's threejs-dice: https://github.com/byWulf/threejs-dice
 */

import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { TileInstance, TILE_DEPTH_2, TILE_HEIGHT_2, TILE_WIDTH_2 } from './tile-instance';

const DIE_SIZE = 0.016;
const DIE_MASS = 0.0041;

export function createDiceAnimation(dice: readonly Die[], values: readonly number[], tiles: readonly TileInstance[]): THREE.AnimationAction[] {
    //const diceBodyMaterial = new CANNON.Material();
    //const floorBodyMaterial = new CANNON.Material();
    //const barrierBodyMaterial = new CANNON.Material();
    const tileShape = new CANNON.Box(new CANNON.Vec3(TILE_WIDTH_2, TILE_HEIGHT_2, TILE_DEPTH_2));
    //const tileMaterial = new CANNON.Material();

    const p = performance.now();
    const world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0),
        broadphase: new CANNON.NaiveBroadphase(),
        allowSleep: true,
        
    });
    (world.solver as CANNON.GSSolver).iterations = 1000;
    (world.solver as CANNON.GSSolver).tolerance = 1000;
    console.log(world.solver);

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
        const xRand = 0; // Math.random() * 20;
        const yRand = 0; // Math.random() * 20;
        const zRand = 0; // Math.random() * 20;
        dieBody.velocity.set(0.025 + xRand, 0.040 + yRand, -1.50 + zRand);
        // dieBody.angularVelocity.set(
        //         20 * Math.random() - 10,
        //         20 * Math.random() - 10,
        //         20 * Math.random() - 10
        //     );
        world.addBody(dieBody);
        return dieBody;
    });

    world.hasActiveBodies = true;
    
    let time = 0.6;
    const times = [0, time];
    const positionTracks: number[][] = dice.map((d, i) => [
        ...d.object.position.toArray(),
        ...dieBodies[i].position.toArray()
    ]);
    const quaternionTracks: number[][] = dice.map((d, i) => [
        ...d.object.quaternion.toArray(),
        ...dieBodies[i].quaternion.toArray()
    ]);
    
    const MAX_FRAMES = 500;
    const STEPS_PER_FRAME = 10;
    console.log(world.default_dt);
    for (let frame = 0; frame < MAX_FRAMES && world.hasActiveBodies; frame++) {
        for (let sf = 0; sf < STEPS_PER_FRAME; sf++) {
            world.step(world.default_dt / STEPS_PER_FRAME);
        }

        // world.step(world.default_dt);
        time += world.default_dt * 4;
        times.push(time);
        for (let di = 0; di < dice.length; di++) {
            const db = dieBodies[di];
            positionTracks[di].push(db.position.x, db.position.y, db.position.z);
            quaternionTracks[di].push(db.quaternion.x, db.quaternion.y, db.quaternion.z, db.quaternion.w);
        }
    }
    console.log(`simulated whole world in ${performance.now() - p}, using ${positionTracks[0].length / 3} frames`);

    return dice.map((d, i) => {
        const mixer = new THREE.AnimationMixer(d.object);
        const positionTrack = new THREE.VectorKeyframeTrack('.position', times, positionTracks[i]);
        const quaternionTrack = new THREE.QuaternionKeyframeTrack('.quaternion', times, quaternionTracks[i]);

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
    //readonly faceTexts = ['0', '1', '2', '3', '4', '5', '6'];
    readonly faceTexts = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];

    readonly textMargin = 1.0;
    readonly mass = 300;
    readonly inertia = 13;

    constructor(private readonly labelColor = '#000000', private readonly diceColor = '#ffffff', dieMesh: THREE.Group) {
        /// const box = new THREE.BoxGeometry(DIE_SIZE, DIE_SIZE, DIE_SIZE);
        this.object = dieMesh.clone(); // new THREE.Mesh(box, this.getMaterials());

        this.object.receiveShadow = true;
        this.object.castShadow = true;
        
        this.object.children[0].receiveShadow = true;
        this.object.children[0].castShadow = true;

        this.object.position.set(0, DIE_SIZE / 2, 0);
    }

    createTextTexture(text: string) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const ts = 64;
        canvas.width = canvas.height = ts;
        if (context) {
            context.font = ts / (1 + 2 * this.textMargin) + "pt Arial";
            context.fillStyle = this.diceColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = this.labelColor;
            context.fillText(text, canvas.width / 2, canvas.height / 2);
        }
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    getMaterials() {
        const materials = [];
        for (let i = 0; i < this.faceTexts.length; ++i) {
            const texture = this.createTextTexture(this.faceTexts[i]);

            materials.push(new THREE.MeshPhongMaterial({
                specular: 0x172022,
                color: 0xf0f0f0,
                shininess: 40,
                flatShading: true,
                //shading: THREE.FlatShading,
                map: texture
            }));
        }
        return materials;
    }

    readonly object: THREE.Group;
}


/*
resetBody() {
    this.body.vlambda = new CANNON.Vec3();
    //this.body.collisionResponse = true;
    this.body.position = new CANNON.Vec3();
    this.body.previousPosition = new CANNON.Vec3();
    this.body.initPosition = new CANNON.Vec3();
    this.body.velocity = new CANNON.Vec3();
    this.body.initVelocity = new CANNON.Vec3();
    this.body.force = new CANNON.Vec3();
    //this.body.sleepState = 0;
    //this.body.timeLastSleepy = 0;
    //this.body._wakeUpAfterNarrowphase = false;
    this.body.torque = new CANNON.Vec3();
    this.body.quaternion = new CANNON.Quaternion();
    this.body.initQuaternion = new CANNON.Quaternion();
    this.body.angularVelocity = new CANNON.Vec3();
    this.body.initAngularVelocity = new CANNON.Vec3();
    this.body.interpolatedPosition = new CANNON.Vec3();
    this.body.interpolatedQuaternion = new CANNON.Quaternion();
    this.body.inertia = new CANNON.Vec3();
    this.body.invInertia = new CANNON.Vec3();
    this.body.invInertiaWorld = new CANNON.Mat3();
    //this.body.invMassSolve = 0;
    this.body.invInertiaSolve = new CANNON.Vec3();
    this.body.invInertiaWorldSolve = new CANNON.Mat3();
    //this.body.aabb = new CANNON.AABB();
    //this.body.aabbNeedsUpdate = true;
    this.body.wlambda = new CANNON.Vec3();

    this.body.updateMassProperties();
}

    getUpsideValue() {
        const points = [
            new CANNON.Vec3( 1,  0,  0),
            new CANNON.Vec3(-1,  0,  0),
            new CANNON.Vec3( 0,  1,  0),
            new CANNON.Vec3( 0, -1,  0),
            new CANNON.Vec3( 0,  0,  1),
            new CANNON.Vec3( 0,  0, -1),
        ]

        const translatedPoints = points.map(p => Math.round(this.body.pointToWorldFrame(p).y));
        return translatedPoints.indexOf(Math.max(...translatedPoints));
    }

*/