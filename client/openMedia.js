// Menangani klik pada gambar atau video untuk memperbesar
document.addEventListener('click', function (event) {
    // Jika elemen yang diklik adalah media (gambar atau video)
    if (event.target.classList.contains('media-thumbnail')) {
        if (event.target.tagName === 'IMG') {
            // Jika media adalah gambar
            openModal(event.target.src, 'image');
        } else if (event.target.tagName === 'VIDEO') {
            // Jika media adalah video
            openModal(event.target.src, 'video');
        }
    }
});

// Fungsi untuk membuka modal
function openModal(mediaSrc, mediaType) {
    const modal = document.createElement('div');
    modal.classList.add('modal');

    let mediaElement;
    if (mediaType === 'image') {
        // Jika media adalah gambar
        mediaElement = document.createElement('img');
        mediaElement.src = mediaSrc;
        mediaElement.classList.add('modal-image');

        // Menutup modal jika klik di luar media
        modal.addEventListener('click', (event) => {
            if (event.target !== modal) { // Pastikan klik di luar media
                closeModal(modal);
            }
        });
    } else if (mediaType === 'video') {
        // Jika media adalah video
        mediaElement = document.createElement('video');
        mediaElement.src = mediaSrc;
        mediaElement.controls = true; // Tambahkan kontrol untuk video
        mediaElement.autoplay = false;
        mediaElement.classList.add('modal-video');
    }

    const closeBtn = document.createElement('span');
    closeBtn.classList.add('close-modal');
    closeBtn.innerText = '×';
    closeBtn.addEventListener('click', () => closeModal(modal));

    modal.appendChild(mediaElement);
    modal.appendChild(closeBtn);

    document.body.appendChild(modal);
}

// Fungsi untuk menutup modal
function closeModal(modal) {
    modal.remove();
}