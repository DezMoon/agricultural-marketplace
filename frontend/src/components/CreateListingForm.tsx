import React from 'react';
import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore'; // To get the token for authenticated requests
import '../styles/Forms.css'; // Reuse existing form styles

const CreateListingForm: React.FC = () => {
  const { user } = useAuthStore(); // Get user object from context (contains token implicitly for requests)
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [pricePerUnit, setPricePerUnit] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [harvestDate, setHarvestDate] = useState<string>('');
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
    formData.append('title', title);
    formData.append('category', category);
    formData.append('quantity', quantity);
    formData.append('unit', unit);
    formData.append('price_per_unit', pricePerUnit);
    formData.append('location', location);
    formData.append('description', description);
    formData.append('harvest_date', harvestDate);
    if (image) {
      formData.append('image', image);
    }

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/produce/listings`,
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
      setTitle('');
      setCategory('');
      setQuantity('');
      setUnit('');
      setPricePerUnit('');
      setLocation('');
      setDescription('');
      setHarvestDate('');
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
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Fresh Maize, Organic Tomatoes"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            <option value="vegetables">Vegetables</option>
            <option value="fruits">Fruits</option>
            <option value="grains">Grains</option>
            <option value="dairy">Dairy</option>
            <option value="meat">Meat</option>
            <option value="other">Other</option>
          </select>
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
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
          >
            <option value="">Select Unit</option>
            <option value="kg">Kilograms (kg)</option>
            <option value="lbs">Pounds (lbs)</option>
            <option value="tons">Tons</option>
            <option value="pieces">Pieces</option>
            <option value="liters">Liters</option>
            <option value="gallons">Gallons</option>
          </select>
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
            placeholder="Additional details about your produce"
            rows={4}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="harvest-date">Harvest Date:</label>
          <input
            type="date"
            id="harvest-date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            required
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
