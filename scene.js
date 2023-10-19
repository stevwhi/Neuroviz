
//set scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;  // Set camera distance from the object

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add window resize event listener
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    renderer.setSize(newWidth, newHeight);
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
});

//load brain model

const loader = new THREE.GLTFLoader();

loader.load(
    'path_to_brain_model.gltf',  // Replace with your model's path
    function(gltf) {
        scene.add(gltf.scene);
        animate();  // Start the rendering loop after loading the model
    },
    undefined,
    function(error) {
        console.error("An error occurred while loading the model:", error);
    }
);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}