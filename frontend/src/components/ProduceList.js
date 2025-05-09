import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const ProduceList = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [produceTypeFilter, setProduceTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // You can adjust the default page size

  useEffect(() => {
    const socket = io('http://localhost:3000', { transports: ['websocket'] });

    const fetchListings = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `http://localhost:3000/api/produce/listings?produce_type=${produceTypeFilter}&location=${locationFilter}&search=${searchQuery}&page=${page}&pageSize=${pageSize}`
        );
        if (response.ok) {
          const data = await response.json();
          setListings(data);
        } else {
          setError('Failed to fetch listings.');
        }
      } catch (error) {
        setError('Error connecting to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();

    socket.on('newListing', (newListing) => {
      setListings((prevListings) => [newListing, ...prevListings]);
    });

    return () => {
      socket.disconnect();
    };
  }, [produceTypeFilter, locationFilter, searchQuery, page, pageSize]); // Re-fetch when any dependency changes

  const handleProduceTypeChange = (e) => {
    setProduceTypeFilter(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleLocationChange = (e) => {
    setLocationFilter(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (listings.length === pageSize) {
      // Simple check if there might be more pages
      setPage(page + 1);
    }
  };

  if (loading) {
    return <div>Loading listings...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Produce Listings</h2>

      <div>
        <label htmlFor="produceTypeFilter">Filter by Produce Type:</label>
        <input
          type="text"
          id="produceTypeFilter"
          value={produceTypeFilter}
          onChange={handleProduceTypeChange}
          placeholder="e.g., Maize"
        />
      </div>

      <div>
        <label htmlFor="locationFilter">Filter by Location:</label>
        <input
          type="text"
          id="locationFilter"
          value={locationFilter}
          onChange={handleLocationChange}
          placeholder="e.g., Lusaka"
        />
      </div>

      <div>
        <label htmlFor="searchQuery">Search Listings:</label>
        <input
          type="text"
          id="searchQuery"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by type, location, or description"
        />
      </div>

      {listings.length === 0 ? (
        <div>No listings available.</div>
      ) : (
        <ul>
          {listings.map((listing) => (
            <li key={listing.id}>
              Farmer: {listing.farmer_name}, Produce: {listing.produce_type},
              Quantity: {listing.quantity} {listing.unit}, Price:{' '}
              {listing.price_per_unit}, Location: {listing.location}
              {listing.description && `, Description: ${listing.description}`}
            </li>
          ))}
        </ul>
      )}

      <div>
        <button onClick={handlePreviousPage} disabled={page === 1}>
          Previous
        </button>
        <span> Page {page} </span>
        <button onClick={handleNextPage} disabled={listings.length < pageSize}>
          Next
        </button>
      </div>
    </div>
  );
};

export default ProduceList;
