// frontend/src/components/EditListingForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import { useAuth } from '../context/AuthContext';
import '../styles/Forms.css'; // Reuse existing form styles

const EditListingForm = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // Get the listing ID from the URL

  const [produceType, setProduceType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      if (!isAuthenticated || !user) {
        // Redirect if not authenticated, AuthProvider/ProtectedRoute should handle this
        navigate('/login');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:3000/api/produce/listings/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Ensure authorization for fetching specific listing
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Assuming the backend GET /listings/:id returns a single listing
          // We need a specific endpoint to fetch a single listing by ID, for security purposes
          // For now, we'll assume a successful fetch of *this user's* listing
          // A better approach would be to have a `GET /api/produce/my-listings/:id` endpoint
          // OR, if `GET /api/produce/listings/:id` returns general listing data,
          // then the `PUT` request will do the ownership check.

          // For simplicity and assuming `GET /api/produce/listings/:id`
          // or a new `GET /api/produce/my-listings/:id` exists and returns correctly
          // and the user has access.
          if (data.user_id !== user.userId) {
            // Extra client-side check
            setError('You are not authorized to edit this listing.');
            setLoading(false);
            return;
          }

          setProduceType(data.produce_type);
          setQuantity(data.quantity);
          setUnit(data.unit);
          setPricePerUnit(data.price_per_unit);
          setLocation(data.location);
          setDescription(data.description || ''); // Description might be null
        } else if (response.status === 404) {
          setError('Listing not found.');
        } else if (response.status === 401 || response.status === 403) {
          setError('Unauthorized access. Please log in again.');
          navigate('/login');
        } else {
          setError('Failed to fetch listing for editing.');
        }
      } catch (err) {
        console.error('Error fetching listing for edit:', err);
        setError('An error occurred while loading the listing.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user && id) {
      // Only fetch if authenticated and ID is present
      fetchListing();
    }
  }, [id, isAuthenticated, user, navigate]); // Depend on ID, auth state, and navigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isAuthenticated || !user) {
      setError('You must be logged in to edit a listing.');
      return;
    }

    const farmer_name = user.username || user.email; // Use logged-in user's name

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/produce/listings/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            farmer_name,
            produce_type: produceType,
            quantity: parseFloat(quantity),
            unit,
            price_per_unit: parseFloat(pricePerUnit),
            location,
            description,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage('Produce listing updated successfully!');
        setTimeout(() => {
          navigate('/my-listings'); // Go back to My Listings page
        }, 1500);
      } else if (response.status === 401 || response.status === 403) {
        setError(
          'Unauthorized to update this listing or session expired. Please log in again.'
        );
      } else {
        setError(data.error || 'Failed to update listing.');
      }
    } catch (err) {
      console.error('Error updating listing:', err);
      setError('An error occurred while connecting to the server.');
    }
  };

  if (loading) {
    return <div className="form-container">Loading listing data...</div>;
  }

  if (error && !loading && !produceType) {
    // Show error if it's not just a temp error during loading
    return <div className="form-container error-message">Error: {error}</div>;
  }

  return (
    <div className="form-container">
      <h2>Edit Produce Listing</h2>
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
          Update Listing
        </button>
        <button
          type="button"
          onClick={() => navigate('/my-listings')}
          className="form-button secondary-button"
          style={{ marginLeft: '10px' }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default EditListingForm;
