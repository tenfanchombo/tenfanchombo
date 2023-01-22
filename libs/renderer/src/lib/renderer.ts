import { DECK_SIZE, GameService, PlayerIndex, TileIndex, TileInfo, TilePosition } from '@tenfanchombo/game-core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper'
import Stats from 'three/examples/jsm/libs/stats.module'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';

import { TestDice } from './dice';
import { TileInstance } from './tile-instance';
import { TilePlaceHolder } from './tile-place-holder';
import { TilePlacementManager } from './tile-placement-manager';

const AMBIENT_LIGHT_INTENSITY = 0.3;
const TABLE_SIZE = 0.6;
const allPlayers: readonly PlayerIndex[] = [0, 1, 2, 3];

export class RiichiRenderer {
    static async create(canvas: HTMLCanvasElement) {
        const renderer = new RiichiRenderer(canvas);
        await renderer.loadScene();
        return renderer;
    }

    private constructor(private readonly canvas: HTMLCanvasElement) {
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });

        this.stats = Stats();
        document.body.append(this.stats.dom);

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.VSMShadowMap;

        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

        window.addEventListener("resize", () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        })

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#111111');

        const loader = new THREE.TextureLoader();
        const texture = loader.load('assets/table.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.LinearFilter;
        const repeats = 7; // tableSize / 100;
        texture.repeat.set(repeats, repeats);

        const planeGeo = new THREE.PlaneGeometry(TABLE_SIZE, TABLE_SIZE);
        const planeMat = new THREE.MeshPhongMaterial({
            map: texture
        });

        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.receiveShadow = true;
        mesh.rotation.x = Math.PI * -.5;
        this.scene.add(mesh);

        const ambient = new THREE.AmbientLight(0xFFFFFF, AMBIENT_LIGHT_INTENSITY);
        this.scene.add(ambient);

        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.castShadow = true;
        light.position.set(1, 1, 0.5);
        this.scene.add(light);
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        light.shadow.bias = -0.001; // TODO: review this value. it is needed as it prevents the striping caused by self-casting shadows
        light.shadow.radius = 3;
        light.shadow.camera.near = 1;
        light.shadow.camera.far = 2;
        light.shadow.camera.left = -0.600;
        light.shadow.camera.right = 0.600;
        light.shadow.camera.top = 0.600;
        light.shadow.camera.bottom = -0.600;

        /*
        const helper = new THREE.DirectionalLightHelper(light);
        this.scene.add(helper);

        const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
        this.scene.add(cameraHelper);
        */

        const fov = 45;
        const near = 0.001;
        const far = 1000;

        this.camera = new THREE.PerspectiveCamera(fov, canvas.clientWidth / canvas.clientHeight, near, far);
        this.camera.updateProjectionMatrix();
        this.camera.position.set(0, 0.650, 0.450);

        //this.controls = new OrbitControls(this.camera, canvas);
        //this.controls.target.set(0, 0, 0);
        //this.controls.update();
        //this.controls.enabled = false;

        this.moveToSeat(this.playerIndex);

        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
            steps: 2,
            depth: 0.01,
            bevelEnabled: true,
            bevelThickness: 0.01,
            bevelSize: 0.01,
            bevelOffset: 0.01,
            bevelSegments: 12,
            curveSegments: 2
        };

        const bumperOutline = new THREE.Shape([
            new THREE.Vector2(-0.301, -0.301),
            new THREE.Vector2(+0.301, -0.301),
            new THREE.Vector2(+0.301, +0.301),
            new THREE.Vector2(-0.301, +0.301),
        ]);
        bumperOutline.holes = [new THREE.Shape([
            new THREE.Vector2(-0.3, -0.3),
            new THREE.Vector2(+0.3, -0.3),
            new THREE.Vector2(+0.3, +0.3),
            new THREE.Vector2(-0.3, +0.3),
        ])];
        const bumperMesh = new THREE.ExtrudeGeometry(bumperOutline, extrudeSettings);
        // const bumperMaterial = new THREE.MeshToonMaterial({ color: 0x204020 });
        const bumperMaterial = new THREE.MeshPhongMaterial({ color: 0x204020 });
        const bumpers = new THREE.Mesh(bumperMesh, bumperMaterial);
        bumpers.rotation.x = Math.PI * -.5;
        this.scene.add(bumpers);

        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        document.addEventListener('pointerdown', (event) => {
            console.log(event.button);
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            this.performRayCast();
            if (this.hoveredOverDice) {
                this.gameService?.move.rollDice();
                event.preventDefault();
            }
            if (this.hoveredOverTile && this.onClickTile) {
                this.onClickTile(this.hoveredOverTile.tileIndex);
                event.preventDefault();
            }
            if (this.hoveredOverPlaceholder) {
                const holdingTile = this.gameService?.tiles.findIndex(t => t.position === TilePosition.Palm && t.seat === this.playerIndex) ?? -1;
                if (holdingTile !== -1) {
                    this.gameService?.move.moveTile(holdingTile,
                        {
                            ...this.hoveredOverPlaceholder.placement,
                            flipped: this.hoveredOverPlaceholder.placement.position !== TilePosition.Hand && event.button != 2,
                        });
                    event.preventDefault();
                }
            }
        });

        // const gridHelper = new THREE.GridHelper(1, 100, new THREE.Color(128, 128, 128));
        // gridHelper.material = new THREE.LineDashedMaterial({
        //     dashSize: 0.005,
        //     gapSize: 0.005,
        //     scale: 0.02

        // })
        // this.scene.add(gridHelper);

        //const gridHelper2 = new THREE.GridHelper(1, 10, new THREE.Color(255, 255, 0));
        //this.scene.add(gridHelper2);

        // postprocessing

        this.composer = new EffectComposer(this.renderer);

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        this.highlightPass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
        this.highlightPass.pulsePeriod = 1;
        this.composer.addPass(this.highlightPass);

        this.effectFXAA = new ShaderPass(FXAAShader);
        this.effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        this.composer.addPass(this.effectFXAA);

        this.render();
    }

    private dice: TestDice | undefined;

    get playerIndex() { return this.gameService?.playerIndex ?? 0; }
    onClickTile?: (tileIndex: TileIndex) => void;
    gameService: GameService | undefined;

    moveToSeat(seat: PlayerIndex) {

        this.camera.position.set(0, 0.5842509449129343, 0.35900076188358626);
        this.camera.quaternion.set(-0.5214559994674611, 0, 0, 0.853278173059285);
        // this.controls.c
        return;

        switch (seat) {
            case 0: this.camera.position.set(0, 0.650, 0.450); break;
            case 1: this.camera.position.set(-0.450, 0.650, 0); break;
            case 2: this.camera.position.set(0, 0.650, -0.450); break;
            case 3: this.camera.position.set(0.450, 0.650, 0); break;
        }

        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    updateTile(index: number, tileInfo: TileInfo, splits: TileIndex[]) {
        this.tilePlacementManager.updateSplits(splits);

        this.tiles[index].update(tileInfo);
        const anyInPalm = this.gameService?.tiles.some(t => t.position === TilePosition.Palm && t.seat === this.playerIndex) ?? false;
        for (const placeHolder of this.tilePlaceHolders) {
            placeHolder.object.visible = anyInPalm && (this.gameService?.tiles.every(t => t.seat !== placeHolder.placement.seat || t.position !== placeHolder.placement.position || t.index !== placeHolder.placement.index) ?? false);
            placeHolder.updatePlacement();
        }
    }

    updateDice(values: readonly number[]) {
        this.dice?.roll(values);
    }

    private readonly mouse = new THREE.Vector2();
    private readonly raycaster = new THREE.Raycaster();

    onMouseMove(event: MouseEvent) {
        event.preventDefault();
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }

    private readonly tilePlacementManager = new TilePlacementManager();
    private tiles: TileInstance[] = [];
    private tilePlaceHolders: TilePlaceHolder[] = [];
    private readonly stats: Stats;

    private async loadScene() {
        const tileObj = await this.objLoader.loadAsync("assets/tile.obj");
        const tileTexture = await this.textureLoader.loadAsync('assets/tiles_texture.png');
        const tileTextureNormals = await this.textureLoader.loadAsync('assets/tiles_normals.png');

        this.tiles = new Array(DECK_SIZE).fill(1).map((_, i) => {
            const tile = new TileInstance(i, tileObj, tileTexture, tileTextureNormals, this.tilePlacementManager);
            tile.addToScene(this.scene);
            return tile;
        });
        this.tilePlaceHolders = allPlayers.map(seat => [
            ...new Array(DECK_SIZE / 4).fill(1).map((_, i) =>
                new TilePlaceHolder(tileObj, this.tilePlacementManager, {
                    position: TilePosition.Wall,
                    seat: seat,
                    index: i,
                    rotated: false,
                    flipped: false
                })),
            ...new Array(14).fill(1).map((_, i) =>
                new TilePlaceHolder(tileObj, this.tilePlacementManager, {
                    position: TilePosition.Hand,
                    seat: seat,
                    index: i,
                    rotated: false,
                    flipped: false
                })),
            ...new Array(24).fill(1).map((_, i) =>
                new TilePlaceHolder(tileObj, this.tilePlacementManager, {
                    position: TilePosition.Discards,
                    seat: seat,
                    index: i,
                    rotated: false,
                    flipped: false
                })),
            ...new Array(12).fill(1).map((_, i) =>
                new TilePlaceHolder(tileObj, this.tilePlacementManager, {
                    position: TilePosition.Melds,
                    seat: seat,
                    index: i,
                    rotated: false,
                    flipped: false
                }))
        ]).flat();
        this.scene.add(...this.tilePlaceHolders.map(t => t.object));
        const dieMaterials = await this.mtlLoader.loadAsync("assets/die.mtl");
        dieMaterials.preload();
        this.objLoader.setMaterials(dieMaterials)
        const dieObj = await this.objLoader.loadAsync("assets/die.obj");
        this.dice = new TestDice(this.scene, this.tiles, dieObj);

        this.normalHelper = new VertexNormalsHelper(this.dice.dice[0].object.children[0], 0.0001, 0xff8000);
        // this.scene.add(this.normalHelper);
    }

    private normalHelper?: VertexNormalsHelper;

    private readonly objLoader = new OBJLoader();
    private readonly mtlLoader = new MTLLoader();
    //private readonly controls: OrbitControls;
    private readonly textureLoader = new THREE.TextureLoader();
    private readonly renderer: THREE.WebGLRenderer;
    private readonly composer: EffectComposer;
    private readonly highlightPass: OutlinePass;
    private readonly effectFXAA: ShaderPass;
    private readonly camera: THREE.PerspectiveCamera;
    private readonly scene: THREE.Scene;

    private hoveredOverDice = false;
    private hoveredOverTile: TileInstance | undefined;
    private hoveredOverPlaceholder: TilePlaceHolder | undefined;

    private performRayCast() {
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const holdingTile = this.gameService?.tiles.some(t => t.position === TilePosition.Palm && t.seat === this.playerIndex) ?? false;
        const die = this.dice?.dice.map(d => d.object.children[0]) ?? [];
        const tiles = this.tiles.map(t => t.tile.children[0]);
        const placeHolders = holdingTile
            ? this.tilePlaceHolders?.filter(t => t.object.visible).map(t => t.object)
            : [];

        const objects = holdingTile ? placeHolders : [...die, ...tiles];

        const intersection = this.raycaster.intersectObjects(objects);
        this.hoveredOverDice = intersection.length > 0 && die.includes(intersection[0].object);
        this.hoveredOverTile = !holdingTile && intersection.length > 0 ? this.tiles.find(t => t.tile.children[0] === intersection[0].object) : undefined;
        this.hoveredOverPlaceholder = holdingTile && intersection.length > 0 ? this.tilePlaceHolders.find(t => t.object === intersection[0].object) : undefined;
        this.canvas.style.cursor = (this.hoveredOverDice || this.hoveredOverTile || this.hoveredOverPlaceholder) ? 'pointer' : '';

        if (this.hoveredOverDice) {
            this.highlightPass.selectedObjects = die;
            this.highlightPass.enabled = true;
        } else if (intersection.length) {
            this.highlightPass.selectedObjects = [intersection[0].object];
            this.highlightPass.enabled = true;
        } else {
            this.highlightPass.selectedObjects = [];
            this.highlightPass.enabled = false;
        }
    }

    private render = () => {
        requestAnimationFrame(this.render);
        this.resizeRendererToDisplaySize();

        const canvas = this.renderer.domElement;
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();

        this.performRayCast();

        for (const tile of this.tiles) {
            tile.animateIfNeeded();
        }

        this.dice?.animateIfNeeded();
        this.normalHelper?.update();

        // this.renderer.render(this.scene, this.camera);
        this.composer.render();

        this.stats.update();
    }

    private resizeRendererToDisplaySize() {
        // TODO: what are we comparing to here?
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const needResize = this.canvas.width !== width || this.canvas.height !== height;
        if (needResize) {
            this.renderer.setSize(width, height, false);
            this.highlightPass.setSize(width, height);
            this.composer.setSize(width, height);
            this.effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        }
        return needResize;
    }
}
