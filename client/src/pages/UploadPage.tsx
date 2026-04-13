import { useState } from 'react';

const API_BASE = 'http://localhost:3001/api';

const UploadPage = () => {
  const [status, setStatus] = useState('No upload yet');

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('uploadId', `upload-${Date.now()}`);
    formData.append('sourceType', 'campaign');
    formData.append('totalChunks', '1');
    formData.append('chunkIndex', '0');
    formData.append('fileName', file.name);
    formData.append('chunk', file);

    const response = await fetch(`${API_BASE}/upload/chunk`, { method: 'POST', body: formData });
    const data = await response.json();
    setStatus(JSON.stringify(data));
  };

  return (
    <section>
      <h2>Upload Portal</h2>
      <p>Chunked upload endpoint + queue handoff is available.</p>
      <input type="file" onChange={onFileChange} />
      <pre>{status}</pre>
    </section>
  );
};

export default UploadPage;
