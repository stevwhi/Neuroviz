import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class BrainModel {
    constructor(scene) {
        this.scene = scene;
        this.loader = new GLTFLoader();
        this.cerebralCortex = null;
        this.subcorticalCortex = null;
        this.cerebralCortexOpacity = 1;

        this.cerebralCortexAreas = [];
        this.subcorticalCortexAreas = [];
    }

    loadModel(url) {
        return new Promise((resolve, reject) => {
            this.loader.load(url, (gltf) => {
                const model = gltf.scene;
                this.scene.add(model);
                this.processModel(model);
                resolve(model);
            }, undefined, reject);
        });
    }

    processModel(model) {
        model.traverse((child) => {
            if (child.name === "cerebralCortex") {
                this.cerebralCortex = child;
                child.children.forEach((area, index) => {
                    this.cerebralCortexAreas[index] = [];
                    area.traverse((mesh) => {
                        this.assignBrainColour(mesh, true);
                        if (mesh.isMesh) {
                            this.cerebralCortexAreas[index].push(mesh);
                        }
                    });
                });
            } else if (child.name === "subcorticalCortex") {
                this.subcorticalCortex = child;
                child.children.forEach((area, index) => {
                    this.subcorticalCortexAreas[index] = [];
                    area.traverse((mesh) => {
                        this.assignBrainColour(mesh, false);
                        if (mesh.isMesh) {
                            this.subcorticalCortexAreas[index].push(mesh);
                        }
                    });
                });
            }
        });
    }

    setCerebralCortexOpacity(opacity) {
        if (this.cerebralCortex) {
            this.cerebralCortexOpacity = opacity;
            this.cerebralCortex.traverse((descendant) => {
                if (descendant.isMesh) {
                    
                    descendant.material.opacity = opacity;
                    descendant.material.needsUpdate = true;
                }
            });
        }
    }

    assignBrainColour(area, isCerebralCortex) {
        const color = this.getBrainColour(area.name);

            if (area.isMesh) {
                area.material = new THREE.MeshPhongMaterial({
                    color: color,
                    transparent: isCerebralCortex,
                    opacity: 1,
                    
                });
                area.material.needsUpdate = true;
            }
    }
    
    getBrainColour(areaName) {
        
        const colors = {
            frontalLobe: 0x555555,        
            parietalLobe: 0x555555,       
            temporalLobe: 0x555555,        
            occipitalLobe: 0x555555,       
            insularCortex: 0x555555,         
            limbicLobe: 0x555555,          
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
        const colorKey = Object.keys(colors).find(key => areaName.includes(key));
        return colorKey ? colors[colorKey] : 0x39FF14; // Use the found color or default if not found
    }
}

export default BrainModel;