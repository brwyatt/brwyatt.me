import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
      <div
        style={{
          display: 'inline-block',
          width: '2.5rem',
          height: '2.5rem',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '1rem',
        }}
      />
      <p>{message}</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
