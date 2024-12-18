// Function to toggle media options visibility
function toggleMediaOptions() {
    const mediaContainer = document.querySelector('.media-container');
    mediaContainer.style.display = mediaContainer.style.display === 'none' ? 'block' : 'none';
}

// Function to trigger the image upload input
function triggerImageUpload() {
    const fileInput = document.getElementById('file-input');
    fileInput.accept = 'image/png, image/jpeg'; // Allow only images
    fileInput.click();
}

// Function to trigger the video upload input
function triggerVideoUpload() {
    const fileInput = document.getElementById('file-input');
    fileInput.accept = 'video/mp4, video/mkv'; // Allow only videos
    fileInput.click();
}

// Function to preview the media before uploading
function previewMedia(event) {
    const mediaContainer = document.querySelector('.media-container');
    const addMedia = document.querySelector('.addMedia');
    const file = event.target.files[0];
    const mediaPreview = document.getElementById('mediaPreview');
    const mediaPlaceholder = document.querySelector('.media-placeholder');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (file.type.startsWith('image/')) {
                mediaPreview.src = e.target.result;
                mediaPreview.style.display = 'block';
            } else if (file.type.startsWith('video/')) {
                mediaPreview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
        mediaPlaceholder.style.display = 'block';
        mediaContainer.style.display = 'none';
        addMedia.style.display = 'none';
    }
}

// Function to remove media preview
function removeMediaPreview() {
    const mediaPreview = document.getElementById('mediaPreview');
    const mediaPlaceholder = document.querySelector('.media-placeholder');

    mediaPreview.style.display = 'none';
    mediaPlaceholder.style.display = 'none';
    document.getElementById('file-input').value = ''; // Reset file input
    const addMedia = document.querySelector('.addMedia');
    addMedia.style.display = 'block'; // Show the "add media" button again
}

// Add event listener to the remove media button
const removeMediaButton = document.querySelector('.remove-media');
if (removeMediaButton) {
    removeMediaButton.addEventListener('click', removeMediaPreview);
}