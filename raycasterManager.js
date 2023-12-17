import * as THREE from 'three';

class RaycasterManager {
    
    constructor(sceneSetup, brainModel) {
        this.sceneSetup = sceneSetup;
        this.brainModel = brainModel;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.setupMouseListeners();
    }

    setupMouseListeners() {
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

            this.checkIntersection();
        });
    }

    checkIntersection() {
        this.raycaster.setFromCamera(this.mouse, this.sceneSetup.camera);
        
        // Get all meshes to test for intersection
        const meshes = this.brainModel.cerebralCortexOpacity >= 0.5 ?
                       this.brainModel.cerebralCortexAreas.flat() :
                       this.brainModel.subcorticalCortexAreas.flat();
        const intersects = this.raycaster.intersectObjects(meshes, true);
        
        if (intersects.length > 0) {
            const intersected = intersects[0].object;
            this.highlightIntersected(intersected);
        } else {
            this.unhighlightAll();
        }
    }

    highlightIntersected(intersected) {
        // Reset previous highlights
        this.unhighlightAll();

        // Find the parent area of the intersected mesh
        const parentArea = this.brainModel.cerebralCortexAreas.find(area => area.includes(intersected)) ||
                           this.brainModel.subcorticalCortexAreas.find(area => area.includes(intersected));
        
        if (parentArea) {
            parentArea.forEach(mesh => {
                if (mesh.isMesh) {
                    mesh.material.color.set(0xff0000); // Highlight color
                }
            });
        }
    }

    unhighlightAll() {
        this.sceneSetup.scene.traverse((object) => {
            if (object.isMesh) {
                object.material.color.set(this.brainModel.getBrainColour(object.name)); // Example: reset to original color
            }
        });
    }
}

export default RaycasterManager;
