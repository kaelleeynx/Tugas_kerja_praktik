import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'var(--border-subtle)',
            borderTopColor: 'var(--brand)',
          }}
        />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
