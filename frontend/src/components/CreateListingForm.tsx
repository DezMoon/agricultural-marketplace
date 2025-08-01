// frontend/src/components/CreateListingForm.tsx
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore'; // To get the token for authenticated requests
import '../styles/Forms.css'; // Reuse existing form styles

const CreateListingForm: React.FC = () => {
  const { user } = useAuthStore(); // Get user object from context (contains token implicitly for requests)
  const navigate = useNavigate();

  const [produceType, setProduceType] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [pricePerUnit, setPricePerUnit] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
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
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create listing';
      setError(errorMessage);
    }
  };

  return (
    <div className="form-container">
      <h2>Create New Produce Listing</h2>
      {message && <p className="message-success">{message}</p>}
      {error && <p className="message-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="produce-type">Produce Type:</label>
          <input
            type="text"
            id="produce-type"
            value={produceType}
            onChange={(e) => setProduceType(e.target.value)}
            placeholder="e.g., Maize, Tomatoes, Cabbage"
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
            min="1"
            required
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
          <label htmlFor="price-per-unit">Price per Unit (K):</label>
          <input
            type="number"
            id="price-per-unit"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(e.target.value)}
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="location">Location:</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Lusaka, Ndola, Kitwe"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional: Additional details about your produce"
            rows={4}
          />
        </div>
        <div className="form-group">
          <label htmlFor="image">Upload Image:</label>
          <input
            type="file"
            id="image"
            onChange={handleImageChange}
            accept="image/*"
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
