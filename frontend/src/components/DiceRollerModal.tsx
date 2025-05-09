// src/components/DiceRollerModal.tsx
import { createSignal, onMount, onCleanup, Show, For, batch, createEffect } from 'solid-js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import styles from './DiceRollerModal.module.css';
import {
    Typography,
} from "@suid/material";

// --- Helper: Load Texture ---
const textureLoader = new THREE.TextureLoader();
function loadTexture(path: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
        textureLoader.load(path, resolve, undefined, reject);
    });
}

interface DiceRollerModalProps {
    isOpen: boolean;
    rollType: string;
    numDice: number;
    target: number;
    onClose: () => void;
}

let diceMaterialPhysics: CANNON.Material;
let groundMaterialPhysics: CANNON.Material;

// --- Dice specific constants ---
const DICE_SIZE = 0.75; // Size of one die
const DICE_MASS = 1;
const DICE_SPACING = 0.1; // Slight spacing when initially placing dice

function DiceRollerModal(props: DiceRollerModalProps) {
    let canvasRef: HTMLCanvasElement | undefined;
    let animationFrameId: number;

    // --- SolidJS Signals ---
    const numDice = props.numDice;
    const [isRolling, setIsRolling] = createSignal(false);
    const [diceResults, setDiceResults] = createSignal<number[]>([]);
    const [isLoadingTextures, setIsLoadingTextures] = createSignal(true);

    // --- Three.js and Cannon-es variables ---
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let world: CANNON.World;
    const diceMeshes: THREE.Mesh[] = [];
    const diceBodies: CANNON.Body[] = [];
    let groundBody: CANNON.Body;
    let groundMesh: THREE.Mesh;
    let diceMaterials: THREE.Material[] = []; // Loaded dice face materials

    // --- Initialize 3D Scene and Physics ---
    const initScene = async () => {
        if (!canvasRef) return;
        setIsLoadingTextures(true);

        // --- Load Dice Face Textures ---
        try {
            const texturePaths = [
                '/textures/dice/dice_1.png', // Right face (+X)
                '/textures/dice/dice_6_red.png', // Left face (-X)
                '/textures/dice/dice_2.png', // Top face (+Y)
                '/textures/dice/dice_5.png', // Bottom face (-Y)
                '/textures/dice/dice_3.png', // Front face (+Z)
                '/textures/dice/dice_4.png'  // Back face (-Z)
            ]; // Adjust paths as needed and face order
            const loadedTextures = await Promise.all(texturePaths.map(loadTexture));
            diceMaterials = loadedTextures.map(texture => new THREE.MeshStandardMaterial({ map: texture }));
            setIsLoadingTextures(false);
        } catch (error) {
            console.error("Failed to load dice textures:", error);
            setIsLoadingTextures(false); // Allow proceeding without textures or show error
            // Create fallback materials if textures fail
             diceMaterials = Array(6).fill(null).map(() => new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }));
        }


        // --- Three.js Scene Setup ---
        scene = new THREE.Scene();
        scene.background = new THREE.Color('rgb(1, 97, 100)'); // Dark grey background

        const aspect = canvasRef.clientWidth / canvasRef.clientHeight;
        camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
        camera.position.set(0, 7, 7); // Position camera to look down
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ canvas: canvasRef, antialias: true });
        renderer.setSize(canvasRef.clientWidth, canvasRef.clientHeight);
        renderer.shadowMap.enabled = true;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        scene.add(directionalLight);

        // --- Cannon-es Physics World Setup ---
        world = new CANNON.World();
        world.gravity.set(0, -30, 0); // Stronger gravity for faster settling
        world.broadphase = new CANNON.NaiveBroadphase(); // Or SAPBroadphase for better performance

        groundMaterialPhysics = new CANNON.Material('groundMaterial');
        diceMaterialPhysics = new CANNON.Material('diceMaterial'); // Assign to the global/scoped variable


        // Physics Materials for collision properties
        const groundMaterial = new CANNON.Material('groundMaterial');
        const contactMaterial = new CANNON.ContactMaterial(groundMaterial, diceMaterialPhysics, {
            friction: 0.1,
            restitution: 0.6, // Bounciness
        });
        world.addContactMaterial(contactMaterial);

        // Ground Plane (Physics and Visual)
        const groundShape = new CANNON.Plane();
        groundBody = new CANNON.Body({ mass: 0, material: groundMaterial }); // Mass 0 makes it static
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotate to be horizontal
        world.addBody(groundBody);

        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMeshMaterial = new THREE.MeshStandardMaterial({ color: "rgb(2, 167, 172)", side: THREE.DoubleSide });
        groundMesh = new THREE.Mesh(groundGeometry, groundMeshMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);

        animate(); // Start animation loop
    };

    // --- Create a single die (mesh and body) ---
    const createDie = (position: CANNON.Vec3) => {
        // Visual Mesh (Three.js)
        const geometry = new THREE.BoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE);
        // The order of materials in this array is important and corresponds to:
        // +X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)
        const mesh = new THREE.Mesh(geometry, diceMaterials.length === 6 ? diceMaterials : new THREE.MeshStandardMaterial({color: 0xcccccc}));
        mesh.castShadow = true;
        scene.add(mesh);
        diceMeshes.push(mesh);

        // Physics Body (Cannon-es)
        const shape = new CANNON.Box(new CANNON.Vec3(DICE_SIZE / 2, DICE_SIZE / 2, DICE_SIZE / 2));
        const body = new CANNON.Body({
            mass: DICE_MASS,
            position: position,
            shape: shape,
            material: diceMaterialPhysics // CORRECTED: Assign the pre-defined dice physics material
        });
        world.addBody(body);
        diceBodies.push(body);
    };

    // --- Clear existing dice ---
    const clearDice = () => {
        diceMeshes.forEach(mesh => scene.remove(mesh));
        diceMeshes.length = 0; // Clear array
        diceBodies.forEach(body => world.removeBody(body));
        diceBodies.length = 0; // Clear array
        setDiceResults([]);
    };

    // --- Roll Dice Logic ---
    const handleRollDice = () => {
        if (isRolling() || isLoadingTextures()) return;
        setIsRolling(true);
        clearDice();

        const count = numDice;
        // Arrange dice in a rough grid or line to prevent initial explosion
        const dicePerRow = Math.ceil(Math.sqrt(count));
        const startX = - (dicePerRow - 1) * (DICE_SIZE + DICE_SPACING) / 2;
        const startZ = - (dicePerRow - 1) * (DICE_SIZE + DICE_SPACING) / 2;

        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / dicePerRow);
            const col = i % dicePerRow;
            const x = startX + col * (DICE_SIZE + DICE_SPACING);
            const z = startZ + row * (DICE_SIZE + DICE_SPACING);
            createDie(new CANNON.Vec3(x, DICE_SIZE * 2 + Math.random() * 2, z)); // Start them a bit above
        }

        // Apply initial random impulses and torques
        diceBodies.forEach(body => {
            body.velocity.set(
                (Math.random() - 0.5) * 10,
                Math.random() * 5 + 2, // Initial upward push
                (Math.random() - 0.5) * 10
            );
            body.angularVelocity.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );
        });

        // Check for results after a delay or when dice settle
        setTimeout(checkDiceSettled, 3000); // Initial check after 3s
    };

    // --- Check if dice have settled and determine results ---
    let settleCheckTimeout: number | undefined;
    const checkDiceSettled = () => {
        if (settleCheckTimeout) clearTimeout(settleCheckTimeout);

        let allSettled = true;
        const results: number[] = [];

        for (const body of diceBodies) {
            const velocityMagnitude = body.velocity.length();
            const angularVelocityMagnitude = body.angularVelocity.length();

            if (velocityMagnitude > 0.1 || angularVelocityMagnitude > 0.2) {
                allSettled = false;
                break;
            }
        }

        if (allSettled) {
            diceBodies.forEach(body => {
                results.push(getDieFaceUp(body));
            });
            batch(() => {
                setDiceResults(results);
                setIsRolling(false);
            });
        } else {
            // Re-check after a short delay
            settleCheckTimeout = setTimeout(checkDiceSettled, 200) as any;
        }
    };

    // --- Get Face Up Value (Crucial Part) ---
    const getDieFaceUp = (diceBody: CANNON.Body): number => {
        // Local vectors for each face normal (relative to the die's center)
        const faceNormalsLocal = [
            new CANNON.Vec3(1, 0, 0),  // Face 1 (+X)
            new CANNON.Vec3(-1, 0, 0), // Face 6 (-X)
            new CANNON.Vec3(0, 1, 0),  // Face 2 (+Y)
            new CANNON.Vec3(0, -1, 0), // Face 5 (-Y)
            new CANNON.Vec3(0, 0, 1),  // Face 3 (+Z)
            new CANNON.Vec3(0, 0, -1)  // Face 4 (-Z)
        ];
        // Corresponding values for these faces
        const faceValues = [1, 6, 2, 5, 3, 4];

        let maxDot = -Infinity;
        let faceUpValue = 0;
        const worldUp = new CANNON.Vec3(0, 1, 0); // World's "up" direction

        for (let i = 0; i < faceNormalsLocal.length; i++) {
            const localNormal = faceNormalsLocal[i];
            // Transform local face normal to world space
            const worldNormal = diceBody.quaternion.vmult(localNormal);
            // Dot product with world's "up" vector
            const dot = worldNormal.dot(worldUp);

            if (dot > maxDot) {
                maxDot = dot;
                faceUpValue = faceValues[i];
            }
        }
        return faceUpValue;
    };


    // --- Animation Loop ---
    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        if (world) {
            world.step(1 / 60); // Fixed time step for physics

            // Sync Three.js meshes with Cannon-es bodies
            for (let i = 0; i < diceMeshes.length; i++) {
                diceMeshes[i].position.copy(diceBodies[i].position as any);
                diceMeshes[i].quaternion.copy(diceBodies[i].quaternion as any);
            }
        }

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    };

    // --- Lifecycle Hooks ---
    onMount(() => {
        if (props.isOpen) {
            // Delay init until modal is visible and canvasRef is sized
            setTimeout(initScene, 50);
        }
    });

    createEffect(() => {
        if (props.isOpen && !renderer) { // If modal opens and scene not yet inited
             setTimeout(initScene, 50);
        } else if (!props.isOpen && renderer) { // If modal closes
            // Consider cleanup
        }
        // Resize handler if modal/canvas size changes (more complex)
    });


    onCleanup(() => {
        cancelAnimationFrame(animationFrameId);
        if (settleCheckTimeout) clearTimeout(settleCheckTimeout);
        clearDice();
        if (renderer) {
            renderer.dispose();
            // scene.traverse(obj => { if (obj.geometry) obj.geometry.dispose(); if (obj.material) obj.material.dispose(); })
        }
        // TODO: More thorough cleanup of Three.js and Cannon-es objects if component is fully unmounted
    });

    return (
        <Show when={props.isOpen}>
            <div class={styles.sidePanel}>
                <button class={styles.closeButton} onClick={props.onClose}>×</button>
                <Typography variant="h4"
                    sx={{
                        fontWeight: 700,
                        fontFamily: '"Share Tech Mono", "Iceland", "Audiowide", "Roboto Mono", monospace',
                        // mr: 2,
                        letterSpacing: 2,
                        mt:-3
                    }}
                >
                    Commander: {props.rollType}
                </Typography>
                <div class={styles.controls}>
                    <button
                        onClick={handleRollDice}
                        disabled={isRolling() || isLoadingTextures()}
                        class={styles.rollButton}
                    >
                        {isLoadingTextures() ? "Loading Textures..." : (isRolling() ? "Rolling..." : "Roll Dice")}
                    </button>
                </div>
                <div class={styles.canvasContainer}>
                    <canvas ref={canvasRef} class={styles.diceCanvas}></canvas>
                </div>
                <Show when={diceResults().length > 0 && !isRolling()}>
                    <div class={styles.results}>
                        <h3>Results:</h3>
                        <div class={styles.diceResultContainer}>
                            <For each={diceResults()}>
                                {(result, i) => <span class={styles.dieResult}>{result}</span>}
                            </For>
                        </div>
                        <p>
                            Total hitting {props.target}+:{' '}
                            {diceResults().filter(val => val >= props.target).length}
                        </p>
                    </div>
                </Show>
            </div>
        </Show>
    );
}

export default DiceRollerModal;