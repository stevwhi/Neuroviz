import * as THREE from 'three';
import html2canvas from 'html2canvas'; // Ensure html2canvas is imported

class SceneSetup {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 1000);
        this.camera.position.set(0.1, 0, 0.15);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0)); 

        

        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.addLights();
        this.handleWindowResize();

        // Set up screenshot button listener
        this.setupScreenshotListener();
    }

    addLights() {
        const topDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        topDirectionalLight.position.set(0, 1, 0);
        this.scene.add(topDirectionalLight);

        const bottomDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        bottomDirectionalLight.position.set(0, -1, 0);
        this.scene.add(bottomDirectionalLight);

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

    setupScreenshotListener() {
        const screenshotButton = document.getElementById('download-screenshot');
        if (screenshotButton) {
            screenshotButton.addEventListener('click', () => {
                this.takeScreenshot();
            });
        }
    }

    takeScreenshot() {
        const elementToCapture = document.getElementById('screenshot-container');
        if (elementToCapture) {
            html2canvas(elementToCapture).then(canvas => {
                const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
                const link = document.createElement('a');
                link.download = 'screenshot.png';
                link.href = image;
                link.click();
            });
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    getRenderer() {
        return this.renderer;
    }
}

export default SceneSetup;