let preview = document.getElementById('preview');
let fileInput = document.getElementById('image-input');

// Stop automatic redirection after client uploads
//const form = document.getElementById('upload-form');

// IMAGE UPLOAD
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
        const response = await fetch('/upload/origin', {
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

// TEXT UPLOAD
document.getElementById('message-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default page reload

    // Get input text
    const textFormData = document.getElementById('text-input').value.toString();

    try {
        // Use Fetch to send the form data asynchronously
        const response = await fetch('/upload_text/origin', {
            method: 'POST',
            body: textFormData,
            headers: {
            'Content-Type': 'text/plain'
            }
        });

        const result = await response.text();
    } catch (error) {
        console.error('Error during form submission:', error);
        alert('An error occurred during submission.');
    }

    document.getElementById("text-input").value = "";
});

// POWER CONTROL
let powerStatus = 'off'
let powerSwitch = document.getElementById("powerSwitch");
let p_disp = document.getElementById("p_val");
let powerSlider = document.getElementById("powerSlider").addEventListener('click', async function(event) {
    if (powerSwitch.checked) {
        powerStatus = 'off';
    }
    else {
        powerStatus = 'on';
    }

    try {
        // Use Fetch to send the form data asynchronously
        const response = await fetch('/power/origin', {
            method: 'POST',
            body: powerStatus,
            headers: {
            'Content-Type': 'text/plain'
            }
        });

        const result = await response.text();
    } catch (error) {
        console.error('Error occurred:', error);
        alert('An error occurred during submission.');
    }
});

// BRIGHTNESS CONTROL
let b_disp = document.getElementById('brightness_value');
let brightness = document.getElementById("brightness")
brightness.addEventListener('mouseup', async function(event) {
    try {
        // Use Fetch to send the form data asynchronously
        const response = await fetch('/brightness/origin', {
            method: 'POST',
            body: brightness.value,
            headers: {
            'Content-Type': 'text/plain'
            }
        });

        const result = await response.text();
    } catch (error) {
        console.error('Error occurred:', error);
        alert('An error occurred during submission.');
    }
});

// LOAD CURRENT DEVICE CONFIGURATION
window.addEventListener("load", async function(event) {
    try {
        const response = await fetch('/get_config/origin', {
            method: 'GET'
        });

        const result = await response.text();
        const config = result
        .trim() // Remove any extra newlines
        .split('\n') // Split the response by newlines
        .map(line => JSON.parse(line)); // Parse each line as JSON

        brightness.value = config[0].state;
        brightness_value.innerHTML = config[0].state;

        if (config[1].state == 'on') {
            powerSwitch.checked = true;
        }
        else {
            powerSwitch.checked = false;
        };

        console.log(config[1].state);

    } catch (error) {
        alert('An error occurred during submission.');
    }    
});