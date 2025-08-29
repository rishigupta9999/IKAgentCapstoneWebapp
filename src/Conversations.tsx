import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, IDetailCellRendererParams } from 'ag-grid-community';
import { Conversation } from './models/Conversation';
import { Turn } from './models/Turn';

const Conversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
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

    fetchConversations();
  }, []);

  const columnDefs: ColDef[] = [
    { field: 'conversation_id', headerName: 'Conversation ID', flex: 1 },
    { 
      field: 'turns', 
      headerName: 'Turn Count', 
      valueGetter: (params) => params.data.turns.length,
      flex: 1 
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
      <h1>Conversations</h1>
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
          <h2>Turns for Conversation: {selectedConversation.conversation_id}</h2>
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