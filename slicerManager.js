import * as THREE from 'three';

class SlicerManager {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.clipPlanes = [
            new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1), // X-axis
            new THREE.Plane(new THREE.Vector3(0, -1, 0), 1), // Y-axis
            new THREE.Plane(new THREE.Vector3(0, 0, -1), 1)  // Z-axis
        ];

        this.initialize();
    }

    initialize() {
        this.renderer.localClippingEnabled = true;
        this.updateClipPlanes();

        // Link slider inputs to updateClipPlanes method
        document.getElementById('clipX').addEventListener('input', (e) => this.updateClipPlane(0, e.target.value));
        document.getElementById('clipY').addEventListener('input', (e) => this.updateClipPlane(1, e.target.value));
        document.getElementById('clipZ').addEventListener('input', (e) => this.updateClipPlane(2, e.target.value));
    }

    updateClipPlane(index, value) {
        // Convert the slider value to a float
        const planeConstant = parseFloat(value);
    
        // Update the corresponding clipping plane
        this.clipPlanes[index].constant = planeConstant;
    
        // Apply the updated clipping planes
        this.updateClipPlanes();
    }

    updateClipPlanes() {
        this.scene.traverse((object) => {
            if (object.isMesh && object.material) {
                object.material.clippingPlanes = this.clipPlanes;
            }
        });
    }
}

export default SlicerManager;