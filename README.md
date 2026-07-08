mmit message# AI Resume Judge

An agentic AI application that takes a user's resume upload and a target job description, then autonomously analyzes and judges whether the candidate would be hired, providing a detailed verdict and reasoning trail.

## Project Structure

This project contains two main parts:
- `/backend`: Node.js + Express + TypeScript API powering the agentic pipeline.
- `/frontend`: React + Vite + TailwindCSS application providing the user interface.

## Prerequisites

- Node.js (v18 or higher recommended)
- An Anthropic API Key for Claude

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file and add your API key:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and insert your `ANTHROPIC_API_KEY`.*
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:3000`.

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will run on the port specified by Vite (usually `http://localhost:5173`).

## Usage

1. Open the frontend URL in your browser.
2. Upload a resume (PDF or DOCX).
3. Paste the target job description.
4. Click "Analyze" and watch the agentic pipeline process the information in real-time.
5. Review the final verdict, score breakdown, gap analysis, and improvement suggestions.
