// PORTAL CLIENT
// MODEL: Oriel
// Autostart file located at /etc/rc.local

const https = require('https'); // Use 'http' if the URL starts with http://
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url'); // To parse the URL protocol
const { exec } = require('child_process');

let update = false;
let brightness = 0;
let power = 'off';
let message = '';
let mediaType = 'img';
let fileName = '';

const imageUrlNative = 'https://sorendev.com/api/oriel/img'; // Replace with your API image URL
let savePathNative = ''; // Save in a 'downloads' subfolder

async function downloadImageNative(imageUrl, filepath) {
  console.log(`Attempting to download image from ${imageUrl} to ${filepath}`);

  // Clear previous uploads
  exec(`sudo rm ${__dirname}/downloads/*`);

  await new Promise((resolve, reject) => {
    // Determine the correct module based on protocol
    const protocol = url.parse(imageUrl).protocol === 'https:' ? https : http;

    // Ensure the directory exists
    const dirname = path.dirname(filepath);
    if (!fs.existsSync(dirname)) {
      try {
        fs.mkdirSync(dirname, { recursive: true });
        console.log(`Created directory: ${dirname}`);
      } catch (mkdirError) {
        console.error(`Error creating directory ${dirname}:`, mkdirError);
        return reject(mkdirError);
      }
    }

    const request = protocol.get(imageUrl, (response) => {
      // Check for non-2xx status codes (errors)
      if (response.statusCode < 200 || response.statusCode >= 300) {
        // Consume response data to free up memory
        response.resume();
        const error = new Error(`Request Failed. Status Code: ${response.statusCode}`);
        console.error(error.message);
        return reject(error);
      }

      // Create a writable stream for the file
      const writer = fs.createWriteStream(filepath);

      // Pipe the response data (readable stream) into the file (writable stream)
      response.pipe(writer);

      // Handle events for the file writing process
      writer.on('finish', () => {
        console.log(`Successfully downloaded and saved image to ${filepath}`);
        resolve(filepath); // Resolve with the filepath
      });

      writer.on('error', (err) => {
        console.error('Error writing file:', err);
        fs.unlink(filepath, () => reject(err)); // Delete incomplete file on error
      });

      response.on('error', (err) => { // Handle errors from the response stream itself
          console.error('Error in response stream:', err);
          writer.close();
          fs.unlink(filepath, () => reject(err));
      });

    });

    // Handle errors during the initial request setup (e.g., DNS lookup failure, network error)
    request.on('error', (err) => {
      console.error('Error making the request:', err);
      // Attempt to delete the file if it was created but the request failed early
      // It's less likely the file exists here, but good practice
      fs.unlink(filepath, () => reject(err));
    });

    // Optional: Set a timeout for the request
    request.setTimeout(5000, () => { // 5 second timeout
        request.destroy(new Error('Request timed out'));
    });
  });

  // Display image after downloading it from the server
  displayImage();
}

async function syncConfig() {
  // Pull device configuration down from server
  try {
      const response = await fetch('https://sorendev.com/api/oriel/params', {
          method: 'GET'
      });

      const result = await response.text();
      const config = result
      .trim() // Remove any extra newlines
      .split('\n') // Split the response by newlines
      .map(line => JSON.parse(line)); // Parse each line as JSON
      console.log(config);

      // Update client-side configuration
      brightness = config[1].state;
      power = config[2].state;
      message = config[3].state;
      mediaType = config[4].state;
      fileName  = config[5].state;
      savePathNative = path.join(__dirname, 'downloads', fileName);
      
      if (config[0].state == 'true') {
          console.log('Update required.');
          update = true;

          // Reset server-side update flag
          try {
              const response = await fetch('https://sorendev.com/api/oriel/update', {
                  method: 'POST',
                  body: 'false',
                  headers: {
                  'Content-Type': 'text/plain'
                  }
              });
      
              const result = await response.text();
          } catch (error) {
              console.error('Error occurred:', error);
              console.log('ERROR: No response from server.');
          }
      }
      else {
        console.log('No update required.')
      };
  } catch (error) {
      console.log('ERROR: No response from server.');
  }
}

