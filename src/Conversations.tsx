import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Conversation } from './models/Conversation';

const Conversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

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
        />
      </div>
    </div>
  );
};

export default Conversations;