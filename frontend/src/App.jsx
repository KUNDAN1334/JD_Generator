import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [editedJobDescription, setEditedJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleGenerateJD = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setJobDescription('');
    setEditedJobDescription('');

    try {
      const response = await axios.post('http://localhost:5000/api/generate-jd', { prompt });
      const jd = response.data.jobDescription;
      setJobDescription(jd);
      setEditedJobDescription(jd);
    } catch (err) {
      setError('Failed to generate job description. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageHeight = 280; // Approx A4 page height in mm (minus margins)
    let y = 10;

    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Job Description', 10, y);
    y += 10;

    // Split and process markdown lines
    const lines = editedJobDescription.split('\n');
    lines.forEach((line) => {
      line = line.trim();
      if (line.startsWith('# ')) {
        // Level 1 header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const text = line.replace('# ', '');
        const splitText = doc.splitTextToSize(text, 180);
        splitText.forEach((splitLine) => {
          if (y > pageHeight) {
            doc.addPage();
            y = 10;
          }
          doc.text(splitLine, 10, y);
          y += 6;
        });
      } else if (line.startsWith('## ')) {
        // Level 2 header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        const text = line.replace('## ', '');
        const splitText = doc.splitTextToSize(text, 180);
        splitText.forEach((splitLine) => {
          if (y > pageHeight) {
            doc.addPage();
            y = 10;
          }
          doc.text(splitLine, 10, y);
          y += 5;
        });
      } else if (line.startsWith('- ')) {
        // Bullet list
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const text = line.replace('- ', '');
        const splitText = doc.splitTextToSize(text, 175); // Slightly narrower for bullet
        splitText.forEach((splitLine, index) => {
          if (y > pageHeight) {
            doc.addPage();
            y = 10;
          }
          doc.text(index === 0 ? '• ' + splitLine : splitLine, index === 0 ? 15 : 20, y);
          y += 5;
        });
      } else if (line.match(/\*\*(.*?)\*\*/)) {
        // Bold text within line
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        let x = 10;
        const parts = line.split(/(\*\*.*?\*\*)/);
        parts.forEach((part) => {
          if (part.match(/\*\*(.*?)\*\*/)) {
            doc.setFont('helvetica', 'bold');
            const boldText = part.replace(/\*\*/g, '');
            const splitBold = doc.splitTextToSize(boldText, 180 - x);
            splitBold.forEach((splitLine) => {
              if (y > pageHeight) {
                doc.addPage();
                y = 10;
                x = 10;
              }
              doc.text(splitLine, x, y);
              x += doc.getTextWidth(splitLine);
            });
            doc.setFont('helvetica', 'normal');
          } else {
            const splitText = doc.splitTextToSize(part, 180 - x);
            splitText.forEach((splitLine) => {
              if (y > pageHeight) {
                doc.addPage();
                y = 10;
                x = 10;
              }
              doc.text(splitLine, x, y);
              x += doc.getTextWidth(splitLine);
            });
          }
        });
        y += 5;
      } else if (line) {
        // Regular text
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(line, 180);
        splitText.forEach((splitLine) => {
          if (y > pageHeight) {
            doc.addPage();
            y = 10;
          }
          doc.text(splitLine, 10, y);
          y += 5;
        });
      }
    });

    doc.save('job-description.pdf');
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Job Description Generator</h1>
      
      {/* Prompt Input */}
      <div className="input-section">
        <textarea
          className="prompt-textarea"
          rows="4"
          placeholder="Enter a prompt (e.g., 'Generate a job description for a Senior Software Engineer specializing in Python')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></textarea>
        <button
          className={`generate-button ${loading ? 'loading' : ''}`}
          onClick={handleGenerateJD}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Job Description'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Job Description Output */}
      {jobDescription && (
        <div className="output-section">
          <div className="flex justify-between items-center mb-4">
            <h2 className="output-title">Generated Job Description</h2>
            <div>
              <button
                className="edit-button mr-2"
                onClick={toggleEditMode}
              >
                {isEditing ? 'View Preview' : 'Edit'}
              </button>
              <button
                className="download-button"
                onClick={handleDownloadPDF}
              >
                Download as PDF
              </button>
            </div>
          </div>
          <div className="job-description-content">
            {isEditing ? (
              <textarea
                className="prompt-textarea w-full"
                rows="20"
                value={editedJobDescription}
                onChange={(e) => setEditedJobDescription(e.target.value)}
                placeholder="Edit your job description here..."
              />
            ) : (
              <ReactMarkdown>{editedJobDescription}</ReactMarkdown>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;