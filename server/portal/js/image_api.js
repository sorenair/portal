async function downloadImageFromApi(imageName, suggestedFilename) {
    // If no filename is suggested, use the one from the API call
    const filename = suggestedFilename || imageName;

    try {
        const response = await fetch(`/api/dev1/img`); // Your API endpoint from Method 2

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const imageBlob = await response.blob(); // Get the response body as a Blob

        // Create a temporary URL for the blob
        const imageObjectURL = URL.createObjectURL(imageBlob);

        // Create a temporary anchor element (link)
        const downloadLink = document.createElement('a');
        downloadLink.href = imageObjectURL;

        // Set the download attribute with the desired filename
        downloadLink.download = filename;

        // Append the link to the body (required for Firefox)
        document.body.appendChild(downloadLink);

        // Programmatically click the link to trigger the download
        downloadLink.click();

        // Clean up: Remove the link and revoke the object URL
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(imageObjectURL); // Free up memory

        console.log(`Download initiated for ${filename}`);

    } catch (error) {
        console.error('Error fetching or downloading image:', error);
        alert(`Failed to download image: ${error.message}`); // Inform the user
    }
}

async function syncConfig() {
    try {
        const response = await fetch('/api/dev1/params', {
            method: 'GET'
        });

        const result = await response.text();
        const config = result
        .trim() // Remove any extra newlines
        .split('\n') // Split the response by newlines
        .map(line => JSON.parse(line)); // Parse each line as JSON

        console.log(config);
    } catch (error) {
        alert('An error occurred during submission.');
    }    
}

const downloadButton = document.getElementById('downloadBtn');
if (downloadButton) {
    downloadButton.addEventListener('click', () => {
        // Call the function with the image name from your API and a suggested filename
        downloadImageFromApi('image.gif', 'my-downloaded-image.jpg');
    });
} else {
    // Or call it directly if not tied to a button
    downloadImageFromApi('image.gif', 'my-downloaded-image.jpg');
}

const paramButton = document.getElementById('paramBtn');
paramButton.addEventListener('click', () => {
    // Call the function with the image name from your API and a suggested filename
    syncConfig();
});