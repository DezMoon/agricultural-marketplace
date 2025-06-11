// frontend/src/components/MyListings.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './MyListings.css';

const MyListings = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const fetchMyListings = async () => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to view your listings.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        'http://localhost:3000/api/produce/my-listings',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMyListings(data);
      } else if (response.status === 401 || response.status === 403) {
        setError('Session expired or unauthorized. Please log in again.');
        // Consider calling logout() here if you want to force re-login on 401/403
        // logout();
      } else {
        setError('Failed to fetch your listings.');
      }
    } catch (err) {
      console.error('Error fetching my listings:', err);
      setError('An error occurred while connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, [isAuthenticated, user]);

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/produce/listings/${listingId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setMessage('Listing deleted successfully!');
        setMyListings(myListings.filter((listing) => listing.id !== listingId));
      } else {
        const errorData = await response.json();
        // Check for foreign key error (customize this check based on your backend error message)
        if (
          errorData.error &&
          errorData.error.includes('referenced from table "messages"')
        ) {
          setPendingDeleteId(listingId);
          setShowModal(true);
        } else {
          setError(errorData.error || 'Failed to delete listing.');
        }
      }
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError('An error occurred while connecting to the server.');
    }
  };

  // Function to force delete listing and its messages
  const handleForceDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/produce/listings/${pendingDeleteId}?force=true`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        setMessage('Listing and related conversations deleted successfully!');
        setMyListings(
          myListings.filter((listing) => listing.id !== pendingDeleteId)
        );
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || 'Failed to delete listing and conversations.'
        );
      }
    } catch (err) {
      setError('An error occurred while connecting to the server.');
    } finally {
      setShowModal(false);
      setPendingDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="my-listings-container">Loading your listings...</div>
    );
  }

  if (error) {
    return (
      <div className="my-listings-container error-message">Error: {error}</div>
    );
  }

  if (myListings.length === 0) {
    return (
      <div className="my-listings-container">
        <h2>My Listings</h2>
        <p>
          You have no produce listings yet.{' '}
          <Link to="/create-listing">Create one!</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="my-listings-container">
      <h2>My Listings</h2>
      {message && <p className="success-message">{message}</p>}
      <ul className="my-listings-list">
        {myListings.map((listing) => (
          <li key={listing.id} className="my-listing-item">
            <div className="listing-details">
              <strong>Produce:</strong> {listing.produce_type}
              <br />
              <strong>Quantity:</strong> {listing.quantity} {listing.unit}
              <br />
              <strong>Price:</strong> ZMW {listing.price_per_unit}
              <br />
              <strong>Location:</strong> {listing.location}
              <br />
              {listing.description && (
                <>
                  <strong>Description:</strong> {listing.description}
                  <br />
                </>
              )}
              <small>
                Posted on: {new Date(listing.listing_date).toLocaleDateString()}
              </small>
            </div>
            <div className="listing-actions">
              <button
                onClick={() => navigate(`/edit-listing/${listing.id}`)}
                className="edit-button"
              >
                Edit
              </button>{' '}
              {/* Added Edit button */}
              <button
                onClick={() => handleDelete(listing.id)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Cannot Delete Listing</h3>
            <p>
              There are conversations in your inbox referencing this listing.
              Deleting this listing will also delete all related conversations.
              Do you want to continue?
            </p>
            <button onClick={handleForceDelete} className="delete-button">
              Continue & Delete All
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;
