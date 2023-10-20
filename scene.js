import { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


//create scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', windowResize, false);

camera.position.z = 5;

const light = new THREE.AmbientLight(0xffffff, 0.85); 
scene.add(light);


// Load Brain
const gltfLoader = new GLTFLoader();
gltfLoader.load(
    '/public/brain/scene.gltf', 
    function (gltf) {
        scene.add(gltf.scene);
        animate(); 
    },
    undefined, 
    function (error) {
        console.error('An error happened', error);
    }
    );


//functions--------------------------------------------------------

function windowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // controls.update();

    renderer.render(scene, camera);
}



