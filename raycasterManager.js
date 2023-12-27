import * as THREE from 'three';
import brainInfo from './brainInfo';

class RaycasterManager {
    
    constructor(sceneSetup, brainModel, controlsManager) {
        this.sceneSetup = sceneSetup;
        this.brainModel = brainModel;
        this.controlsManager = controlsManager;
        

        //search bar
        this.setupSearchBar();
        
        //raycasting
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.setupMouseListeners();
        this.isTransitioning = false;
        this.targetPosition = new THREE.Vector3();
        this.cameraTargetPosition = new THREE.Vector3(); 
        this.transitionSpeed = 0.075; // Adjust this value as needed
    }

    //search bar----------------------------------------------------------------------------------
    setupSearchBar() {
        const searchBar = document.getElementById('brain-area-search');
        const searchButton = document.getElementById('search-button');

        searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(e.target.value);
            }
        });

        searchButton.addEventListener('click', () => {
            this.handleSearch(searchBar.value);
        });

        //autocomplete logic below here
    }

    handleSearch(searchTerm) {
        const normalizedSearchTerm = this.normalizeString(searchTerm);
        const areaObject = this.findAreaObjectByName(normalizedSearchTerm);
        if (areaObject) {
            this.focusOnArea(areaObject);
            this.highlightIntersected(areaObject);
        } else {
            // Show error popup if area is not found
            alert("Error: Brain area not found.");
        }
    }


    findAreaObjectByName(normalizedName) {
        let foundArea = this.brainModel.cerebralCortexAreas.concat(this.brainModel.subcorticalCortexAreas)
            .find(area => this.normalizeString(area[0].name) === normalizedName);
        return foundArea ? foundArea[0] : null;
    }

    // New utility method to normalize strings
    normalizeString(str) {
        return str.toLowerCase().replace(/\s+/g, ''); // Convert to lower case and remove spaces
    }


    //raycasting----------------------------------------------------------------------------------

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
    
        // Always include subcortical areas
        let meshes = [...this.brainModel.subcorticalCortexAreas.flat()];

        // Conditionally include cerebral cortex areas based on opacity
        if (this.brainModel.cerebralCortexOpacity >= 0.5) {
            meshes.push(...this.brainModel.cerebralCortexAreas.flat());
        }

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

            // InfoBox functionality
            // The first element of the parentArea array is the area object itself
            const areaObject = parentArea[0];
            const areaName = areaObject.name; // Get the name from the area object
            const areaInfo = brainInfo[areaName]; // Fetch information based on area name
            if (areaInfo) {
                this.displayInfoBox(areaInfo);
            }

        } 
    }

    displayInfoBox(areaInfo) {
        const infoBox = document.getElementById('info-box');
        infoBox.innerHTML = `<h1>${areaInfo.title}</h1><p>${areaInfo.description}</p>`;
        infoBox.style.display = 'block';
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
