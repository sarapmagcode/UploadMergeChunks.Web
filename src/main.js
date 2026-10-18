import { v4 as uuidv4 } from 'uuid';
import { validateFile } from './helpers';

// DOM elements
const form = document.querySelector('form');
const token = form.querySelector('#token');
const fileUploads = form.querySelector('#file-uploads');
const result = document.querySelector('#result');

const filenames = [];

function handleFileChange(event) {
  const files = Array.from(event.target.files);

  files.forEach((file) => {
    const { isValid, message } = validateFile(file);

    if (!isValid) {
      console.error(message);
      return;
    }

    filenames.push({
      id: uuidv4(),
      name: file.name,
      file: file
    });
  });
}

async function handleFileSubmit(event) {
  event.preventDefault();

  // Extra guard
  if (fileUploads.files.length === 0) {
    let message = 'You must select a file first';
    console.error(message);
    alert(message);
    return;
  }

  const jwt = token.value.trim();
  if (jwt === '') {
    let message = 'You must provide a jwt token';
    console.error(message);
    alert(message);
    return;
  }

  try {
    const baseUrl = import.meta.env.VITE_BASE_URL || '';
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks

    const fileIdsWithExt = [];
    const promises = filenames.map(async ({id, name, file}) => {
      const totalChunks = Math.ceil(file.size / chunkSize);
      const ext = name.split('.').pop().toLowerCase();
      
      fileIdsWithExt.push(`${id}.${ext}`);

      // Upload all chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, selectedFile.size);
        const chunk = selectedFile.slice(start, end);
  
        const uploadChunkFormData = new FormData();
        uploadChunkFormData.append('Chunk', chunk);
        uploadChunkFormData.append('ChunkIndex', chunkIndex);
        uploadChunkFormData.append('FileId', fileIdOnly);
        uploadChunkFormData.append('FileName', selectedFile.name);
  
        const uploadChunksResponse = await fetch(`${baseUrl}/api/files/upload-chunk`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          body: uploadChunkFormData
        });
  
        promises.push(uploadChunksResponse);
  
        if (!uploadChunksResponse.ok) {
          let message = '';
          switch (uploadChunksResponse.status) {
            case 400: {
              const data = await uploadChunksResponse.json();
              message = data.message;
              break;
            }
            default: {
              message = `There was a problem in uploading chunk: ${chunkIndex}. Please try again :(`;
            }
          }
          throw new Error(`HTTP error! Status: ${uploadChunksResponse.status} - ${message}`);
        }
      }

      // Merge all chunks
      const mergeChunksFormData = new FormData();
      mergeChunksFormData.append('FileId', fileIdOnly);
      mergeChunksFormData.append('FileName', selectedFile.name);
      mergeChunksFormData.append('TotalChunks', totalChunks);
  
      const mergeChunksResponse = await fetch(`${baseUrl}/api/files/merge-chunks`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: mergeChunksFormData
      });

      promises.push(mergeChunksResponse);
  
      if (!mergeChunksResponse.ok) {
        const message = 'There was a problem in merging all the chunks. Please try again :(';
        throw new Error(`HTTP error! Status: ${mergeChunksResponse.status} - ${message}`);
      }

      console.log(`Chunks merged successfully fileId: ${id}`);
    });

    await Promise.all(promises);

    // TODO: Display all the file ids (to be included in postman POST request for /api/projects/create)
    
  }
  catch (err) {
    console.error(err);
  }
}

fileUploads.addEventListener('change', handleFileChange);
form.addEventListener('submit', handleFileSubmit);
