// frontend/src/App.js
import React from 'react';
import ProduceForm from './components/ProduceForm';
import ProduceList from './components/ProduceList'; // Import ProduceList
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Create Produce Listing</h1>
      <ProduceForm />
      <h1>Available Produce</h1>
      <ProduceList /> {/* Render ProduceList */}
    </div>
  );
}

export default App;
