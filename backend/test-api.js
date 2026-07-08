const fs = require('fs');

async function test() {
  try {
    // 1. Upload a dummy resume
    const formData = new FormData();
    formData.append('jobDescription', 'Looking for a software engineer with React and Node.js experience.');
    
    // Create a dummy PDF or text file
    // Multer expects a file, we can just use a dummy blob in fetch
    const fileBlob = new Blob(['Dummy resume content'], { type: 'application/pdf' });
    formData.append('resume', fileBlob, 'resume.pdf');

    console.log('Uploading...');
    const uploadRes = await fetch('http://localhost:3000/api/upload-resume', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadRes.ok) {
      console.error('Upload failed:', await uploadRes.text());
      return;
    }
    
    const uploadData = await uploadRes.json();
    console.log('Upload success:', uploadData);
    
    const resumeId = uploadData.resumeId;
    
    // 2. Start analysis using fetch (simulating EventSource)
    console.log('Starting analysis for', resumeId);
    
    const analyzeRes = await fetch(`http://localhost:3000/api/analyze/${resumeId}`);
    
    console.log('Analysis status:', analyzeRes.status);
    
    const reader = analyzeRes.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log('Received chunk:', decoder.decode(value));
    }
    
    console.log('Done.');
  } catch (err) {
    console.error('Test script error:', err);
  }
}

test();
