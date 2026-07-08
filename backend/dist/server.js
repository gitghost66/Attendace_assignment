"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const pdfParse = require('pdf-parse');
const mammoth_1 = __importDefault(require("mammoth"));
const dotenv_1 = __importDefault(require("dotenv"));
const pipeline_1 = require("./agents/pipeline");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// In-memory storage for simplicity (demo tool)
const resumes = new Map();
// Configure multer for file uploads (memory storage)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        }
        else {
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
        }
        else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth_1.default.extractRawText({ buffer: file.buffer });
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
    }
    catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: error.message || 'Error processing upload' });
    }
});
app.post('/api/analyze/:resumeId', async (req, res) => {
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
        const sendEvent = (event, payload) => {
            res.write(`data: ${JSON.stringify({ event, payload })}\n\n`);
        };
        try {
            const result = await (0, pipeline_1.runPipeline)(data.text, data.jobDescription, (stepName, status, output) => {
                sendEvent('step', { stepName, status, output });
            });
            sendEvent('complete', result);
            res.end();
        }
        catch (pipelineError) {
            console.error('Pipeline Error:', pipelineError);
            sendEvent('error', { message: pipelineError.message || 'Pipeline failed' });
            res.end();
        }
    }
    catch (error) {
        console.error('Analyze Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message || 'Error during analysis' });
        }
        else {
            res.write(`data: ${JSON.stringify({ event: 'error', payload: { message: error.message } })}\n\n`);
            res.end();
        }
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
