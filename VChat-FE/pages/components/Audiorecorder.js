import React, { useState, useEffect, useRef } from 'react';

const AudioRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [processedAudioURL, setProcessedAudioURL] = useState('');
  const [error, setError] = useState('');
  const [isSpeakingClicked, setIsSpeakingClicked] = useState(false);
  const [isStopClicked, setIsStopClicked] = useState(false);

  const audioRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const newMediaRecorder = new MediaRecorder(stream);
        setMediaRecorder(newMediaRecorder);

        newMediaRecorder.ondataavailable = e => {
          setRecordedBlob(e.data);
        };
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
        setError('Error accessing microphone');
      });
  }, []);

  useEffect(() => {
    if (recordedBlob && !recording) {
      sendRecordingToBackend();
    }
  }, [recordedBlob, recording]);

  useEffect(() => {
    if (processedAudioURL) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error('Playback failed:', e));
      }
      if (videoRef.current) {
        videoRef.current.play().catch(e => console.error('Video playback failed:', e));
      }
    }
  }, [processedAudioURL]);

  const startRecording = () => {
    setRecording(true);
    setIsSpeakingClicked(true);
    mediaRecorder.start();
  };

  const stopRecording = () => {
    setRecording(false);
    setIsStopClicked(true);
    mediaRecorder.stop();
  };

  const sendRecordingToBackend = () => {
    const formData = new FormData();
    formData.append('audio', recordedBlob, 'recording.webm');

    fetch('http://127.0.0.1:5000/api/receive-user-input', {
      method: 'POST',
      body: formData,
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.processedAudioURL) {
        setProcessedAudioURL(data.processedAudioURL);
        audioRef.current.play();
        videoRef.current.play();
      } else {
        throw new Error('Received null or invalid URL');
      }
    })
    .catch(error => {
      console.error('Error sending recording:', error);
      setError('Error processing recording');
    });
  };

  const onAudioEnd = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reset video playback to start
    }

    // Refresh the window when audio ends
    window.location.reload();
    window.location.reload();
  };

  const videoContainerStyle = {
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '300px',
    marginBottom: '20px'
  };

  const videoStyle = {
    maxWidth: '500px',
    width: '100%',
    height: 'auto'
  };

  const buttonStyle = (isClicked) => ({
    backgroundColor: isClicked ? '#555' : '#444',
    color: 'white',
    padding: '10px',
    margin: '5px',
    border: 'none',
    cursor: 'pointer'
  });

  return (
    <div>
      <div style={videoContainerStyle}>
        {processedAudioURL ? (
          <video 
            ref={videoRef} 
            src="http://127.0.0.1:5000/static/videoc.mp4" 
            loop 
            muted 
            autoPlay 
            style={videoStyle}
          />
        ) : (
          <img src="http://127.0.0.1:5000/static/placeholderGif.gif" alt="Loading..." style={videoStyle} />
        )}
      </div>
      <button 
        onClick={startRecording} 
        disabled={recording}
        style={buttonStyle(isSpeakingClicked)}>
        Speak
      </button>
      <button 
        onClick={stopRecording} 
        disabled={!recording}
        style={buttonStyle(isStopClicked)}>
        Stop!!
      </button>
      {processedAudioURL && (
        <audio 
          ref={audioRef} 
          src={processedAudioURL} 
          controls 
          hidden 
          onEnded={onAudioEnd}
        />
      )}
      {error && <p style={{ color: 'black' }}>{error}</p>}
    </div>
  );
};

export default AudioRecorder;
