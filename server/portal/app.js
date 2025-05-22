const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = 3000;

let init = true;
let update = false;
let update_oriel = false;
let brightness = 0;
let brightness_oriel = 0;
let power = 'off';
let power_oriel = 'off';
let message = '';
let message_oriel = '';
let mediaType = 'img'; // Tracks if 'img' or 'txt' is currently displayed
let mediaType_oriel = 'img';
let fileName = 'idle.gif';
let fileName_oriel = 'idle.gif';

// parse application/json
app.use(express.text());

//
// Multer File Storage
//

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads/temp');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Configure Multer storage settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    /* Create a unique file name with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    */
    // Name the uploaded file
    const device = req.params.device + '_image'; // e.g., 'device1'
    cb(null, device + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Handle image / animation uploads
app.post('/upload/:device', upload.single('image-input'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // The file has been saved to disk at this point
  console.log('File saved as:', req.file.filename);
  res.send(`Image uploaded successfully to !${req.params.device}`);

  // Clear previous uploads
  if (req.params.device == 'origin') {
    exec(`sudo rm ${__dirname}/uploads/origin/*`);
    exec(`sudo mv ${__dirname}/uploads/temp/* ${__dirname}/uploads/origin/`);
  }
  else if (req.params.device == 'oriel') {
    exec(`sudo rm ${__dirname}/uploads/oriel/*`);
    exec(`sudo mv ${__dirname}/uploads/temp/* ${__dirname}/uploads/oriel/`);
  }

  // Resize uploaded file
  var child = exec(`python3 /home/soren-gabor/Desktop/portal/programs/resizer/resizer.py ${req.params.device}`);
  child.stdout.pipe(process.stdout)
  child.on('exit', function() {
    console.log('Finished resizing.')
    // Set update flag
    updateDevice(req.params.device, 'img');
    // Get image URL
    if (req.params.device == 'origin') {
      fileName = req.file.filename
    }
    else if (req.params.device == 'oriel') {
      fileName_oriel = req.file.filename
    }
  });
  
  //console.log(filename)
  //imgURL = `${__dirname}/uploads/*`
  return;
});

// Handle text / message uploads
app.post('/upload_text/:device', (req, res) => {
  console.log(`${req.params.device} received a message: ${req.body}`);

  const userText = req.body;

  // Set update flag
  if (req.params.device == 'origin') {
    message = userText;
    updateDevice('origin','txt');
  }
  else if (req.params.device == 'oriel') {
    message_oriel = userText;
    updateDevice('oriel','txt');
  }
  
  /*
  // Optionally, write the text to a file on disk
  fs.writeFile(path.join(__dirname, 'uploads/message.txt'), userText, (err) => {
    if (err) {
      console.error('Error saving text:', err);
      return res.status(500).send('Error saving text.');
    }
  });
  */
  res.send(`Text uploaded and saved successfully: ${userText}`);

  return;
});

app.post('/power/:device', (req, res) => {
  // The power status is now available in req.body
  const device = req.params.device;
  if (device == 'origin') {
    power = req.body;
  }
  else if (device == 'oriel') {
    power_oriel = req.body;
  }
  console.log(`Setting power of ${device} to ${req.body}`);

  // Set update flag
  updateDevice(device);

  return;
});

app.post('/brightness/:device', (req, res) => {
  // The brightness status is now available in req.body
  const device = req.params.device;
  if (device == 'origin') {
    brightness = req.body;
    res.send(`Setting brightness of ${device} to ${brightness}`);
  }
  else if (device == 'oriel') {
    brightness_oriel = req.body;
    res.send(`Setting brightness of ${device} to ${brightness_oriel}`);
  }
  console.log(`Setting brightness of ${device} to ${req.body}`);

  // Set update flag
  updateDevice(device);

  return;
});

app.get('/get_config/:device', (req, res) => {
  //res.send(`${brightness}`); // Sending back a text response
  const device = req.params.device;
  var config = []
  if (device == 'origin') {
    config = [
      { setting: 'brightness', state: `${brightness}` },
      { setting: 'power', state: `${power}` }
    ];
  }
  else if (device == 'oriel') {
    config = [
      { setting: 'brightness', state: `${brightness_oriel}` },
      { setting: 'power', state: `${power_oriel}` }
    ];
  }

  // Stream response line by line (NDJSON format)
  config.forEach(item => res.write(JSON.stringify(item) + '\n'));
  res.end(); // End response

  return;
});

// Update device flags
function updateDevice(device, format=null, clear=false) {
  if (device == 'origin') {
    if (clear == false) {
      update = true;
      if (format != null) {
        mediaType = format;
      }
    }
    else {
      update = false;
    }
  }
  else if (device == 'oriel') {
    if (clear == false) {
      update_oriel = true;
      if (format != null) {
        mediaType_oriel = format;
      }
    }
    else {
      update_oriel = false;
    }
  }
}

// DEVICE API: Manage update flag
app.post('/api/:device/update', (req, res) => {
  updateDevice(req.params.device, null, true);

  res.send('Update flag cleared.');
  return;
});

// DEVICE API: Download image from server to client
app.get('/api/:device/img', (req, res) => {
  //const imageName = req.params.imageName;
  device = req.params.device;

  let imagePath = '';
  if (init == true) {
    imagePath = path.join(__dirname, 'images/idle.gif');
    init = false;
  }
  else {
    if (device == 'origin') {
      imagePath = path.join(__dirname, `uploads/${device}`, fileName);
    }
    else if (device == 'oriel') {
      imagePath = path.join(__dirname, `uploads/${device}`, fileName_oriel);
    }
  }

  fs.access(imagePath, fs.constants.R_OK, (err) => {
    if (err) {
      console.error("Error accessing image:", err);
      imagePath = path.join(__dirname, 'images/idle.gif');
      //return res.status(404).send('Image not found');
    }

    // Determine content type
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'application/octet-stream'; // Default
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.gif') contentType = 'image/gif';
    if (err) {
      contentType = 'image/gif';
    }
    // ... add other types as needed

    // Send image to client
    res.sendFile(imagePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      if (!res.headersSent) { // Check if headers were already sent
        res.status(err.status || 500).send("Error sending image");
      }
    }
    });
  });
});

