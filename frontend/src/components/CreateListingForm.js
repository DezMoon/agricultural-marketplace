// frontend/src/components/CreateListingForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // To get the token for authenticated requests
import '../styles/Forms.css'; // Reuse existing form styles

const CreateListingForm = () => {
  const { user } = useAuth(); // Get user object from context (contains token implicitly for requests)
  const navigate = useNavigate();

  const [produceType, setProduceType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Ensure user is logged in
    if (!user) {
      setError('You must be logged in to create a listing.');
      return;
    }

    // Since farmer_name is not collected in the form, use the logged-in username
    const farmer_name = user.username || user.email; // Fallback to email if username somehow isn't there

    try {
      const token = localStorage.getItem('token'); // Get token from local storage

      const response = await fetch(
        'http://localhost:3000/api/produce/listings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Send the token
          },
          body: JSON.stringify({
            farmer_name, // Taken from authenticated user
            produce_type: produceType,
            quantity: parseFloat(quantity), // Convert to number
            unit,
            price_per_unit: parseFloat(pricePerUnit), // Convert to number
            location,
            description,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage('Produce listing created successfully!');
        // Clear form
        setProduceType('');
        setQuantity('');
        setUnit('');
        setPricePerUnit('');
        setLocation('');
        setDescription('');
        // Optionally redirect after a short delay
        setTimeout(() => {
          navigate('/'); // Go back to produce listings
        }, 2000);
      } else {
        setError(data.error || 'Failed to create listing.');
      }
    } catch (err) {
      console.error('Error creating listing:', err);
      setError('An error occurred while connecting to the server.');
    }
  };

  return (
    <div className="form-container">
      <h2>Create New Produce Listing</h2>
      {message && <p className="message-success">{message}</p>}
      {error && <p className="message-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="produceType">Produce Type:</label>
          <input
            type="text"
            id="produceType"
            value={produceType}
            onChange={(e) => setProduceType(e.target.value)}
            placeholder="e.g., Maize, Tomatoes"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="quantity">Quantity:</label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g., 500"
            required
            min="0"
          />
        </div>
        <div className="form-group">
          <label htmlFor="unit">Unit:</label>
          <input
            type="text"
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g., kg, bags, crates"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="pricePerUnit">Price Per Unit (ZMW):</label>
          <input
            type="number"
            id="pricePerUnit"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(e.target.value)}
            placeholder="e.g., 250 (for per kg/bag)"
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="location">Location:</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Lusaka, Chongwe"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description (Optional):</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Freshly harvested, organic, 2024 season"
            rows="4"
          ></textarea>
        </div>
        <button type="submit" className="form-button">
          Create Listing
        </button>
      </form>
    </div>
  );
};

export default CreateListingForm;
