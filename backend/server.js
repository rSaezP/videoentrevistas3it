const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const db = require('./database'); // Base de datos SQLite
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
  
  try {
    // Transcribir el video automáticamente
    const transcription = await transcribeVideo(req.file.filename);
    
    // Extraer información del nombre del archivo
    const filename = req.file.filename;
    const preguntaMatch = filename.match(/pregunta-(\d+)/);
    const preguntaNumero = preguntaMatch ? parseInt(preguntaMatch[1]) : 1;
    
    // Preguntas predefinidas (mismo array que en frontend)
    const preguntas = [
      "¿Puedes contarme sobre ti y tu experiencia profesional?",
      "¿Por qué estás interesado en esta posición?",
      "¿Cuál consideras que es tu mayor fortaleza?",
      "Describe un desafío que hayas enfrentado y cómo lo resolviste"
    ];
    
    const preguntaTexto = preguntas[preguntaNumero - 1] || "Pregunta no encontrada";
    
    // Guardar en base de datos
    const entrevistaId = 1; // Por ahora usamos ID fijo, después lo haremos dinámico
    
    db.run(`INSERT INTO respuestas (entrevista_id, pregunta_numero, pregunta_texto, archivo_video, transcripcion) 
            VALUES (?, ?, ?, ?, ?)`,
      [entrevistaId, preguntaNumero, preguntaTexto, filename, transcription || "Transcripción no disponible"],
      function(err) {
        if (err) {
          console.error('Error al guardar en BD:', err);
        } else {
          console.log(`✅ Respuesta ${preguntaNumero} guardada en BD con ID:`, this.lastID);
        }
      }
    );
    
    // Responder al frontend
    if (transcription) {
      res.json({ 
        message: "Video recibido, transcrito y guardado en BD",
        filename: req.file.filename,
        transcription: transcription,
        saved_to_db: true
      });
    } else {
      res.json({ 
        message: "Video recibido y guardado en BD, error en transcripción",
        filename: req.file.filename,
        saved_to_db: true
      });
    }
    
  } catch (error) {
    console.error('Error en procesamiento:', error);
    res.json({ 
      message: "Video recibido pero error en procesamiento",
      filename: req.file.filename 
    });
  }
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

// Iniciar servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend en http://localhost:${PORT}`);
});