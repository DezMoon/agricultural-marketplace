// frontend/src/components/ProduceList.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import '../styles/ProduceList.css';
import defaultImage from '../assets/default-produce.jpg';

const socket = io('http://localhost:3000'); // Connect to your backend Socket.IO server

const ProduceList = () => {
  const { isAuthenticated, user } = useAuth(); // Get authentication state and user info
  const navigate = useNavigate();
  const location = useLocation();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [produceTypeFilter, setProduceTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // Number of items per page
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('listing_date');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page,
        pageSize: pageSize,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      if (produceTypeFilter) {
        params.append('produce_type', produceTypeFilter);
      }
      if (locationFilter) {
        params.append('location', locationFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(
        `http://localhost:3000/api/produce/listings?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setListings(data.data || []);
        setTotalCount(data.pagination?.total || 0);
      } else {
        setError('Failed to fetch produce listings.');
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('An error occurred while connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [
    produceTypeFilter,
    locationFilter,
    searchQuery,
    page,
    pageSize,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    // Socket.IO for real-time updates
    socket.on('newListing', (newListing) => {
      console.log('New listing received via socket:', newListing);
      // Add the new listing to the top of the list if it matches current filters
      // For simplicity, just adding it. A more robust solution might refetch or smartly insert.
      setListings((prevListings) => [newListing, ...prevListings]);
      setTotalCount((prevCount) => prevCount + 1);
    });

    // If user is authenticated, join their private room
    if (isAuthenticated && user && user.userId) {
      socket.emit('joinRoom', user.userId);
      console.log(`Attempting to join user room: user-${user.userId}`);
    }

    return () => {
      socket.off('newListing');
      // No explicit leaveRoom needed for user room unless switching users
      // on the same socket without full page refresh
    };
  }, [isAuthenticated, user]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleContactFarmer = (
    listingId,
    farmerId,
    farmerUsername,
    produceType
  ) => {
    // Navigate to a dedicated messaging page, passing relevant IDs
    if (!isAuthenticated) {
      alert('You must be logged in to contact the farmer.');
      navigate('/login'); // Redirect to login if not authenticated
      return;
    }
    if (user.userId === farmerId) {
      alert('You cannot message yourself for your own listing.');
      return;
    }
    navigate(`/messages/${listingId}/${farmerId}`, {
      state: { farmerUsername, produceType },
    });
  };

  if (loading) {
    return <div className="produce-list-container">Loading listings...</div>;
  }

  if (error) {
    return (
      <div className="produce-list-container error-message">Error: {error}</div>
    );
  }

  return (
    <div className="produce-list-container">
      <h2>Available Produce Listings</h2>

      <div className="filters-and-search">
        <input
          type="text"
          placeholder="Filter by Produce Type (e.g., Maize)"
          value={produceTypeFilter}
          onChange={(e) => {
            setProduceTypeFilter(e.target.value);
            setPage(1); // Reset to first page on filter change
          }}
        />
        <input
          type="text"
          placeholder="Filter by Location (e.g., Lusaka)"
          value={locationFilter}
          onChange={(e) => {
            setLocationFilter(e.target.value);
            setPage(1); // Reset to first page on filter change
          }}
        />
        <input
          type="text"
          placeholder="Search by type, location, or description"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1); // Reset to first page on search change
          }}
        />
        <div className="sort-options">
          <span>Sort By:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="listing_date">Date</option>
            <option value="produce_type">Produce Type</option>
            <option value="quantity">Quantity</option>
            <option value="price_per_unit">Price</option>
            <option value="location">Location</option>
            <option value="farmer_name">Farmer</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {listings && listings.length > 0 ? (
        <>
          <ul className="produce-list">
            {listings.map((listing) => (
              <li
                key={listing.id}
                className="produce-item"
                onClick={() => navigate(`/listing/${listing.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={
                    listing.image_url
                      ? `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}${listing.image_url}`
                      : defaultImage
                  }
                  alt={listing.produce_type}
                />
                <h3>{listing.produce_type}</h3>
                <p>Farmer: {listing.farmer_name}</p>
                <p>{listing.description}</p>
                <h4>
                  Price: K{Number(listing.price_per_unit).toLocaleString()}
                </h4>
                <small>
                  Date posted:{' '}
                  {new Date(listing.listing_date).toLocaleDateString()}
                </small>
              </li>
            ))}
          </ul>

          <div className="pagination-controls">
            <button onClick={handlePrevPage} disabled={page === 1}>
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button onClick={handleNextPage} disabled={page === totalPages}>
              Next
            </button>
          </div>
        </>
      ) : (
        <p>No listings found matching your criteria.</p>
      )}
    </div>
  );
};

export default ProduceList;
