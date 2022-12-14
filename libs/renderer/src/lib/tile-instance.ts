import { TileKind, tileKind, tileValue } from '@tenfanchombo/common';
import { PlayerIndex, TileIndex, TileInfo, TilePosition, WALL_SIZE } from '@tenfanchombo/game-core';
import * as THREE from 'three';

import { TilePlacementManager } from './tile-placement-manager';

export const TILE_HEIGHT = 0.026;
export const TILE_WIDTH = 0.019;
export const TILE_DEPTH = 0.016;

export const TILE_HEIGHT_2 = TILE_HEIGHT / 2;
export const TILE_WIDTH_2 = TILE_WIDTH / 2;
export const TILE_DEPTH_2 = TILE_DEPTH / 2;

export class TileInstance {
    constructor(private readonly tileIndex: TileIndex, tile: THREE.Group, texture: THREE.Texture, normalMap: THREE.Texture, private readonly tilePlacementManager: TilePlacementManager) {
        this.tile = tile.clone();
        this.texture = texture.clone();
        this.normalMap = normalMap.clone();

        this.texture.magFilter = THREE.LinearFilter;
        this.normalMap.magFilter = THREE.LinearFilter;
        this.texture.repeat.set(.1, .25);
        this.normalMap.repeat.set(.1, .25);

        this.texture.offset.set(.9, 0);
        this.normalMap.offset.set(.9, 0);

        this.tile.castShadow = true;
        this.tile.receiveShadow = true;
        this.tile.traverse(child => {
            if (child instanceof THREE.Mesh) {
                const material = new THREE.MeshPhongMaterial({
                    color: 0xFFFFFF,
                    vertexColors: true,
                    map: this.texture,
                    normalMap: this.normalMap
                });

                material.onBeforeCompile = function (shader) {
                    const custom_map_fragment = THREE.ShaderChunk.map_fragment.replace(
                        `diffuseColor *= sampledDiffuseColor;`,
                        `diffuseColor = vec4( mix( diffuse, sampledDiffuseColor.rgb, sampledDiffuseColor.a ), opacity );`
                    );

                    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', custom_map_fragment);
                };

                child.material = material;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        const position = this.tilePlacementManager.tilePlacement(tileIndex, {
            position: TilePosition.Wall,
            seat: Math.floor(tileIndex / WALL_SIZE) as PlayerIndex,
            index: tileIndex % WALL_SIZE,
            rotated: false,
            tile: null,
            public: false
        }, []);
        position.decompose(this.tile.position, this.tile.quaternion, this.tile.scale);
        this.tile.position.setY(this.tile.position.y - TILE_HEIGHT * 3);
    }

    public readonly tile: THREE.Group;
    private readonly texture: THREE.Texture;
    private readonly normalMap: THREE.Texture;

    private animationClock?: THREE.Clock;
    private animationAction?: THREE.AnimationAction;

    private animate(target: THREE.Matrix4, liftBy?: number) {
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        target.decompose(position, quaternion, scale);

        const animationMixer = new THREE.AnimationMixer(this.tile);
        animationMixer.timeScale = 3;
        const positionTrack = !liftBy ? new THREE.VectorKeyframeTrack('.position', [0, 1], [
            ...this.tile.position.toArray(),
            ...position.toArray(),
        ]) : new THREE.VectorKeyframeTrack('.position', [0, 0.25, 1], [
            ...this.tile.position.toArray(),
            this.tile.position.x, this.tile.position.y + liftBy, this.tile.position.z,
            ...position.toArray(),
        ]);
        const quaternionTrack = new THREE.QuaternionKeyframeTrack('.quaternion', [0, 1], [
            ...this.tile.quaternion.toArray(),
            ...quaternion.toArray(),
        ]);

        const animationClip = new THREE.AnimationClip(undefined, 1, [positionTrack, quaternionTrack]);
        this.animationAction = animationMixer.clipAction(animationClip);
        this.animationAction.setLoop(THREE.LoopOnce, 1);
        this.animationAction.clampWhenFinished = true;
        this.animationAction.play();
        this.animationClock = new THREE.Clock();
    }

    animateIfNeeded() {
        if (this.animationClock && this.animationAction) {
            this.animationAction.getMixer().update(this.animationClock.getDelta());
            if (!this.animationAction.enabled) {
                this.animationAction = undefined;
                this.animationClock = undefined;
            }
        }
    }

    private lastTileInfo?: TileInfo;

    private shouldLift(info: TileInfo) {
        if (!this.lastTileInfo) return false;
        if (info.position === TilePosition.Wall) {
            return this.lastTileInfo.position !== info.position
                || this.lastTileInfo.index !== info.index
                || this.lastTileInfo.tile !== info.tile
        }
        return this.lastTileInfo.position !== info.position
            || this.lastTileInfo.index !== info.index
            || this.lastTileInfo.public !== info.public;
    }

    update(info: TileInfo, wallSplits: TileIndex[]) {
        const matrix = this.tilePlacementManager.tilePlacement(this.tileIndex, info, wallSplits);

        this.animate(matrix, this.shouldLift(info) ? TILE_HEIGHT * 2 : 0);

        this.lastTileInfo = { ...info };

        if (info.tile === null) {
            this.texture.offset.set(.9, 0);
            this.normalMap.offset.set(.9, 0);
        } else {
            const v = (tileValue(info.tile) - 1) / 10;
            const k = ({
                [TileKind.Man]: .75,
                [TileKind.Pin]: .5,
                [TileKind.Sou]: .25,
                [TileKind.Honor]: 0,
            } as Record<TileKind, number>)[tileKind(info.tile)];
            this.texture.offset.set(v, k);
            this.normalMap.offset.set(v, k);
        }
    }

    addToScene(scene: THREE.Scene) {
        scene.add(this.tile);
    }
}
