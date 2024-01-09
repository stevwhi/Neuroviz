import * as THREE from 'three';

class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.directions = []; // Array to store direction vectors
        this.particleSystem = null; // Store the particle system
        this.initParticleSystem();
    }

    initParticleSystem() {
        const particleCount = 15000; // Number of particles
        const geometry = new THREE.BufferGeometry();
        const positions = [];
    
        // Define a smaller range for the particles
        const range = 750;
    
        for (let i = 0; i < particleCount; i++) {
            // Random positions within a smaller range
            positions.push((Math.random() - 0.5) * range);
            positions.push((Math.random() - 0.5) * range);
            positions.push((Math.random() - 0.5) * range);

            // Random direction
            this.directions.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.1, 
                (Math.random() - 0.5) * 0.1, 
                (Math.random() - 0.5) * 0.1
            ));
        }
    
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
        // Load a sparkle texture
        const textureLoader = new THREE.TextureLoader();
        const sparkleTexture = textureLoader.load('public/circle2.jpg'); // Replace with your texture path

        const material = new THREE.PointsMaterial({ 
            size: 0.6, // Smaller size
            color: 0xffffff, // White color
            map: sparkleTexture, // Add the sparkle texture
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending // For a glow effect
        });
    
        const particleSystem = new THREE.Points(geometry, material);
    
        this.particleSystem = particleSystem; // Store the particle system
        this.scene.add(particleSystem);
        this.particles.push(particleSystem);
    }

    update() {
        this.particles.forEach(particleSystem => {
            const positions = particleSystem.geometry.attributes.position.array;
            const range = 750; // The same range used in initParticleSystem
            const halfRange = range / 2;

            for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
                // Update positions based on direction vectors
                positions[i] += this.directions[j].x / 2; // X
                positions[i + 1] += this.directions[j].y / 2; // Y
                positions[i + 2] += this.directions[j].z / 2; // Z

                // Wrap around if the particle goes beyond the range
                if (positions[i] < -halfRange) positions[i] += range;
                else if (positions[i] > halfRange) positions[i] -= range;

                if (positions[i + 1] < -halfRange) positions[i + 1] += range;
                else if (positions[i + 1] > halfRange) positions[i + 1] -= range;

                if (positions[i + 2] < -halfRange) positions[i + 2] += range;
                else if (positions[i + 2] > halfRange) positions[i + 2] -= range;
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
        });
    }

    // Method to hide the particle system
    hideParticles() {
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem); // Remove the particle system from the scene
        }
    }

    // Method to show the particle system
    showParticles() {
        if (this.particleSystem && !this.scene.children.includes(this.particleSystem)) {
            this.scene.add(this.particleSystem); // Add the particle system back to the scene
        }
    }
}

export default ParticleManager;
