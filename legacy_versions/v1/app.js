const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = 3000;

//
// Multer File Storage
//

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
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

  exec('echo fortnite', (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
});

//
// Host and serve app
//

// Host the whole directory
app.use(express.static(__dirname, {
  extensions: ["html", "htm", "gif", "png", "jpg", "css"],
}))

// Serve the index.html file on the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html/index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});