import React from 'react';
import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import { Conversation } from './models/Conversation';
import { Turn } from './models/Turn';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import ConversationTable from './ConversationTable';
import Conversations from './Conversations';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

interface RowData {
  speaker: string;
  phrase: string;
}






function App(): JSX.Element {
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentPage, setCurrentPage] = useState('intake');
  const [menuOpen, setMenuOpen] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const handleTranscriptionToggle = async () => {
    if (isTranscribing) {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      socketRef.current?.close();
      setIsTranscribing(false);

      // Send conversation to API Gateway
      if (conversation) {
        try {
          const response = await fetch('https://a28etc2crk.execute-api.us-west-2.amazonaws.com/Prod/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(conversation)
          });
          
          if (!response.ok) {
            console.error('Failed to save conversation:', response.statusText);
          }
        } catch (error) {
          console.error('Error saving conversation:', error);
        }
      }
    } else {
      setConversation({
        conversation_id: uuidv4(),
        turns: []
      });
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        const socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-3&diarize=true', [
          'token',
          process.env.REACT_APP_DEEPGRAM_API_KEY!
        ]);
        socketRef.current = socket;

        socket.onopen = () => {
          mediaRecorder.addEventListener('dataavailable', (event) => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(event.data);
            }
          });
          mediaRecorder.start(250);
        };

        socket.onmessage = (message) => {
          const received = JSON.parse(message.data);
          const result = received.channel.alternatives[0]?.transcript;
          console.log(`Received ${JSON.stringify(received)}`)
          console.log(`Result ${JSON.stringify(result)}`)
          if (result) {
            setTranscript((prev) => prev + ' ' + result);

            console.log(`Speaker ${JSON.stringify(received.channel.alternatives[0].words[0].speaker)}`)

            const speakerNum = received.channel.alternatives[0].words?.[0]?.speaker;
            const turn: Turn = {
              id: uuidv4(),
              speaker: speakerNum !== undefined ? `${speakerNum}` : 'Unknown',
              content: result,
              timestamp: new Date()
            };

            setConversation(prev => prev ? {
              ...prev,
              turns: [...prev.turns, turn]
            } : null);
          }
        };

        setIsTranscribing(true);
      } catch (err) {
        console.error('Failed to start transcription:', err);
      }
    }
  };



  const IntakePage = () => (
    <div>
      <h1 className="header">Real-Time Transcription</h1>
      <button onClick={handleTranscriptionToggle} className="toggle-button">
        {isTranscribing ? 'Stop Transcription' : 'Start Transcription'}
      </button>
      <div className="transcript-box">
        {transcript || (isTranscribing ? 'Listening...' : 'Click the button to begin')}
      </div>
      <ConversationTable conversation={conversation}/>
    </div>
  );

  return (
    <div className="app">
      <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <button onClick={() => setMenuOpen(!menuOpen)} className="hamburger-btn">
          ☰
        </button>
        {menuOpen && (
          <div className="menu-items">
            <button onClick={() => setCurrentPage('intake')}>Intake</button>
            <button onClick={() => setCurrentPage('conversations')}>Conversations</button>
          </div>
        )}
      </div>
      
      <div className={`main-content ${menuOpen ? 'shifted' : ''}`}>
        {currentPage === 'intake' ? <IntakePage /> : <Conversations />}
      </div>
    </div>
  ); 
}



export default App;