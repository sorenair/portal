const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = 3000;

let init = true;
let update = false;
let brightness = 0;
let power = 'off';
let message = '';
let mediaType = 'img'; // Tracks if 'img' or 'txt' is currently displayed
let fileName = 'idle.gif';

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
    // Save files in the 'uploads' folder
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    /* Create a unique file name with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    */
    // Name the uploaded file
    cb(null, 'image' + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Handle image / animation uploads
app.post('/upload', upload.single('image-input'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // The file has been saved to disk at this point
  console.log('File saved as:', req.file.filename);
  res.send('Image uploaded successfully!');

  // Clear previous uploads
  exec(`sudo rm ${__dirname}/uploads/*`);
  exec(`sudo mv ${__dirname}/uploads/temp/* ${__dirname}/uploads/`);

  // Resize uploaded file
  var child = exec(`python3 /home/soren-gabor/Desktop/portal/programs/resizer/resizer.py`);
  child.stdout.pipe(process.stdout)
  child.on('exit', function() {
    console.log('Finished resizing.')
  });

  // Get image URL
  fileName = req.file.filename
  //console.log(filename)
  //imgURL = `${__dirname}/uploads/*`

  // Set update flag
  update = true;
  mediaType = 'img';

  return;
});

// Handle text / message uploads
app.post('/upload_text', (req, res) => {
  console.log('Received:', req.body);

  // Set update flag
  update = true;
  mediaType = 'txt';

  // The text input is now available in req.body
  const userText = req.body;
  message = userText;
  
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

app.post('/power', (req, res) => {
  // The power status is now available in req.body
  power = req.body;
  console.log('Power status: ', req.body);

  // Set update flag
  update = true;

  return;
});

app.post('/brightness', (req, res) => {
  // The brightness status is now available in req.body
  brightness = req.body;

  console.log('Brightness: ', brightness);

  // Set update flag
  update = true;

  return;
});

app.get('/get_config', (req, res) => {
  //res.send(`${brightness}`); // Sending back a text response
  const config = [
    { setting: 'brightness', state: `${brightness}` },
    { setting: 'power', state: `${power}` }
  ];

  // Stream response line by line (NDJSON format)
  config.forEach(item => res.write(JSON.stringify(item) + '\n'));
  res.end(); // End response

  return;
});

// DEV1: Manage update flag
app.post('/api/dev1/update', (req, res) => {
  update = false

  res.send('Update flag cleared.');
  return;
});

// DEV1: Download image from server to client
app.get('/api/dev1/img', (req, res) => {
  //const imageName = req.params.imageName;
  let imagePath = '';
  if (init == true) {
    imagePath = path.join(__dirname, 'images/idle.gif');
    init = false;
  }
  else {
    imagePath = path.join(__dirname, 'uploads', fileName);
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

// DEV1: Sync client device configuration with its server-side parameters
app.get('/api/dev1/params', (req, res) => {
  //res.send(`${brightness}`); // Sending back a text response
  const config = [
    { setting: 'update', state: `${update}` },
    { setting: 'brightness', state: `${brightness}` },
    { setting: 'power', state: `${power}` },
    { setting: 'message', state: `${message}` },
    { setting: 'mediaType', state: `${mediaType}` },
    { setting: 'fileName', state: `${fileName}` }
  ];

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
exec(`sudo rm ${__dirname}/uploads/*`);
exec(`sudo rm ${__dirname}/uploads/temp/*`);

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});