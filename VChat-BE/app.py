

import os
import openai
import whisper
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from gtts import gTTS

app = Flask(__name__)
CORS(app)

openai.api_key = "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"

@app.route('/api/receive-user-input', methods=['POST'])
def receive_user_input():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    audio_file = request.files['audio']

    if not audio_file.filename.lower().endswith('.webm'):
        return jsonify({"error": "Invalid file format. Please upload a webm file."}), 400

    audio_path = 'temp_audio.webm'
    audio_file.save(audio_path)

    recognized_text = speech_to_text(audio_path)
    print(recognized_text)

    ai_response = get_ai_response(recognized_text)
    print(ai_response)

    return text_to_speech(ai_response)

def get_ai_response(user_input):
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-1106",
        messages=[{"role": "user", "content": user_input}]
    )
    return response['choices'][0]['message']['content']

@app.route('/api/tts', methods=['POST'])
def text_to_speech(ai_response):
    tts = gTTS(text=ai_response, lang='en')
    filename = "ai_response.webm"
    file_path = os.path.join('static', filename)  #folder name
    tts.save(file_path)
    
    file_url = "http://127.0.0.1:5000/" + 'static/' + filename  # hard coded backend url
    return jsonify({"processedAudioURL": file_url})

def speech_to_text(audio_path):
    with open(audio_path, "rb") as audio_file:
        response = openai.Audio.transcribe("whisper-1", audio_file) 
        return response["text"]


if __name__ == '__main__':
    app.run(debug=True)

