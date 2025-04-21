const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = 3000;

let brightness = 0;
let power = 'off';

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

// Handle the file upload route
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
  exec(`python3 ${__dirname}/programs/resizer/resizer.py`);

  if (power == 'on') {
    // Update matrix display
    exec('pidof led-image-viewer', (error, stdout, stderr) => {
      if (error) {
        // if led-viewer NOT active
        exec('pidof text-scroller', (error, stdout, stderr) => {
          if (error) {
            // if led-viewer NOT active AND text-scroller NOT active
            exec(`sudo /home/soren/matrix/rpi-rgb-led-matrix/utils/led-image-viewer -C --led-rows=32 --led-cols=64 --led-swap-green-blue --led-brightness=${brightness.toString()} /home/soren/matrix/portal/uploads/*`);
            return;
          }
          else {
            // if led-viewer NOT active AND text-scroller IS active -> kill text-scroller
            exec(`sudo kill -9 ${stdout}`);
            exec(`sudo /home/soren/matrix/rpi-rgb-led-matrix/utils/led-image-viewer -C --led-rows=32 --led-cols=64 --led-swap-green-blue --led-brightness=${brightness.toString()} /home/soren/matrix/portal/uploads/*`);
            return;
          }
        });
      }
      else {
        // if led-viewer IS active
        exec(`sudo kill -9 ${stdout}`);
        exec(`sudo /home/soren/matrix/rpi-rgb-led-matrix/utils/led-image-viewer -C --led-rows=32 --led-cols=64 --led-swap-green-blue --led-brightness=${brightness.toString()} /home/soren/matrix/portal/uploads/*`);
        return;
      }
    });
  }
});

app.post('/upload_text', (req, res) => {
  console.log('Received:', req.body);

  // The text input is now available in req.body
  const userText = req.body;
  
  // Optionally, write the text to a file on disk
  fs.writeFile(path.join(__dirname, 'uploads/message.txt'), userText, (err) => {
    if (err) {
      console.error('Error saving text:', err);
      return res.status(500).send('Error saving text.');
    }
    res.send(`Text uploaded and saved successfully: ${userText}`);
  });

  if (power == 'on') {
    // Update matrix display
    exec('pidof led-image-viewer', (error, stdout, stderr) => {
      if (error) {
        // if led-viewer NOT active
        exec('pidof text-scroller', (error, stdout, stderr) => {
          if (error) {
            // if led-viewer NOT active AND text-scroller NOT active
            exec(`sudo /home/soren/matrix/rpi-rgb-led-matrix/utils/text-scroller -y5 --led-rows=32 --led-cols=64 -f /home/soren/matrix/rpi-rgb-led-matrix/fonts/9x18.bdf ${userText}`);
            return;
          }
          else {
            // if led-viewer NOT active AND text-scroller IS active -> kill text-scroller
            exec(`sudo kill -9 ${stdout}`);
            exec(`sudo /home/soren/matrix/rpi-rgb-led-matrix/utils/text-scroller -y5 --led-rows=32 --led-cols=64 -f /home/soren/matrix/rpi-rgb-led-matrix/fonts/9x18.bdf ${userText}`);
            return;
          }
        });
      }
      else {
        // if led-viewer IS active
        exec(`sudo kill -9 ${stdout}`);
        exec(`sudo /home/soren/matrix/rpi-rgb-led-matrix/utils/text-scroller -y5 --led-rows=32 --led-cols=64 -f /home/soren/matrix/rpi-rgb-led-matrix/fonts/9x18.bdf ${userText}`);
        return;
      }
    });
  }
});

app.post('/power', (req, res) => {
  // The text input is now available in req.body
  power = req.body;
  console.log('Power status: ', req.body);

  if (req.body == 'off') {
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

  return;
});

app.post('/brightness', (req, res) => {
  // The text input is now available in req.body
  brightness = req.body;

  console.log('Brightness: ', brightness);

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

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});