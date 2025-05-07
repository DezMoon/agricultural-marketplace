class Produce {
  constructor(
    id,
    farmer_name,
    produce_type,
    quantity,
    unit,
    price_per_unit,
    location,
    description,
    image_url,
    listing_date,
    availability_status
  ) {
    this.id = id;
    this.farmer_name = farmer_name;
    this.produce_type = produce_type;
    this.quantity = quantity;
    this.unit = unit;
    this.price_per_unit = price_per_unit;
    this.location = location;
    this.description = description;
    this.image_url = image_url;
    this.listing_date = listing_date;
    this.availability_status = availability_status;
  }
}

module.exports = Produce;
