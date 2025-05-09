import React, { useState } from 'react';

const ProduceForm = () => {
  const [formData, setFormData] = useState({
    farmer_name: '',
    produce_type: '',
    quantity: '',
    unit: '',
    price_per_unit: '',
    location: '',
    description: '',
  });
  const [submissionStatus, setSubmissionStatus] = useState(null); // To display success/error messages

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus('submitting'); // Indicate that the form is being submitted

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(
        'http://localhost:3000/api/produce/listings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            farmer_name: formData.farmer_name,
            produce_type: formData.produce_type,
            quantity: formData.quantity,
            unit: formData.unit,
            price_per_unit: formData.price_per_unit,
            location: formData.location,
            description: formData.description,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log('Listing created:', data);
        setSubmissionStatus('success');
        setFormData({
          // Reset the form after successful submission
          farmer_name: '',
          produce_type: '',
          quantity: '',
          unit: '',
          price_per_unit: '',
          location: '',
          description: '',
        });
      } else {
        const errorData = await response.json();
        console.error('Failed to create listing:', errorData);
        setSubmissionStatus('error');
      }
    } catch (error) {
      console.error('Failed to connect to the server:', error);
      setSubmissionStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="farmer_name">Farmer Name:</label>
        <input
          type="text"
          id="farmer_name"
          name="farmer_name"
          value={formData.farmer_name}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="produce_type">Produce Type:</label>
        <input
          type="text"
          id="produce_type"
          name="produce_type"
          value={formData.produce_type}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="quantity">Quantity:</label>
        <input
          type="number"
          id="quantity"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="unit">Unit:</label>
        <input
          type="text"
          id="unit"
          name="unit"
          value={formData.unit}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="price_per_unit">Price per Unit:</label>
        <input
          type="number"
          id="price_per_unit"
          name="price_per_unit"
          value={formData.price_per_unit}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="location">Location:</label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <button type="submit" disabled={submissionStatus === 'submitting'}>
        {submissionStatus === 'submitting' ? 'Creating...' : 'Create Listing'}
      </button>

      {submissionStatus === 'success' && (
        <p style={{ color: 'green' }}>Listing created successfully!</p>
      )}
      {submissionStatus === 'error' && (
        <p style={{ color: 'red' }}>
          Failed to create listing. Please try again.
        </p>
      )}
    </form>
  );
};

export default ProduceForm;
