import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Conversation } from './models/Conversation';

const ConversationTable = ({ conversation }: { conversation: Conversation | null }) => {
  // Convert conversation turns to row data
  const rowData = conversation?.turns.map(turn => ({
    speaker: turn.speaker,
    phrase: turn.content
  })) || [];

  // Column Definitions: Defines the columns to be displayed.
  const [colDefs, setColDefs] = useState([
      { field: "speaker" as const },
      { field: "phrase" as const, flex: 1 }
  ]);

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

export default ConversationTable;