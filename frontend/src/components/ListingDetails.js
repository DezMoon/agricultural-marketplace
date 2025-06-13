import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import defaultImage from '../assets/default-produce.jpg';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`${API_URL}/api/produce/listings/${id}`);
        if (!res.ok) throw new Error('Listing not found');
        const data = await res.json();
        setListing(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleContactFarmer = () => {
    if (!isAuthenticated) {
      alert('You must be logged in to contact the farmer.');
      navigate('/login');
      return;
    }
    if (user.userId === listing.user_id) {
      alert('You cannot message yourself for your own listing.');
      return;
    }
    // Navigate to messaging page, passing relevant info
    navigate(`/messages/${listing.id}/${listing.user_id}`, {
      state: {
        farmerUsername: listing.farmer_name,
        produceType: listing.produce_type,
      },
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!listing) return null;

  return (
    <div
      className="listing-details-container"
      style={{
        maxWidth: 700,
        margin: '30px auto',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: 24,
        border: '1px solid #e0e0e0',
      }}
    >
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← Back
      </button>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', minWidth: 250 }}>
          <img
            src={
              listing.image_url
                ? `${API_URL}${listing.image_url}`
                : defaultImage
            }
            alt={listing.produce_type}
            style={{
              width: '100%',
              borderRadius: 8,
              objectFit: 'cover',
              maxHeight: 350,
            }}
          />
        </div>
        <div
          style={{
            flex: '2 1 350px',
            minWidth: 250,
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            border: 'none', // Remove any inner border
          }}
        >
          <h2 style={{ marginTop: 0 }}>{listing.produce_type}</h2>
          <p>
            <strong>Description:</strong> {listing.description}
          </p>
          <p>
            <strong>Quantity:</strong>{' '}
            {Number(listing.quantity).toLocaleString()} {listing.unit}
          </p>
          <p>
            <strong>Price per unit:</strong> K
            {Number(listing.price_per_unit).toLocaleString()}
          </p>
          <p>
            <strong>Location:</strong> {listing.location}
          </p>
          <p>
            <strong>Farmer:</strong> {listing.farmer_name}
          </p>
          <p>
            <strong>Date posted:</strong>{' '}
            {new Date(listing.listing_date).toLocaleDateString()}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            {listing.availability_status || 'Available'}
          </p>
          {isAuthenticated && user && user.userId !== listing.user_id && (
            <button
              style={{
                marginTop: 24,
                padding: '10px 24px',
                background: '#388e3c',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
              onClick={handleContactFarmer}
            >
              Contact Farmer
            </button>
          )}
        </div>
      </div>
      {/* Show login/register prompt if not authenticated */}
      {!isAuthenticated && listing && (
        <div
          style={{
            marginTop: 32,
            padding: 24,
            border: '2px solid #d32f2f',
            borderRadius: 8,
            background: '#fff8f8',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 18, marginBottom: 16 }}>
            Want to get <strong>{listing.produce_type}</strong>?{' '}
            <span style={{ color: '#d32f2f' }}>Login</span> or{' '}
            <span style={{ color: '#1976d2' }}>Register</span> to contact{' '}
            <strong>{listing.farmer_name}</strong>.
          </p>
          <button
            style={{
              marginRight: 16,
              padding: '8px 20px',
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button
            style={{
              padding: '8px 20px',
              background: '#388e3c',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/register')}
          >
            Register
          </button>
        </div>
      )}
    </div>
  );
};

export default ListingDetails;
