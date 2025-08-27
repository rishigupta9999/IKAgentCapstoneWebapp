import React from 'react';
import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Conversation } from './models/Conversation';
import { Turn } from './models/Turn';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

interface RowData {
  speaker: string;
  phrase: string;
}

const GridExample = ({ conversation }: { conversation: Conversation | null }) => {
  // Convert conversation turns to row data
  const rowData = conversation?.turns.map(turn => ({
    speaker: turn.speaker,
    phrase: turn.content
  })) || [];

  // Column Definitions: Defines the columns to be displayed.
  const [colDefs, setColDefs] = useState([
      { field: "speaker" as const },
      { field: "phrase" as const }
  ]);

  // ...

  return (
    // Data Grid will fill the size of the parent container
    <div style={{ height: 500 }}>
        <AgGridReact
            rowData={rowData}
            columnDefs={colDefs}
        />
    </div>
  )
}


function App(): JSX.Element {
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
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
    } else {
      setConversation({
        id: uuidv4(),
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



  return (
    <div className="app">
      <h1 className="header">Real-Time Transcription</h1>
  
      <button onClick={handleTranscriptionToggle} className="toggle-button">
        {isTranscribing ? 'Stop Transcription' : 'Start Transcription'}
      </button>
        
      <div className="transcript-box">
        {transcript || (isTranscribing ? 'Listening...' : 'Click the button to begin')}
      </div>

      <GridExample conversation={conversation}/>
    </div>

    ); 
}



export default App;