function displayImage () {
  if (power == 'on') {
    // Update matrix display
    exec('pidof led-image-viewer', (error, stdout, stderr) => {
      if (error) {
        // if led-viewer NOT active
        exec('pidof text-scroller', (error, stdout, stderr) => {
          if (error) {
            // if led-viewer NOT active AND text-scroller NOT active
            exec(`sudo /home/soren/portal/rpi-rgb-led-matrix/utils/led-image-viewer -C --led-rows=32 --led-cols=64 --led-swap-green-blue --led-brightness=${brightness.toString()} /home/soren/portal/client/downloads/*`);
            return;
          }
          else {
            // if led-viewer NOT active AND text-scroller IS active -> kill text-scroller
            exec(`sudo kill -9 ${stdout}`);
            exec(`sudo /home/soren/portal/rpi-rgb-led-matrix/utils/led-image-viewer -C --led-rows=32 --led-cols=64 --led-swap-green-blue --led-brightness=${brightness.toString()} /home/soren/portal/client/downloads/*`);
            return;
          }
        });
      }
      else {
        // if led-viewer IS active
        exec(`sudo kill -9 ${stdout}`);
        exec(`sudo /home/soren/portal/rpi-rgb-led-matrix/utils/led-image-viewer -C --led-rows=32 --led-cols=64 --led-swap-green-blue --led-brightness=${brightness.toString()} /home/soren/portal/client/downloads/*`);
        return;
      }
    });
  }
}

function displayText () {
  if (power == 'on') {
    // Update matrix display
    exec('pidof led-image-viewer', (error, stdout, stderr) => {
      if (error) {
        // if led-viewer NOT active
        exec('pidof text-scroller', (error, stdout, stderr) => {
          if (error) {
            // if led-viewer NOT active AND text-scroller NOT active
            exec(`sudo /home/soren/portal/rpi-rgb-led-matrix/utils/text-scroller -y5 --led-rows=32 --led-cols=64 -f /home/soren/portal/rpi-rgb-led-matrix/fonts/9x18.bdf ${message}`);
            return;
          }
          else {
            // if led-viewer NOT active AND text-scroller IS active -> kill text-scroller
            exec(`sudo kill -9 ${stdout}`);
            exec(`sudo /home/soren/portal/rpi-rgb-led-matrix/utils/text-scroller -y5 --led-rows=32 --led-cols=64 -f /home/soren/portal/rpi-rgb-led-matrix/fonts/9x18.bdf ${message}`);
            return;
          }
        });
      }
      else {
        // if led-viewer IS active
        exec(`sudo kill -9 ${stdout}`);
        exec(`sudo /home/soren/portal/rpi-rgb-led-matrix/utils/text-scroller -y5 --led-rows=32 --led-cols=64 -f /home/soren/portal/rpi-rgb-led-matrix/fonts/9x18.bdf ${message}`);
        return;
      }
    });
  }

  return;
}

function updatePower () {
  console.log('Power status: ', power);

  if (power == 'off') {
    exec('pidof led-image-viewer', (error, stdout, stderr) => {
      if (error) {
        // if led-viewer NOT active
        exec('pidof text-scroller', (error, stdout, stderr) => {
          if (error) {
            // if led-viewer NOT active AND text-scroller NOT active
            return;
          }
          else {
            // if led-viewer NOT active AND text-scroller IS active -> kill text-scroller
            exec(`sudo kill -9 ${stdout}`);
            return;
          }
        });
      }
      else {
        // if led-viewer IS active
        exec(`sudo kill -9 ${stdout}`);
        return;
      }
    });
  }
  else {
    exec(`sudo /home/soren/portal/rpi-rgb-led-matrix/utils/led-image-viewer -C --led-rows=32 --led-cols=64 --led-swap-green-blue --led-brightness=${brightness.toString()} /home/soren/portal/client/images/idle.gif`);
    return;
  }
}

async function main() {
  await syncConfig()

  if (update == true) {
    if (power == 'off') {
      updatePower();
    }
    else {
      if (mediaType == 'img') {
        downloadImageNative(imageUrlNative, savePathNative);
      }
      else if (mediaType =='txt') {
        displayText();
      }
    }

    update = false
  }

  return;
}

// Poll server
console.log('Initializing system...')
updatePower();
setInterval(main, 5000);