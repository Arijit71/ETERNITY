document.addEventListener('DOMContentLoaded', () => {
    const uploader = document.getElementById('uploader');
    const fileInput = document.getElementById('fileInput');
    const dropdownButton = document.getElementById('dropdownButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const interactiveButton = document.getElementById('interactiveButton');
    const selectedOption = document.getElementById('selectedOption');
    const resizeInputs = document.getElementById('resizeInputs');
    const resizeWidth = document.getElementById('resizeWidth');
    const resizeHeight = document.getElementById('resizeHeight');
    const genFillAspectRatio = document.getElementById('genFillAspectRatio');
    const genFillInputs = document.getElementById('genFillInputs');
    const backgroundReplaceInputs = document.getElementById('backgroundReplaceInputs');
    const from_src = document.getElementById('backgroundReplaceFrom');
    const to_src = document.getElementById('backgroundReplaceTo');
    const processedImageContainer = document.getElementById('processedImage');
    const loader = document.getElementById('loader');
    let selectedAction = '';
    let publicId = '';

    loader.style.display = 'none';
    processedImageContainer.innerHTML = '<p class="text-white text-lg">No processed image yet.</p>';

    uploader.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            loader.style.display = 'block';
            const formData = new FormData();
            formData.append('file', file);

            fetch('/upload', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.url) {
                        publicId = data.public_id;
                        document.getElementById('uploadedImage').innerHTML = `<img src="${data.url}" alt="Uploaded Image" class="w-fit h-full object-cover rounded-lg" />`;
                    } else {
                        alert('Error uploading image');
                    }
                    loader.style.display = 'none';
                })
                .catch(() => {
                    alert('Error uploading image');
                    loader.style.display = 'none';
                });
        }
    });

    dropdownButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!dropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });

    dropdownMenu.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            selectedAction = e.target.getAttribute('data-value');
            selectedOption.textContent = e.target.textContent;
            dropdownMenu.classList.add('hidden');

            if (selectedAction === 'smart_cropping') {
                resizeInputs.classList.remove('hidden');
                resizeInputs.classList.add('flex');  // Add flex class only when visible
                genFillInputs.classList.add('hidden');
                backgroundReplaceInputs.classList.add('hidden');
            } else if (selectedAction === 'gen_fill') {
                genFillInputs.classList.remove('hidden');
                resizeInputs.classList.add('hidden');
                resizeInputs.classList.remove('flex');  // Remove flex class when hidden
                backgroundReplaceInputs.classList.add('hidden');
            } else if (selectedAction === 'bg_replace') {
                backgroundReplaceInputs.classList.remove('hidden');
                resizeInputs.classList.add('hidden');
                genFillInputs.classList.add('hidden');
            } else {
                resizeInputs.classList.add('hidden');
                resizeInputs.classList.remove('flex');  // Remove flex class when hidden
                genFillInputs.classList.add('hidden');
                backgroundReplaceInputs.classList.add('hidden');
            }
        }
    });


    interactiveButton.addEventListener('click', () => {
        if (!publicId) {
            alert('Please upload an image first.');
            return;
        }

        if (selectedAction === 'smart_cropping') {
            const width = resizeWidth.value.trim();
            const height = resizeHeight.value.trim();

            if (!width || isNaN(width) || !height || isNaN(height)) {
                alert('Please enter valid numbers for both width and height.');
                return;
            }

            processImage(selectedAction, { width, height });

        } else if (selectedAction === 'gen_fill') {
            const aspectRatio = genFillAspectRatio.value.trim();

            if (!aspectRatio) {
                alert('Please enter a valid aspect ratio (e.g., 1:1, 16:9, etc.).');
                return;
            }

            processImage(selectedAction, { aspectRatio });

        } else if (selectedAction === 'bg_replace') {
            const fromSrc = from_src.value.trim();
            const toSrc = to_src.value.trim();

            if (!fromSrc || !toSrc) {
                alert('Please enter both from and to values.');
                return;
            }

            processImage(selectedAction, { fromSrc, toSrc });


        } else {
            processImage(selectedAction);
        }
    });

    function processImage(action, dimensions = {}) {
        loader.style.display = 'block';
        const postData = { public_id: publicId, action: action, ...dimensions };

        fetch('/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        })
            .then(response => response.json())
            .then(data => {
                loader.style.display = 'none';
                if (data.processed_url) {
                    processedImageContainer.innerHTML = `<img src="${data.processed_url}" alt="Processed Image" class="w-fit h-full object-cover rounded-lg" />`;
                } else if (data.error) {
                    alert(data.error);
                }
            })
            .catch(() => {
                loader.style.display = 'none';
                alert('Error processing image');
            });
    }
});