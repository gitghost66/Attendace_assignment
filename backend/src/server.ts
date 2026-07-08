import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import dotenv from 'dotenv';
import { runPipeline } from './agents/pipeline';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory storage for simplicity (demo tool)
const resumes = new Map<string, { text: string; jobDescription: string; titleCompany?: string }>();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX are supported.'));
    }
  },
});

app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    const { jobDescription, titleCompany } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No resume file uploaded.' });
    }
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required.' });
    }

    let extractedText = '';

    if (file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(file.buffer);
      extractedText = pdfData.text;
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    }

    const resumeId = Math.random().toString(36).substring(2, 15);
    
    resumes.set(resumeId, {
      text: extractedText,
      jobDescription,
      titleCompany,
    });

    res.json({
      resumeId,
      preview: extractedText.substring(0, 200) + '...',
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message || 'Error processing upload' });
  }
});

app.get('/api/analyze/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    const data = resumes.get(resumeId);

    if (!data) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    // Run the agentic pipeline, but use Server-Sent Events (SSE) to stream updates
    // For simplicity, we could stream JSON updates over HTTP, or just wait.
    // The prompt requested a live agent trail. We should set up SSE for this endpoint.
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (event: string, payload: any) => {
      res.write(`data: ${JSON.stringify({ event, payload })}\n\n`);
    };

    try {
      const result = await runPipeline(
        data.text,
        data.jobDescription,
        (stepName, status, output) => {
          sendEvent('step', { stepName, status, output });
        }
      );
      
      sendEvent('complete', result);
      res.end();
    } catch (pipelineError: any) {
      console.error('Pipeline Error:', pipelineError);
      sendEvent('error', { message: pipelineError.message || 'Pipeline failed' });
      res.end();
    }
    
  } catch (error: any) {
    console.error('Analyze Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Error during analysis' });
    } else {
      res.write(`data: ${JSON.stringify({ event: 'error', payload: { message: error.message } })}\n\n`);
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
