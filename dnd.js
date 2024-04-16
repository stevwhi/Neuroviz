const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('uploadArea');


['drop', 'dragleave', 'dragover', 'dragenter'].forEach(event => {

    dropZone.addEventListener(event, preventDefaults);
    document.body.addEventListener(event, preventDefaults);
});


['dragover', 'dragenter'].forEach(event => {

    dropZone.addEventListener(event, highlight);
});

['drop', 'dragleave'].forEach(event => {

    dropZone.addEventListener(event, unhighlight);
});

// File handling
dropZone.addEventListener('drop', handleFileDrop);

// click upload option
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFile);



//functions -------------------------------------------------

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropZone.style.backgroundColor = '#f0f0f1';
}

function unhighlight() {
    dropZone.style.backgroundColor = '#ffd';
}

function handleFileDrop(e) {
    let file = e.dataTransfer.files;
    handleFile(file);
}

function handleFile(file) {
    console.log(file); 
}