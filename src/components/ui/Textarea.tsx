import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

const Textarea: React.FC<TextareaProps> = ({ 
  label, 
  error, 
  helpText, 
  id,
  className = '',
  ...props 
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;
  
  const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm';
  const errorClasses = 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500';
  
  const textareaClasses = `
    ${baseClasses} 
    ${error ? errorClasses : ''} 
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <textarea
        id={textareaId}
        className={textareaClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${textareaId}-error` : helpText ? `${textareaId}-description` : undefined}
        {...props}
      />
      
      {error && (
        <p className="mt-2 text-sm text-red-600" id={`${textareaId}-error`}>
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="mt-2 text-sm text-gray-500" id={`${textareaId}-description`}>
          {helpText}
        </p>
      )}
    </div>
  );
};

export default Textarea;