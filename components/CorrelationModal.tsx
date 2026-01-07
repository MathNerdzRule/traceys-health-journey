
import React from 'react';
import Modal from './Modal';

interface CorrelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  analysisResult: string;
}

// A simple markdown to HTML parser for the analysis result
const Markdown: React.FC<{ content: string }> = ({ content }) => {
  const htmlContent = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .split('\n')
    .map((line, index) => {
      if (line.startsWith('* ')) {
        return <li key={index} className="ml-6 mb-1">{line.substring(2)}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="mb-2">{line}</p>;
    });

  // Group list items
  const groupedContent: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  htmlContent.forEach((node, index) => {
    if (React.isValidElement(node) && node.type === 'li') {
      currentList.push(node);
    } else {
      if (currentList.length > 0) {
        groupedContent.push(<ul key={`ul-${index}`} className="list-disc list-inside space-y-1 my-2">{currentList}</ul>);
        currentList = [];
      }
      groupedContent.push(node);
    }
  });

  if (currentList.length > 0) {
    groupedContent.push(<ul key="ul-end" className="list-disc list-inside space-y-1 my-2">{currentList}</ul>);
  }

  return <>{groupedContent}</>;
};


const CorrelationModal: React.FC<CorrelationModalProps> = ({ isOpen, onClose, isLoading, analysisResult }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Food & Symptom Correlation Analysis">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          <p className="text-brand-text-secondary">Analyzing your logs with Gemini... This may take a moment.</p>
        </div>
      ) : (
        <div className="prose max-w-none text-brand-text-primary">
            <Markdown content={analysisResult} />
        </div>
      )}
    </Modal>
  );
};

export default CorrelationModal;
