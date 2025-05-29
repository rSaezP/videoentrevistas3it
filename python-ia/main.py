from fastapi import FastAPI, UploadFile, File
import assemblyai as aai
import os
import tempfile
import shutil
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()
aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")

app = FastAPI()

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        # Crear archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
        
        # Configurar transcripción
        config = aai.TranscriptionConfig(
            language_code="es",  # Español
            punctuate=True,
            format_text=True
        )
        
        # Transcribir archivo
        transcriber = aai.Transcriber(config=config)
        transcript = transcriber.transcribe(temp_path)
        
        # Limpiar archivo temporal
        os.unlink(temp_path)
        
        # Verificar si hubo error
        if transcript.status == aai.TranscriptStatus.error:
            return {"text": f"Error en transcripción: {transcript.error}"}
        
        return {"text": transcript.text}
        
    except Exception as e:
        # Limpiar archivo si hay error
        if 'temp_path' in locals():
            try:
                os.unlink(temp_path)
            except:
                pass
        
        print(f"ERROR en transcripción: {str(e)}")
        return {"text": f"Error: {str(e)}"}