import React, { useState, useEffect } from 'react';

const ProduceList = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          'http://localhost:3000/api/produce/listings'
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
  }, []); // The empty dependency array ensures this effect runs only once on mount

  if (loading) {
    return <div>Loading listings...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Produce Listings</h2>
      {listings.length === 0 ? (
        <div>No listings available.</div>
      ) : (
        <ul>
          {listings.map((listing) => (
            <li key={listing.id}>
              Farmer: {listing.farmer_name}, Produce: {listing.produce_type},
              Quantity: {listing.quantity} {listing.unit}, Price:{' '}
              {listing.price_per_unit}, Location: {listing.location}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProduceList;
