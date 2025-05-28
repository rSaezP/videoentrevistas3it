const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const app = express();

// Configuración básica
app.use(cors());
app.use(express.json());

// Configurar multer para guardar archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Carpeta donde guardar videos
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("¡Backend funcionando correctamente!");
});

// Ruta para recibir videos
app.post("/upload-video", upload.single('video'), async (req, res) => {
  console.log("Video recibido:", req.file.filename);
  
  // Transcribir el video automáticamente
  const transcription = await transcribeVideo(req.file.filename);
  
  if (transcription) {
    console.log("Transcripción:", transcription);
    res.json({ 
      message: "Video recibido y transcrito!",
      filename: req.file.filename,
      transcription: transcription
    });
  } else {
    res.json({ 
      message: "Video recibido pero error en transcripción",
      filename: req.file.filename 
    });
  }
});
// Iniciar servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend en http://localhost:${PORT}`);
});

// Función para enviar video a Whisper
async function transcribeVideo(filename) {
  const FormData = require('form-data');
  const fs = require('fs');
  const axios = require('axios');
  
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(`uploads/${filename}`));
    
    const response = await axios.post('http://localhost:8000/transcribe', form, {
      headers: form.getHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al transcribir:', error.message);
    return null;
  }
}