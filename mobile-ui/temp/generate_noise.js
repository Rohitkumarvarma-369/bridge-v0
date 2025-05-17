const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a canvas for the noise texture
const width = 200;
const height = 200;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Create grainy noise texture
const imageData = ctx.createImageData(width, height);
const data = imageData.data;

for (let i = 0; i < data.length; i += 4) {
  // Randomize pixel values for grainy effect
  const value = Math.floor(Math.random() * 255);
  data[i] = value;     // Red
  data[i + 1] = value; // Green
  data[i + 2] = value; // Blue
  data[i + 3] = 40;    // Alpha (low opacity for subtle effect)
}

ctx.putImageData(imageData, 0, 0);

// Create the directory if it doesn't exist
const outputDir = path.join(__dirname, '../assets/images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save the canvas as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(outputDir, 'noise-texture.png'), buffer);

console.log('Noise texture generated and saved to assets/images/noise-texture.png'); 