import * as THREE from 'three';
import brainInfo from './brainInfo';
class RaycasterManager {
    
    constructor(sceneSetup, brainModel, controlsManager) {
        this.sceneSetup = sceneSetup;
        this.brainModel = brainModel;
        this.controlsManager = controlsManager;
        

        
        this.setupSearchBar();
        
        //raycasting
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.setupMouseListeners();
        this.isTransitioning = false;
        this.targetPosition = new THREE.Vector3();
        this.cameraTargetPosition = new THREE.Vector3(); 
        this.transitionSpeed = 0.075; 
        

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
        
            
            document.getElementById('custom-alert-close').addEventListener('click', function (event) {
                document.getElementById('custom-alert').style.display = 'none';
                event.stopPropagation();
            });
        });    
        
    }
    
    getAutocompleteSuggestions(input) {
        let suggestions = [];
        
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
    
       
        let meshes = [...this.brainModel.subcorticalCortexAreas.flat()];

      
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
                        mesh.material.color.set(0xCCF0FF); 
                    }
                });
            }else{
                intersected.forEach(mesh => {
                    if (mesh.isMesh) {
                        mesh.material.color.set(0x7DFDFE); 
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
            
            let centroid = new THREE.Vector3(0, 0, 0);
            let tempPos = new THREE.Vector3();
            intersected.forEach(mesh => {
                mesh.getWorldPosition(tempPos);
                centroid.add(tempPos);
            });
            centroid.divideScalar(intersected.length);
    
            // Update target 
            this.targetPosition.copy(centroid);
            const distance = 0.2; 
            const direction = new THREE.Vector3().subVectors(this.sceneSetup.camera.position, centroid).normalize();
            this.cameraTargetPosition.copy(centroid).addScaledVector(direction, distance);
    
            
            this.controlsManager.controls.enabled = false;
            this.isTransitioning = true;
    
            
            const areaObject = intersected[0];
            const areaName = areaObject.name;
            const wikipediaTitle = brainInfo[areaName].wikipediaTitle; 
            const additionalInfo = await this.fetchWikipediaSummary(wikipediaTitle);
            if (additionalInfo && !document.getElementById('offline-mode-checkbox').checked) {
                
                this.displayInfoBox({
                    title: brainInfo[areaName].title,
                    description: `${additionalInfo.description}\n`,
                    wikipediaLink: additionalInfo.content_urls.desktop.page
                });
            } else {
                
                this.displayInfoBox(brainInfo[areaName]);
            }
        }
    }

    smoothCameraTransition() {
        if (!this.isCameraResetting) return;
    
        let factor = 0.1; 
    
        
        this.sceneSetup.camera.position.lerp(this.originalCameraPosition.clone(), factor);
    
        
        const originalTarget = new THREE.Vector3(0, 0, 0);
        this.controlsManager.controls.target.lerp(originalTarget, factor);
    
        
        const positionThreshold = 0.001;
        const targetThreshold = 0.001;
        const isPositionClose = this.sceneSetup.camera.position.distanceTo(this.originalCameraPosition) < positionThreshold;
        const isTargetClose = this.controlsManager.controls.target.distanceTo(originalTarget) < targetThreshold;
    
        if (isPositionClose && isTargetClose) {
            this.isCameraResetting = false;
    
            
            if (this.controlsManager && this.controlsManager.controls) {
                this.controlsManager.controls.enabled = true;
            }
        }
    }
    

    resetView() {
        
        this.selectedArea = null;
        this.unhighlightAll();
    
       
        this.isCameraResetting = true;
    
        
        if (this.controlsManager && this.controlsManager.controls) {
            this.controlsManager.controls.enabled = false;
        }
    
        
        document.getElementById('info-box').style.display = 'none';

    }
    
    displayInfoBox(areaInfo) {
        const infoBox = document.getElementById('info-box');
        let content = `<h1 id="infoTitle">${areaInfo.title}</h1><p id="infoInfo">${areaInfo.description}</p>`;
    
        
        if (areaInfo.wikipediaLink) {
            content += `<p style="float: left; margin-right: 19px;">
              <button class="tron-button" id="wikiButton" 
                      onclick="event.stopPropagation(); window.open('${areaInfo.wikipediaLink}', '_blank')">
                Read more on Wikipedia
              </button>
            </p>`;
        }

        
        content += `<p style="float: left;"><button class="tron-button" id="resetButton">Deselect Area</button></p>`;
    
        infoBox.innerHTML = content;
        infoBox.style.display = 'block';


        document.getElementById('resetButton').addEventListener('click', (event) => {
            console.log("reset button clicked");
            this.resetView();
            event.stopPropagation();
        });
    }
    
    
    async fetchWikipediaSummary(title) {
        const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return {
                title: data.title,
                description: data.extract,
                content_urls: data.content_urls // Include the URL to the Wikipedia page
            };
        } catch (error) {
            console.error('Error fetching data from Wikipedia:', error);
            return null;
        }
    }



    update() {
        if (this.isTransitioning) {
            
            this.controlsManager.controls.target.lerp(this.targetPosition, this.transitionSpeed);

            // Interpolate 
            this.sceneSetup.camera.position.lerp(this.cameraTargetPosition, this.transitionSpeed);
            this.sceneSetup.camera.lookAt(this.controlsManager.controls.target); 

            this.controlsManager.controls.update();

            // Check if complete
            const isTargetClose = this.controlsManager.controls.target.distanceTo(this.targetPosition) < 0.01;
            const isCameraClose = this.sceneSetup.camera.position.distanceTo(this.cameraTargetPosition) < 0.01;
            if (isTargetClose && isCameraClose) {
                this.isTransitioning = false;

                
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



