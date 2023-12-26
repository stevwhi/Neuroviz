import * as THREE from 'three';

class SceneSetup {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 0.25;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.addLights();
        this.handleWindowResize();
    }

    addLights() {
        // Existing top directional light
        const topDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        topDirectionalLight.position.set(0, 1, 0);
        this.scene.add(topDirectionalLight);
    
        // Additional bottom directional light
        const bottomDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        bottomDirectionalLight.position.set(0, -1, 0);
        this.scene.add(bottomDirectionalLight);
    
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);
    }

    handleWindowResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

export default SceneSetup;