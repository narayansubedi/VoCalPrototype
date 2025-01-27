import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [audioChunks, setAudioChunks] = useState([]);
    const [savedAudio, setSavedAudio] = useState(null);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const mediaRecorder = useRef(null);
    const audioRef = useRef(null);
    const recognition = useRef(null);

    // Load saved data from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('transcriptionData');
        if (saved) {
            const data = JSON.parse(saved);
            setTranscript(data.transcript);
            setSavedAudio(data.audioUrl);
        }
    }, []);

    // Save to localStorage
    const saveData = (audioUrl) => {
        const data = {
            transcript,
            audioUrl
        };
        localStorage.setItem('transcriptionData', JSON.stringify(data));
    };

    // Start Recording
    const startRecording = async () => {
        localStorage.removeItem('transcriptionData');
        setTranscript('');
        setSavedAudio(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);

            // Audio recording setup
            mediaRecorder.current.ondataavailable = (e) => {
                setAudioChunks(prev => [...prev, e.data]);
            };

            // Speech recognition setup
            recognition.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.current.continuous = true;
            recognition.current.interimResults = true;

            recognition.current.onresult = (e) => {
                const current = Array.from(e.results)
                    .map(result => result[0].transcript)
                    .join('');
                setTranscript(current);
            };

            recognition.current.start();
            mediaRecorder.current.start();
            setIsRecording(true);

        } catch (err) {
            alert('Microphone access denied!');
        }
    };

    // Stop Recording
    const stopRecording = () => {
        mediaRecorder.current?.stop();
        recognition.current?.stop();
        setIsRecording(false);

        mediaRecorder.current.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            setSavedAudio(audioUrl);
            saveData(audioUrl);
            setAudioChunks([]);
        };
    };

    // Playback handlers
    const handlePlayPause = () => {
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    // App.jsx (only return section changed - keep logic the same)
    return (
        <div className="app-container">
            <div className="app">
                <h1>Live Speech Transcription 🎤</h1>

                <div className="controls">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className="record-button"
                        style={{ background: isRecording ? '#ff4444' : '#4CAF50' }}
                    >
                        {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
                    </button>
                </div>

                <div className="transcript-box">
                    {transcript || "Speech will appear here..."}
                </div>

                {savedAudio && (
                    <div className="playback-section">
                        <audio
                            ref={audioRef}
                            src={savedAudio}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                            onTimeUpdate={(e) => setPlaybackTime(e.target.currentTime)}
                        />
                        <div className="playback-controls">
                            <button onClick={handlePlayPause} className="play-button">
                                {isPlaying ? '⏸️ Pause' : '▶️ Play Recording'}
                            </button>
                            <div className="progress-bar">
                                Progress: {(playbackTime / audioRef.current?.duration * 100 || 0).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;