import * as THREE from 'three';

class RaycasterManager {
    
    constructor(sceneSetup, brainModel, controlsManager) {
        this.sceneSetup = sceneSetup;
        this.brainModel = brainModel;
        this.controlsManager = controlsManager;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.setupMouseListeners();

        this.isTransitioning = false;
        this.targetPosition = new THREE.Vector3();
        this.cameraTargetPosition = new THREE.Vector3(); 
        this.transitionSpeed = 0.075; // Adjust this value as needed
        
    }

    setupMouseListeners() {
        document.addEventListener('mousemove', (event) => {
            this.updateMousePosition(event);
            this.checkIntersection('hover');
        });

        document.addEventListener('click', (event) => {
            this.updateMousePosition(event);
            this.checkIntersection('click');
        });
    }

    updateMousePosition(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }

    checkIntersection(eventType) {
        this.raycaster.setFromCamera(this.mouse, this.sceneSetup.camera);
        
        // Get all meshes to test for intersection
        const meshes = this.brainModel.cerebralCortexOpacity >= 0.5 ?
                       this.brainModel.cerebralCortexAreas.flat() :
                       this.brainModel.subcorticalCortexAreas.flat();
        const intersects = this.raycaster.intersectObjects(meshes, true);
        
        if (intersects.length > 0) {
            const intersected = intersects[0].object;
            if (eventType === 'hover') {
                this.highlightIntersected(intersected);
            } else if (eventType === 'click') {
                this.focusOnArea(intersected);
            }
        } else if (eventType === 'hover') {
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

    focusOnArea(intersected) {
        // Find the parent area of the intersected mesh
        const parentArea = this.brainModel.cerebralCortexAreas.find(area => area.includes(intersected)) ||
        this.brainModel.subcorticalCortexAreas.find(area => area.includes(intersected));

        if (parentArea) {
        let centroid = new THREE.Vector3(0, 0, 0);
        let tempPos = new THREE.Vector3();

        parentArea.forEach(mesh => {
            mesh.getWorldPosition(tempPos); // Get the world position of each mesh
            centroid.add(tempPos); // Add it to the centroid
        });

        centroid.divideScalar(parentArea.length); // Average the position

        this.targetPosition.copy(centroid);

        // Use a smaller distance value, appropriate for the scale of your scene
        const distance = 0.3; // Adjust this value based on your model's scale

        // Calculate the direction vector from the centroid towards the current camera position
        const direction = new THREE.Vector3().subVectors(this.sceneSetup.camera.position, centroid).normalize();

        // Set the new camera position
        this.cameraTargetPosition.copy(centroid).addScaledVector(direction, distance);

        // Disable user interaction with orbit controls during transition
        this.controlsManager.controls.enabled = false;
        this.isTransitioning = true;
        } 
    }

    update() {
        if (this.isTransitioning) {
            // Interpolate the target position of the controls
            this.controlsManager.controls.target.lerp(this.targetPosition, this.transitionSpeed);

            // Interpolate the camera position
            this.sceneSetup.camera.position.lerp(this.cameraTargetPosition, this.transitionSpeed);
            this.sceneSetup.camera.lookAt(this.controlsManager.controls.target); // Ensure the camera is always looking at the target

            this.controlsManager.controls.update();

            // Check if the transition is complete
            const isTargetClose = this.controlsManager.controls.target.distanceTo(this.targetPosition) < 0.01;
            const isCameraClose = this.sceneSetup.camera.position.distanceTo(this.cameraTargetPosition) < 0.01;
            if (isTargetClose && isCameraClose) {
                this.isTransitioning = false;

                // Re-enable user interaction with orbit controls
                this.controlsManager.controls.enabled = true;
            }
        }
    }
}

export default RaycasterManager;
