const dropArea = document.getElementById('upload-area');
const fileInput = document.getElementById('fileInput');

console.log("hello");

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults);
    document.body.addEventListener(eventName, preventDefaults);
});

// Highlight drop area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight);
});

// Handle dropped files
dropArea.addEventListener('drop', handleDrop);

// If someone wants to click to upload instead
dropArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFiles);

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropArea.style.backgroundColor = '#f0f0f0';
}

function unhighlight() {
    dropArea.style.backgroundColor = '#fff';
}

function handleDrop(e) {
    let files = e.dataTransfer.files;
    handleFiles(files);
}

function handleFiles(files) {
    console.log(files); // For now, just log the files
}