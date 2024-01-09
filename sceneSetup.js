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

    takeWebGLScreenshot() {
        return this.renderer.domElement.toDataURL('image/png');
    }

    takeScreenshot() {
        const webglDataURL = this.takeWebGLScreenshot();
        const infoBox = document.getElementById('info-box');
        const wikiButton = document.getElementById('wikiButton');

        // Save the original styles of the info box and the wiki button
        const originalStyleInfoBox = infoBox.style.cssText;
        const originalDisplayWikiButton = wikiButton.style.display;

        // Temporarily change the background color of the info box and hide the wiki button
        infoBox.style.backgroundColor = 'black';
        wikiButton.style.display = 'none';

        const combineImages = (webglDataURL, htmlDataURL) => {
            const combinedCanvas = document.createElement('canvas');
            const context = combinedCanvas.getContext('2d');

            // Set the canvas dimensions
            combinedCanvas.width = infoBox.offsetWidth + window.innerWidth / 2;
            combinedCanvas.height = infoBox.offsetHeight;

            const webglImage = new Image();
            webglImage.src = webglDataURL;
            webglImage.onload = () => {
                // Zoom out of the WebGL scene by reducing the drawing area
                const zoomFactor = 0.85; // Slightly zoom out (2% reduction)
                const sceneWidth = combinedCanvas.height * this.renderer.domElement.width / this.renderer.domElement.height * zoomFactor;
                const xOffsetScene = infoBox.offsetWidth + (combinedCanvas.width - infoBox.offsetWidth - sceneWidth) / 2;
                const yOffsetScene = (combinedCanvas.height - combinedCanvas.height * zoomFactor) / 2;

                context.drawImage(webglImage, xOffsetScene, yOffsetScene, sceneWidth, combinedCanvas.height * zoomFactor);

                const htmlImage = new Image();
                htmlImage.src = htmlDataURL;
                htmlImage.onload = () => {
                    // Zoom into the info box by 2%
                    const zoomFactorInfoBox = 1.04;
                    const zoomedWidthInfoBox = infoBox.offsetWidth * zoomFactorInfoBox;
                    const zoomedHeightInfoBox = combinedCanvas.height * zoomFactorInfoBox;
                    const xOffsetInfoBox = -(zoomedWidthInfoBox - infoBox.offsetWidth) / 2;
                    const yOffsetInfoBox = -(zoomedHeightInfoBox - combinedCanvas.height) / 2;

                    context.drawImage(htmlImage, xOffsetInfoBox, yOffsetInfoBox, zoomedWidthInfoBox, zoomedHeightInfoBox);

                    // Export the combined image
                    const finalDataURL = combinedCanvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = 'screenshot.png';
                    link.href = finalDataURL;
                    link.click();

                    // Restore the original styles of the info box and the wiki button
                    infoBox.style.cssText = originalStyleInfoBox;
                    wikiButton.style.display = originalDisplayWikiButton;
                };
            };
        };

        html2canvas(infoBox, {
            useCORS: true,
            logging: true
        }).then(htmlCanvas => {
            combineImages(webglDataURL, htmlCanvas.toDataURL('image/png'));
        }).catch(error => {
            console.error('Error taking screenshot:', error);
            // Restore the original styles in case of an error
            infoBox.style.cssText = originalStyleInfoBox;
            wikiButton.style.display = originalDisplayWikiButton;
        });
    }






  



    render() {
        this.renderer.render(this.scene, this.camera);
    }

    getRenderer() {
        return this.renderer;
    }
}

export default SceneSetup;