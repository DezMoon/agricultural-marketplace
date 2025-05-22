import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './ProduceList.css';

const ProduceList = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [produceTypeFilter, setProduceTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [sortBy, setSortBy] = useState('listing_date'); // Default sorting option
  const [sortOrder, setSortOrder] = useState('desc'); // Default sort order

  useEffect(() => {
    const socket = io('http://localhost:3000', { transports: ['websocket'] });

    const fetchListings = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `http://localhost:3000/api/produce/listings?produce_type=${produceTypeFilter}&location=${locationFilter}&search=${searchQuery}&page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`
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
  }, [
    produceTypeFilter,
    locationFilter,
    searchQuery,
    page,
    pageSize,
    sortBy,
    sortOrder,
  ]);

  const handleProduceTypeChange = (e) => {
    setProduceTypeFilter(e.target.value);
    setPage(1);
  };

  const handleLocationChange = (e) => {
    setLocationFilter(e.target.value);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (listings.length === pageSize) {
      setPage(page + 1);
    }
  };

  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
    setPage(1); // Reset page on sort
  };

  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value);
    setPage(1); // Reset page on sort order change
  };

  if (loading) {
    return <div>Loading listings...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="produce-list-container">
      <div className="filter-sort-controls">
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

        <div>
          <label htmlFor="sortBy">Sort By:</label>
          <select id="sortBy" value={sortBy} onChange={handleSortByChange}>
            <option value="listing_date">Date</option>
            <option value="farmer_name">Farmer Name</option>
            <option value="produce_type">Produce Type</option>
            <option value="quantity">Quantity</option>
            <option value="price_per_unit">Price</option>
            <option value="location">Location</option>
          </select>
        </div>

        <div>
          <label htmlFor="sortOrder">Order:</label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={handleSortOrderChange}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {listings.length === 0 ? (
        <div>No listings available.</div>
      ) : (
        <ul className="produce-list">
          {listings.map((listing) => (
            <li key={listing.id}>
              <strong>Farmer:</strong> <span>{listing.farmer_name}</span>
              <strong>Produce:</strong> <span>{listing.produce_type}</span>
              <strong>Quantity:</strong> <span>{listing.quantity}</span>{' '}
              <span>{listing.unit}</span>
              <strong>Price:</strong> <span>{listing.price_per_unit}</span>
              <strong>Location:</strong> <span>{listing.location}</span>
              {listing.description && (
                <>
                  <strong>Description:</strong>{' '}
                  <span>{listing.description}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="pagination-controls">
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
