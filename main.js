import SceneSetup from './SceneSetup.js';
import BrainModel from './BrainModel.js';
import ControlsManager from './ControlsManager.js';
import RaycasterManager from './RaycasterManager.js';

const sceneSetup = new SceneSetup('threejs-scene-container');
const brainModel = new BrainModel(sceneSetup.scene);
const controlsManager = new ControlsManager(sceneSetup, brainModel);
const raycasterManager = new RaycasterManager(sceneSetup, brainModel, controlsManager);

brainModel.loadModel('/public/Brain/gltf/originBrain6(samesubnames2).glb').then(() => {
    animate();
});

function animate() {
    requestAnimationFrame(animate);
    raycasterManager.update();
    controlsManager.update();
    sceneSetup.render();
}