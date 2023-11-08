import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, controls;
let cerebrum;

init();
animate();

function init() {
    scene = new THREE.Scene();

    //camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    //renderer
    const container = document.getElementById('threejs-scene-container');
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    // Handling window resize 
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Create a directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);

    // Set the position of the light (adjust the values as needed)
    directionalLight.position.set(0, 1, 0);
    
    // Add the light to the scene
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // soft white light, 0.5 intensity
    scene.add(ambientLight);

    //interactivity
    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 5;
    controls.maxDistance = 25;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;


    // brain
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/public/Brain/gltf/originBrain.glb', function (gltf) {
        const object = gltf.scene;
        console.log('Brain model loaded successfully');
        object.position.set(0, 0, 0);
        object.scale.set(10, 10, 10);
        scene.add(object);

        // This line would lock the camera's orbit around the center (0, 0, 0)
        controls.target.set(0, 0, 0);
        controls.update();

            object.traverse(function (child) {
                if (child.name === "Cerebrum") {
                    cerebrum = child; // Store the cerebrum reference
                    cerebrum.material = new THREE.MeshPhongMaterial({
                        color: 0x555555, // Adjust color as needed
                        transparent: true,
                        opacity: 1 // Start fully opaque
                    });
                    cerebrum.material.needsUpdate = true;
        
                    // Apply material to all cerebrum's children
                    cerebrum.traverse(function (descendant) {
                        if (descendant.isMesh) {
                            descendant.material = cerebrum.material;
                        }
                    });
                }
            });
}, undefined, function (error) {
    console.error('An error happened while loading the model:', error);
});

document.getElementById('opacity-slider').addEventListener('input', function (event) {
    console.log('Slider value:', event.target.value);
    let value = event.target.value;
    setBrainOpacity(value);
});
}


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function setBrainOpacity(opacity) {
    if (cerebrum) {
        cerebrum.material.opacity = opacity;
        cerebrum.traverse(function (descendant) {
            if (descendant.isMesh) {
                descendant.material.opacity = opacity;
            }
        });
    }
}



