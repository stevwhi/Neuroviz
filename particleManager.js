import * as THREE from 'three';

class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.directions = []; 
        this.particleSystem = null; 
        this.initParticleSystem();
    }

    initParticleSystem() {
        const particleCount = 15000; 
        const geometry = new THREE.BufferGeometry();
        const positions = [];
    
        // particle range
        const range = 750;
    
        for (let i = 0; i < particleCount; i++) {
            // Random position
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
    
        // sparkle texture
        const textureLoader = new THREE.TextureLoader();
        const sparkleTexture = textureLoader.load('public/circle2.jpg'); 

        const material = new THREE.PointsMaterial({ 
            size: 0.6, 
            color: 0xffffff, 
            map: sparkleTexture, 
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending 
        });
    
        const particleSystem = new THREE.Points(geometry, material);
    
        this.particleSystem = particleSystem; 
        this.scene.add(particleSystem);
        this.particles.push(particleSystem);
    }

    update() {
        this.particles.forEach(particleSystem => {
            const positions = particleSystem.geometry.attributes.position.array;
            const range = 750; 
            const halfRange = range / 2;

            for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
                // Update positions
                positions[i] += this.directions[j].x / 2; 
                positions[i + 1] += this.directions[j].y / 2; 
                positions[i + 2] += this.directions[j].z / 2; // Z

                // Wrap around 
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

    
    hideParticles() {
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem); 
        }
    }

    
    showParticles() {
        if (this.particleSystem && !this.scene.children.includes(this.particleSystem)) {
            this.scene.add(this.particleSystem); 
        }
    }
}

export default ParticleManager;
