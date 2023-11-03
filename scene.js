import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

let scene, camera, renderer, controls;

init();
animate();

function init() {
    scene = new THREE.Scene();

    //camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    //renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

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
    //brain
    const objLoader = new OBJLoader();
        objLoader.load('/public/Brain/obj/Brain1.obj', function (object) {
            object.position.set(0, 0, 0);
            object.scale.set(10, 10, 10); 
            scene.add(object);

        });

    //interactivity
    controls = new OrbitControls(camera, renderer.domElement);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}


