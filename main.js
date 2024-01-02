import SceneSetup from './SceneSetup.js';
import BrainModel from './BrainModel.js';
import ControlsManager from './ControlsManager.js';
import RaycasterManager from './RaycasterManager.js';
import SlicerManager from './SlicerManager.js';
import QuestionManager from './QuestionManager.js';

const sceneSetup = new SceneSetup('threejs-scene-container');
const brainModel = new BrainModel(sceneSetup.scene);
const controlsManager = new ControlsManager(sceneSetup, brainModel);
const raycasterManager = new RaycasterManager(sceneSetup, brainModel, controlsManager);

brainModel.loadModel('/public/Brain/gltf/originBrain6(samesubnames2).glb').then(() => {
    animate();
});

document.addEventListener('DOMContentLoaded', () => {
    
    const slicerManager = new SlicerManager(sceneSetup.scene, sceneSetup.getRenderer());
    const questionManager = new QuestionManager(raycasterManager);
});

function animate() {
    requestAnimationFrame(animate);
    raycasterManager.update();
    controlsManager.update();
    sceneSetup.render();
}

