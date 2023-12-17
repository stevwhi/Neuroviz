import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, controls;
let cerebralCortex, subcorticalCortex;
let raycaster, mouse;

let cerebralCortexAreasNames = ['frontalLobe', 'insularCortex', 'limbicLobe', 'occipitalLobe', 'parietalLobe', 'temporalLobe'];
let subcorticalCortexAreasNames = ['basalGanglia', 'brainStem', 'cerebellum', 'commisuralFibres', 'hypothalamus', 'limbicStructures', 'opticalSystem', 'thalamus', 'ventricularSystem'];
let cerebralCortexAreas = [];
let subcorticalCortexAreas = [];


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
    controls.minDistance = 1;
    controls.maxDistance = 25;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    document.addEventListener('mousemove', onMouseMove, false);


    // brain
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/public/Brain/gltf/originBrain(29_11_23).3.glb', function (gltf) {
        const object = gltf.scene;
        console.log('Brain model loaded successfully');
        object.position.set(0, 0, 0);
        object.scale.set(10, 10, 10);
        scene.add(object);

        // This line would lock the camera's orbit around the center (0, 0, 0)
        controls.target.set(0, 0, 0);
        controls.update();

            object.traverse(function (child) {
                if (child.name === "cerebralCortex") {
                    cerebralCortex = child; // Store the cerebralCortex reference

                    cerebralCortex.material = new THREE.MeshPhongMaterial({
                        color: 0x555555, // Adjust color as needed
                        transparent: true,
                        opacity: 1, // Start fully opaque
                    });
                    
                    cerebralCortex.traverse(function (descendant) {
                        if (descendant.isMesh) {
                            descendant.material = new THREE.MeshPhongMaterial({
                                color: 0x555555, // Adjust color as needed
                                transparent: true,
                                opacity: 1, // Start fully opaque
                            });
                        }

                        if (cerebralCortexAreasNames.includes(descendant.name)) {
                            cerebralCortexAreas.push(descendant);

                        }
                    });  
                } else if (child.name === "subcorticalCortex") {
                    subcorticalCortex = child; // Store the subcorticalCortex reference

                    subcorticalCortex.traverse(function (descendant) {
                        if(subcorticalCortexAreasNames.includes(descendant.name)){
                            const colour = getSubcorticalColour(descendant.name);
                            assignSubcorticalColour(descendant, colour);

                            subcorticalCortexAreas.push(descendant);
                           
                        }
                    });   
                }

                
            });
}, undefined, function (error) {
    console.error('An error happened while loading the model:', error);
});


}
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}


document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('opacity-slider').addEventListener('input', function (event) {
        console.log('Slider value:', event.target.value);
        let value = event.target.value;
        setBrainOpacity(value);
    });
});

function setBrainOpacity(opacity) {
    if (cerebralCortex) {
        cerebralCortex.material.opacity = opacity;
        cerebralCortex.traverse(function (descendant) {
            if (descendant.isMesh) {
                descendant.material.opacity = opacity;
                descendant.material.needsUpdate = true;
            }
        });
    }
}


function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    

    checkIntersection();
}

function checkIntersection() {
    raycaster.setFromCamera(mouse, camera);

    const isCortexOpaque = cerebralCortex.material.opacity >= 0.5;
    const areas = isCortexOpaque ? cerebralCortexAreas : subcorticalCortexAreas;


    unhighlightAll(areas);

    // Perform raycasting on all descendants
    const intersects = raycaster.intersectObjects(scene.children, false);
    if (intersects.length > 0) {
        const intersected = intersects[0].object;

        // Find the parent area corresponding to the intersected mesh
        let parentArea = findParentArea(intersected, areas);

        
        
        if (intersected) {
            
            parentArea.traverse(function(child) {
                if (child.isMesh && child.material) {
                    child.material.color.set(0xff0000); // Highlight the child mesh
                }
            });
        }
    }

    
}

function findParentArea(intersected, areas) {
    console.log("Areas array:", areas.map(a => a.name));

    while (intersected) {
        console.log("Checking parent area for:", intersected.name);

        if (areas.includes(intersected)) {
            console.log("Found parent area:", intersected.name);
            return intersected;
        }
        intersected = intersected.parent;
    }
    return null;
}

function unhighlightAll(areas) {
    areas.forEach(area => {
        area.traverse(function(child) {
            if (child.isMesh && child.material) {
                child.material.color.set(0x555555); // Reset to original color
            }
        });
    });
}

function assignSubcorticalColour(subcorticalArea, colour) {
    
    subcorticalArea.traverse(function (descendant) {
        if (descendant.isMesh) {
            descendant.material = new THREE.MeshPhongMaterial({
                color: colour,
                transparent: false,
                opacity: 1,
            });

            descendant.material.needsUpdate = true;
        }
    });
}

function getSubcorticalColour(areaName) {
    const colors = {
        basalGanglia: 0x555555,       // Dark Gray
        brainStem: 0xA0522D,          // Light Brown
        cerebellum: 0x8FBC8F,         // Greenish-Gray
        commisuralFibres: 0xADD8E6,   // Light Blue
        hypothalamus: 0x800080,       // Purple
        limbicStructures: 0xFFB6C1,   // Soft Pink
        opticalSystem: 0xFFFF00,      // Bright Yellow
        thalamus: 0xFFA500,           // Orange
        ventricularSystem: 0x87CEEB   // Sky Blue
    };
    return colors[areaName] || 0x888888; // Default color if no match is found
}

