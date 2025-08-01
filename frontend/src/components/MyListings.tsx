// frontend/src/components/MyListings.tsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProduceStore } from '../store/produceStore';
import { Link } from 'react-router-dom';
import '../styles/MyListings.css';

const MyListings: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const {
    myListings,
    loading,
    error,
    fetchMyListings,
    deleteListingById,
    clearError,
  } = useProduceStore();

  const [message, setMessage] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMyListings();
    }
  }, [isAuthenticated, user, fetchMyListings]);

  const handleDeleteListing = async (listingId: number): Promise<void> => {
    try {
      await deleteListingById(listingId);
      setMessage('Listing deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      // Error is already handled in the store
      // eslint-disable-next-line no-console
      console.error('Error deleting listing:', err);
    }
    setShowModal(false);
    setPendingDeleteId(null);
  };

  const openDeleteModal = (id: number): void => {
    setPendingDeleteId(id);
    setShowModal(true);
  };

  const closeDeleteModal = (): void => {
    setShowModal(false);
    setPendingDeleteId(null);
  };

  const clearMessages = (): void => {
    setMessage('');
    if (error) {
      clearError();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="my-listings-container">
        <p>Please log in to view your listings.</p>
        <Link to="/login">Go to Login</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading your listings...</div>;
  }

  return (
    <div className="my-listings-container">
      <h2>My Listings</h2>

      {message && (
        <div className="message success-message">
          {message}
          <button onClick={clearMessages} className="close-button">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="message error-message">
          {error}
          <button onClick={clearMessages} className="close-button">
            ×
          </button>
        </div>
      )}

      <div className="listings-header">
        <Link to="/create-listing" className="create-listing-btn">
          Create New Listing
        </Link>
      </div>

      {!myListings || !Array.isArray(myListings) || myListings.length === 0 ? (
        <div className="no-listings">
          <p>You haven't created any listings yet.</p>
          <Link to="/create-listing" className="create-first-listing-btn">
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="listings-grid">
          {Array.isArray(myListings) &&
            myListings.map((listing) => (
              <div key={listing.id} className="listing-card">
                <div className="listing-image">
                  {listing.image_url ? (
                    <img
                      src={
                        listing.image_url.startsWith('http')
                          ? listing.image_url
                          : `http://localhost:3000/uploads/${listing.image_url}`
                      }
                      alt={listing.produce_type}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/src/assets/default-produce.jpg';
                      }}
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>

                <div className="listing-content">
                  <h3>{listing.produce_type}</h3>
                  <p className="listing-price">
                    ${listing.price_per_unit}/{listing.unit}
                  </p>
                  <p className="listing-quantity">
                    Available: {listing.quantity} {listing.unit}
                  </p>
                  <p className="listing-location">{listing.location}</p>
                  <p className="listing-description">{listing.description}</p>
                  <p className="listing-category">
                    Category: {listing.produce_type}
                  </p>

                  <div className="listing-actions">
                    <Link
                      to={`/edit-listing/${listing.id}`}
                      className="edit-btn"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => openDeleteModal(listing.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete this listing? This action cannot
              be undone.
            </p>
            <div className="modal-actions">
              <button onClick={closeDeleteModal} className="cancel-btn">
                Cancel
              </button>
              <button
                onClick={() =>
                  pendingDeleteId && handleDeleteListing(pendingDeleteId)
                }
                className="confirm-delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;
