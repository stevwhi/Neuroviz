import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ControlsManager {
    constructor(sceneSetup, brainModel) {
        this.sceneSetup = sceneSetup;
        this.brainModel = brainModel;
        this.controls = new OrbitControls(sceneSetup.camera, sceneSetup.renderer.domElement);
        this.initControls();
        this.setupSliderListener();
    }

    initControls() {
        this.controls.minDistance = 0;
        this.controls.maxDistance = 25;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    setupSliderListener() {
        const slider = document.getElementById('opacity-slider');
        if (slider) {
            slider.addEventListener('input', (event) => {
                const value = parseFloat(event.target.value);
                this.brainModel.setCerebralCortexOpacity(value);
            });
        }
    }

    update() {
        this.controls.update();
    }
}

export default ControlsManager;
