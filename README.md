<<<<<<< HEAD
# RAG Extractor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An advanced Retrieval-Augmented Generation (RAG) tool that processes internal documents and real-time web search results to extract relevant, grounded, and business-ready answers.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Running](#installation--running)
- [Project Structure](#project-structure)
- [Author](#author)
- [License](#license)

## Overview

The RAG Extractor is a powerful, single-page application designed for professionals who need to synthesize information from multiple sources quickly. Users can upload their internal documents (`.docx`, `.txt`, `.md`), ask complex questions, and receive a single, coherent answer that is backed by verbatim extracts from the provided documents and the latest information from the web. The application is built with a focus on accuracy, source transparency, and producing a polished, "business-ready" final report.

## Key Features

- **Multi-Source RAG:** Combines information from uploaded documents and Google Search for comprehensive answers.
- **Flexible Search Modes:**
  - **Smart Combined:** Searches both documents and the web.
  - **Internal Docs Only:** Restricts search to uploaded documents.
  - **External Web Only:** Performs a real-time web search.
- **Document Processing:**
  - Supports `.docx`, `.txt`, and `.md` file formats.
  - In-browser document parsing and intelligent text chunking.
  - On-the-fly vector embedding generation using Google's `text-embedding-004` model.
- **Advanced AI Integration:**
  - Leverages the **Google Gemini API** for content generation, search grounding, and analysis.
  - In-memory vector search with cosine similarity for fast and relevant context retrieval.
- **Professional Reporting:**
  - Generates a synthesized, easy-to-read final answer.
  - Displays all supporting extracts with clear source citations.
  - **Export to DOCX:** Creates a structured, professionally formatted `.doc` file ready for business reports.
  - **Export to JSON:** Provides a structured data output for developers and system integration.
- **User-Friendly Interface:**
  - Clean, responsive UI built with React and Tailwind CSS.
  - Drag-and-drop file uploads.
  - `.docx` file preview modal.
  - Persistent search history for quick access to previous queries.

## Tech Stack

- **Frontend:**
  - [React](https://reactjs.org/) (v19)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
- **AI & Data Processing:**
  - [Google Gemini API (`@google/genai`)](https://ai.google.dev/): For generation, search grounding, and embeddings.
  - [mammoth.js](https://github.com/mwilliamson/mammoth.js): For parsing `.docx` files in the browser.
- **Deployment:**
  - Designed as a static web application. It can be hosted on any static site hosting service (e.g., Vercel, Netlify, GitHub Pages) or run in a secure environment like Google AI Studio.
  - Dependencies are loaded via an `importmap` from a CDN, requiring no local `npm install`.

## Getting Started

### Prerequisites

The application requires a valid Google Gemini API key to function.

- **API Key:** The application is designed to read the API key from a `process.env.API_KEY` environment variable. You must have this variable configured in the environment where the application is served.

### Installation & Running

This project is configured to run directly in the browser without a local build step, thanks to the use of `importmap`.

1.  **Ensure Environment Variable is Set:** Make sure the `API_KEY` is available in your hosting environment. The application will not prompt for a key and will fail if it's not present.

2.  **Serve the Files:** Serve the project's root directory using a simple static server.
    ```bash
    # If you have Python 3 installed
    python3 -m http.server

    # Or using Node.js with the 'serve' package
    npx serve .
    ```

3.  **Access the Application:** Open your web browser and navigate to the local server's address (e.g., `http://localhost:8000`).

## Project Structure

The codebase is organized into logical directories for components, services, and utilities.

```
/
├── components/         # Reusable React UI components
│   ├── icons/          # SVG icon components
│   └── ...
├── services/           # Business logic and external API communication
│   ├── geminiService.ts    # Handles all interactions with the Gemini API
│   └── retrievalService.ts # Manages text chunking, embedding, and vector search
├── index.html          # Main HTML entry point with importmap
├── index.tsx           # React application root
├── App.tsx             # Main application component and state management
├── types.ts            # Core TypeScript type definitions
├── utils.ts            # Helper functions (e.g., file size formatting)
└── README.md           # This file
```

## Author

**Shoury Pandya**

- **LinkedIn:** [https://www.linkedin.com/in/shourypandya/](https://www.linkedin.com/in/shourypandya/)

## License

This project is licensed under the MIT License.
=======
# RAG-Extractor
>>>>>>> 2fbdeb004e87337cf7ad5c383008321afa405060
