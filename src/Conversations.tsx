import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, IDetailCellRendererParams } from 'ag-grid-community';
import { Conversation } from './models/Conversation';
import { Turn } from './models/Turn';

const Conversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://a28etc2crk.execute-api.us-west-2.amazonaws.com/Prod/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const columnDefs: ColDef[] = [
    { field: 'conversation_id', headerName: 'Conversation ID', flex: 1 },
    { 
      field: 'turns', 
      headerName: 'Turn Count', 
      valueGetter: (params) => params.data.turns.length,
      flex: 1 
    },
    {
      field: 'conversation_analysis.topic',
      headerName: 'Topic',
      valueGetter: (params) => params.data.conversation_analysis?.topic || '',
      flex: 1
    },
    {
      field: 'conversation_analysis.goal',
      headerName: 'Goal',
      valueGetter: (params) => params.data.conversation_analysis?.goal || '',
      flex: 1
    },
    {
      field: 'conversation_analysis.success',
      headerName: 'Success',
      valueGetter: (params) => params.data.conversation_analysis?.success || '',
      flex: 1
    },
    {
      field: 'conversation_analysis.summary',
      headerName: 'Summary',
      valueGetter: (params) => params.data.conversation_analysis?.summary || '',
      flex: 2
    }
  ];

  const turnColumnDefs: ColDef[] = [
    { field: 'id', headerName: 'Turn ID', flex: 1 },
    { field: 'speaker', headerName: 'Speaker', flex: 1 },
    { field: 'content', headerName: 'Content', flex: 2 },
    { 
      field: 'timestamp', 
      headerName: 'Timestamp', 
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
      flex: 1 
    }
  ];



  if (loading) {
    return <div>Loading conversations...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Conversations</h1>
        <button 
          onClick={fetchConversations} 
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Reload conversations"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ 
              transform: loading ? 'rotate(360deg)' : 'none',
              transition: loading ? 'transform 1s linear infinite' : 'none'
            }}
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>
      </div>
      <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
        <AgGridReact
          rowData={conversations}
          columnDefs={columnDefs}
          rowSelection="single"
          onSelectionChanged={(event) => {
            const selectedRows = event.api.getSelectedRows();
            setSelectedConversation(selectedRows[0] || null);
          }}
        />
      </div>
      {selectedConversation && (
        <div style={{ marginTop: '20px' }}>
          <h2>Details for Conversation: {selectedConversation.conversation_id}</h2>
          
          {selectedConversation.conversation_analysis && (
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
              <h3>Conversation Analysis</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px', alignItems: 'start' }}>
                <strong>Topic:</strong>
                <span>{selectedConversation.conversation_analysis.topic || 'N/A'}</span>
                
                <strong>Goal:</strong>
                <span>{selectedConversation.conversation_analysis.goal || 'N/A'}</span>
                
                <strong>Success:</strong>
                <span>{selectedConversation.conversation_analysis.success || 'N/A'}</span>
                
                <strong>Summary:</strong>
                <div style={{ whiteSpace: 'pre-wrap' }}>{selectedConversation.summary || 'N/A'}</div>
              </div>
            </div>
          )}
          
          <h3>Turns</h3>
          <div className="ag-theme-alpine" style={{ height: 300, width: '100%' }}>
            <AgGridReact
              rowData={selectedConversation.turns}
              columnDefs={turnColumnDefs}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Conversations;