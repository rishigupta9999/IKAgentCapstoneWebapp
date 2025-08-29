import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Conversation } from './models/Conversation';
import { Turn } from './models/Turn';

const Uploads: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      setSelectedFile(file);
      setUploadResult('');
    } else {
      alert('Please select a text file (.txt)');
      event.target.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadResult('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Read and convert file to Conversation object
      const fileContent = await selectedFile.text();
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      const conversation: Conversation = {
        conversation_id: uuidv4(),
        turns: lines.map((line, index) => ({
          id: uuidv4(),
          content: line.trim(),
          speaker: `Speaker ${(index % 2) + 1}`,
          timestamp: new Date()
        }))
      };

      console.log('Converted conversation:', conversation);

      // Send conversation as JSON
      const response = await fetch('https://a28etc2crk.execute-api.us-west-2.amazonaws.com/Prod/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversation),
      });

      if (response.ok) {
        const result = await response.text();
        setUploadResult(`Upload successful: ${result}`);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setUploadResult(`Upload failed: ${response.statusText}`);
      }
    } catch (error) {
      setUploadResult(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="header">File Upload</h1>
      <div style={{ padding: '20px', maxWidth: '500px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="file-input" style={{ display: 'block', marginBottom: '10px' }}>
            Select a text file to upload:
          </label>
          <input
            id="file-input"
            type="file"
            accept=".txt,text/plain"
            onChange={handleFileSelect}
            style={{ marginBottom: '10px' }}
          />
        </div>

        {selectedFile && (
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <strong>Selected file:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="toggle-button"
          style={{ opacity: (!selectedFile || uploading) ? 0.6 : 1 }}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>

        {uploadResult && (
          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            borderRadius: '4px',
            backgroundColor: uploadResult.includes('successful') ? '#d4edda' : '#f8d7da',
            color: uploadResult.includes('successful') ? '#155724' : '#721c24'
          }}>
            {uploadResult}
          </div>
        )}
      </div>
    </div>
  );
};

export default Uploads;