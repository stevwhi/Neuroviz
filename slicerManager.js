import * as THREE from 'three';

class SlicerManager {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.clipPlanes = [
            new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1), 
            new THREE.Plane(new THREE.Vector3(0, -1, 0), 1), 
            new THREE.Plane(new THREE.Vector3(0, 0, -1), 1)  
        ];

        this.initialize();
    }

    initialize() {
        this.renderer.localClippingEnabled = true;
        this.updateClipPlanes();

      
        document.getElementById('clipX').addEventListener('input', (e) => this.updateClipPlane(0, e.target.value));
        document.getElementById('clipY').addEventListener('input', (e) => this.updateClipPlane(1, e.target.value));
        document.getElementById('clipZ').addEventListener('input', (e) => this.updateClipPlane(2, e.target.value));
    }

    updateClipPlane(index, value) {
       
        const planeConstant = parseFloat(value);
    
    
        this.clipPlanes[index].constant = planeConstant;
    
       
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