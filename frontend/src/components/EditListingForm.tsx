// frontend/src/components/EditListingForm.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ProduceListing } from '../types';
import '../styles/Forms.css'; // Reuse existing form styles

const EditListingForm: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get the listing ID from the URL

  const [produceType, setProduceType] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [pricePerUnit, setPricePerUnit] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [availabilityStatus, setAvailabilityStatus] =
    useState<string>('available');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const fetchListing = async (): Promise<void> => {
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
          const responseData = await response.json();
          const data: ProduceListing = responseData.data || responseData;

          // Check if user owns this listing
          if (data.user_id !== user.id) {
            setError('You are not authorized to edit this listing.');
            return;
          }

          // Populate form with existing data
          setProduceType(data.produce_type);
          setQuantity(data.quantity.toString());
          setUnit(data.unit);
          setPricePerUnit(data.price_per_unit.toString());
          setLocation(data.location);
          setDescription(data.description);
          setAvailabilityStatus(data.availability_status || 'available');
        } else {
          setError('Failed to fetch listing details.');
        }
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError('An error occurred while fetching the listing.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, isAuthenticated, user, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setMessage('');

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
            produce_type: produceType,
            quantity: parseInt(quantity),
            unit: unit,
            price_per_unit: parseFloat(pricePerUnit),
            location: location,
            description: description,
            availability_status: availabilityStatus,
          }),
        }
      );

      if (response.ok) {
        setMessage('Listing updated successfully!');
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/my-listings');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update listing.');
      }
    } catch (err) {
      console.error('Error updating listing:', err);
      setError('An error occurred while updating the listing.');
    }
  };

  if (loading) {
    return <div className="form-container">Loading listing...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="form-container">
        <p>You must be logged in to edit listings.</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>Edit Listing</h2>
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
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="availability-status">Availability Status:</label>
          <select
            id="availability-status"
            value={availabilityStatus}
            onChange={(e) => setAvailabilityStatus(e.target.value)}
          >
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        <button type="submit" className="form-button">
          Update Listing
        </button>
      </form>
    </div>
  );
};

export default EditListingForm;
