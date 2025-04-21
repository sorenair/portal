let preview = document.getElementById('preview');
let fileInput = document.getElementById('image-input');

// Stop automatic redirection after client uploads
const form = document.getElementById('upload-form');

fileInput.addEventListener('change', async () => {
    // Check for uploaded image
    if (fileInput.files.length === 0) {
      resultParagraph.innerText = 'No file selected!';
      return;
    }

    // Update preview image
    preview.src = URL.createObjectURL(fileInput.files[0]);

    // Upload input image
    const formData = new FormData();
    formData.append('image-input', fileInput.files[0]);
    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });
      
      // Receive server response
      const resultText = await response.text();
      resultParagraph.innerText = resultText;
    } catch (error) {
      console.error('Upload error:', error);
      resultParagraph.innerText = 'Error uploading file.';
    }
  });