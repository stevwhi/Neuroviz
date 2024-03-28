import * as THREE from 'three';
import brainInfo from './brainInfo';
import fetch from 'node-fetch';
import { fetchWikipediaSummary } from './fetchWikipediaSummary.js';
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
        

        this.selectedArea = null;

        this.labelMode = false;
        this.setupLabelMode();

        
        this.originalCameraPosition = new THREE.Vector3(0.1, 0, 0.15);
        this.originalCameraLookAt = new THREE.Vector3(0, 0, 0);
        this.isCameraResetting = false;

    
    }

    //search bar----------------------------------------------------------------------------------
    setupSearchBar() {
        const searchBar = document.getElementById('brain-area-search');
        const searchButton = document.getElementById('search-button');
        const autocompleteList = document.createElement('div');
        autocompleteList.setAttribute('id', 'autocomplete-list');
        autocompleteList.setAttribute('class', 'autocomplete-items');
        searchBar.parentNode.appendChild(autocompleteList);
    
        searchBar.addEventListener('input', (e) => {
            const val = e.target.value;
            closeAllLists();
            if (!val) { return false; }
            const normalizedInput = this.normalizeString(val);
    
            let suggestions = this.getAutocompleteSuggestions(normalizedInput);
            suggestions.forEach(areaName => {
                let item = document.createElement('div');
                item.innerHTML = areaName;
                item.addEventListener('click', () => {
                    searchBar.value = areaName;
                    closeAllLists();
                    this.handleSearch(areaName);
                });
                autocompleteList.appendChild(item);
            });
        });
    
        searchButton.addEventListener('click', () => {
            this.handleSearch(searchBar.value);
            closeAllLists();
        });
    
        searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(e.target.value);
                closeAllLists();
            }
        });
    
        function closeAllLists(elmnt) {
            var x = document.getElementById('autocomplete-list');
            if (x) x.innerHTML = '';
        }
    
        document.addEventListener('click', function (e) {
            closeAllLists(e.target);
        });

        document.addEventListener('DOMContentLoaded', function () {
        
            // Add event listener for closing the custom alert
            document.getElementById('custom-alert-close').addEventListener('click', function (event) {
                document.getElementById('custom-alert').style.display = 'none';
                event.stopPropagation();
            });
        });    
        
    }
    
    getAutocompleteSuggestions(input) {
        let suggestions = [];
        // Iterate over the keys in brainInfo
        Object.keys(brainInfo).forEach(key => {
            const areaTitle = brainInfo[key].title;
            if (this.normalizeString(areaTitle).includes(input)) {
                suggestions.push(areaTitle);
            }
        });
        return suggestions;
    }

    handleSearch(searchTerm) {
        const normalizedSearchTerm = this.normalizeString(searchTerm);
        const areaObject = this.findAreaObjectByName(normalizedSearchTerm);
        const parentArea = this.getParentArea(areaObject);
        if (areaObject) {
            this.selectedArea = parentArea;
            this.focusOnArea(this.selectedArea);
            this.highlightIntersected(this.selectedArea);
        } else {
            // Use custom alert
            this.showCustomAlert("Error: Brain area not found.");
        }
    }

    showCustomAlert(message) {
        document.getElementById('custom-alert-message').textContent = message;
        document.getElementById('custom-alert').style.display = 'flex';
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
            const parentArea = this.getParentArea(intersected);

            if (this.labelMode && eventType === 'hover') {
                this.showLabel(parentArea);
                this.highlightIntersected(parentArea);
            } else if (!this.labelMode && eventType === 'hover') {
                this.highlightIntersected(parentArea);
            } else if (this.labelMode && eventType === 'click') {
                
                    this.selectedArea = parentArea;
            

                this.showLabel(parentArea);
                this.highlightIntersected(this.selectedArea);
                this.focusOnArea(this.selectedArea);
            } else if (!this.labelMode && eventType === 'click'){
             
                    this.selectedArea = parentArea;
               

                this.highlightIntersected(this.selectedArea);
                this.focusOnArea(this.selectedArea);
            }
        } else {
            if (this.labelMode && eventType === 'hover') {
                this.hideLabel();
            } else if (!this.labelMode && eventType === 'hover') {
                this.unhighlightAll();
            }
        }
    }

    getParentArea(mesh) {
        return this.brainModel.cerebralCortexAreas.find(area => area.includes(mesh)) ||
               this.brainModel.subcorticalCortexAreas.find(area => area.includes(mesh));
    }

    

    //highlighting----------------------------------------------------------------------------------


    highlightIntersected(intersected) {
        this.unhighlightAll();

        if (intersected) {
            if(intersected !== this.selectedArea){
                intersected.forEach(mesh => {
                    if (mesh.isMesh) {
                        mesh.material.color.set(0xCCF0FF); // Highlight color
                    }
                });
            }else{
                intersected.forEach(mesh => {
                    if (mesh.isMesh) {
                        mesh.material.color.set(0x7DFDFE); // Highlight color
                    }
                });
            }
        }
    }

    unhighlightAll() {
        this.sceneSetup.scene.traverse((object) => {
            if (object.isMesh && this.getParentArea(object) !== this.selectedArea) {
                object.material.color.set(this.brainModel.getBrainColour(object.name));
            }
        });
    }

    //clicking----------------------------------------------------------------------------------

    async focusOnArea(intersected) {
        if (intersected) {
            // Calculate the centroid of the selected area
            let centroid = new THREE.Vector3(0, 0, 0);
            let tempPos = new THREE.Vector3();
            intersected.forEach(mesh => {
                mesh.getWorldPosition(tempPos);
                centroid.add(tempPos);
            });
            centroid.divideScalar(intersected.length);
    
            // Update target position for camera
            this.targetPosition.copy(centroid);
            const distance = 0.2; // Adjust based on your scene scale
            const direction = new THREE.Vector3().subVectors(this.sceneSetup.camera.position, centroid).normalize();
            this.cameraTargetPosition.copy(centroid).addScaledVector(direction, distance);
    
            // Disable orbit controls during transition
            this.controlsManager.controls.enabled = false;
            this.isTransitioning = true;
    
            // Fetch and display information from Wikipedia and brainInfo
            const areaObject = intersected[0];
            const areaName = areaObject.name;
            const wikipediaTitle = brainInfo[areaName].wikipediaTitle; // Use the title for Wikipedia API
            const additionalInfo = await fetchWikipediaSummary(wikipediaTitle);
            if (additionalInfo && !document.getElementById('offline-mode-checkbox').checked) {
                // Combine Wikipedia info with pre-written info
                this.displayInfoBox({
                    title: brainInfo[areaName].title,
                    description: `${additionalInfo.description}\n`,
                    wikipediaLink: additionalInfo.content_urls.desktop.page
                });
            } else {
                // Fallback to default info if Wikipedia fetch fails
                this.displayInfoBox(brainInfo[areaName]);
            }
        }
    }

    smoothCameraTransition() {
        if (!this.isCameraResetting) return;
    
        let factor = 0.1; // Adjust this value for speed
    
        // Interpolate the camera's position
        this.sceneSetup.camera.position.lerp(this.originalCameraPosition.clone(), factor);
    
        // Assuming the original target is the center (0, 0, 0), modify if it's different
        const originalTarget = new THREE.Vector3(0, 0, 0);
        this.controlsManager.controls.target.lerp(originalTarget, factor);
    
        // Check if the camera and target are close to their respective targets
        const positionThreshold = 0.001;
        const targetThreshold = 0.001;
        const isPositionClose = this.sceneSetup.camera.position.distanceTo(this.originalCameraPosition) < positionThreshold;
        const isTargetClose = this.controlsManager.controls.target.distanceTo(originalTarget) < targetThreshold;
    
        if (isPositionClose && isTargetClose) {
            this.isCameraResetting = false;
    
            // Re-enable orbit controls once the transition is complete
            if (this.controlsManager && this.controlsManager.controls) {
                this.controlsManager.controls.enabled = true;
            }
        }
    }
    

    resetView() {
        // Reset the selected area
        this.selectedArea = null;
        this.unhighlightAll();
    
        // Initiate the camera reset process
        this.isCameraResetting = true;
    
        // Disable orbit controls during the transition
        if (this.controlsManager && this.controlsManager.controls) {
            this.controlsManager.controls.enabled = false;
        }
    
        // Hide the info box or update its content as necessary
        document.getElementById('info-box').style.display = 'none';

    }
    
    displayInfoBox(areaInfo) {
        const infoBox = document.getElementById('info-box');
        let content = `<h1 id="infoTitle">${areaInfo.title}</h1><p id="infoInfo">${areaInfo.description}</p>`;
    
        // Add a Wikipedia button if available
        if (areaInfo.wikipediaLink) {
            content += `<p style="float: left; margin-right: 19px;">
              <button class="tron-button" id="wikiButton" 
                      onclick="event.stopPropagation(); window.open('${areaInfo.wikipediaLink}', '_blank')">
                Read more on Wikipedia
              </button>
            </p>`;
        }

        // Add a button to reset the selected area and camera position
        content += `<p style="float: left;"><button class="tron-button" id="resetButton">Deselect Area</button></p>`;
    
        infoBox.innerHTML = content;
        infoBox.style.display = 'block';


        document.getElementById('resetButton').addEventListener('click', (event) => {
            console.log("reset button clicked");
            this.resetView();
            event.stopPropagation();
        });
    }
    
    
    //fetch wikipedia sumary()

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

    //label mode----------------------------------------------------------------------------------

    setupLabelMode() {
        const labelModeCheckbox = document.getElementById('label-mode-checkbox');
        labelModeCheckbox.addEventListener('change', (e) => {
            this.labelMode = e.target.checked;
            if (!this.labelMode) {
                this.hideLabel();
            }
        });
    }

    showLabel(parentArea) {
        // Position the label near the mouse cursor and show information
        const labelDiv = document.getElementById('brain-label');
        labelDiv.style.display = 'block';
        labelDiv.style.left = `${(this.mouse.x + 1) * window.innerWidth / 2}px`;
        labelDiv.style.top = `${(-this.mouse.y + 1) * window.innerHeight / 2}px`;
        labelDiv.innerHTML = `<p>${brainInfo[parentArea[0].name].title}</p>`;
        
    }

    hideLabel() {
        const labelDiv = document.getElementById('brain-label');
        labelDiv.style.display = 'none';
    }

}



export default RaycasterManager;



