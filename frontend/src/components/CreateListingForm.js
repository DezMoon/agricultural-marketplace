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
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('produce_type', produceType);
    formData.append('quantity', quantity);
    formData.append('unit', unit);
    formData.append('price_per_unit', pricePerUnit);
    formData.append('location', location);
    formData.append('description', description);
    formData.append('farmer_name', user?.username || user?.email || '');
    if (image) {
      formData.append('image', image);
    }

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/produce/listings`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create listing');
      }

      setMessage('Listing created successfully!');
      // Clear form
      setProduceType('');
      setQuantity('');
      setUnit('');
      setPricePerUnit('');
      setLocation('');
      setDescription('');
      setImage(null);
      // Optionally redirect after a short delay
      setTimeout(() => {
        navigate('/my-listings'); // Go to user's listings
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="form-container">
      <h2>Create New Produce Listing</h2>
      {message && <p className="message-success">{message}</p>}
      {error && <p className="message-error">{error}</p>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
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
        <div className="form-group">
          <label htmlFor="image">Image (optional):</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>
        <button type="submit" className="form-button">
          Create Listing
        </button>
      </form>
    </div>
  );
};

export default CreateListingForm;
