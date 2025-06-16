import React from 'react';

const DarkModeToggle = ({ darkMode, toggleDarkMode }) => (
  <button
    onClick={toggleDarkMode}
    style={{
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '1.2em',
      cursor: 'pointer',
      marginLeft: 'auto',
      marginRight: '10px',
      padding: '8px 12px',
      borderRadius: '5px',
      transition: 'background 0.2s',
      backgroundColor: darkMode ? '#333' : 'transparent',
    }}
    aria-label="Toggle dark mode"
    title="Toggle dark mode"
  >
    {darkMode ? '🌙' : '☀️'}
  </button>
);

export default DarkModeToggle;