// DEVICE API: Sync client device configuration with its server-side parameters
app.get('/api/:device/params', (req, res) => {
  device = req.params.device;

  //res.send(`${brightness}`); // Sending back a text response
  let config = [];
  if (device == 'origin') {
    config = [
      { setting: 'update', state: `${update}` },
      { setting: 'brightness', state: `${brightness}` },
      { setting: 'power', state: `${power}` },
      { setting: 'message', state: `${message}` },
      { setting: 'mediaType', state: `${mediaType}` },
      { setting: 'fileName', state: `${fileName}` }
    ];
  }
  else if (device == 'oriel') {
    config = [
      { setting: 'update', state: `${update_oriel}` },
      { setting: 'brightness', state: `${brightness_oriel}` },
      { setting: 'power', state: `${power_oriel}` },
      { setting: 'message', state: `${message_oriel}` },
      { setting: 'mediaType', state: `${mediaType_oriel}` },
      { setting: 'fileName', state: `${fileName_oriel}` }
    ];
  }

  // Stream response line by line (NDJSON format)
  config.forEach(item => res.write(JSON.stringify(item) + '\n'));
  res.end(); // End response

  return;
});

//
// Host and serve app
//

// Host the whole directory
app.use(express.static(__dirname, {
  extensions: ["gif", "png", "jpg", "css"],
}));
app.use(express.static(path.join(__dirname, 'html/'), {
  extensions: ["html"],
}));
app.use(express.static(path.join(__dirname, 'css/'), {
  extensions: ["css"],
}));
app.use(express.static(path.join(__dirname, 'js/'), {
  extensions: ["js"],
}));

// Serve the index.html file on the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html/index.html'));
});

// Clear old uploads on server initialization
exec(`sudo rm ${__dirname}/uploads/origin/*`);
exec(`sudo rm ${__dirname}/uploads/oriel/*`);
exec(`sudo rm ${__dirname}/uploads/temp/*`);

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});