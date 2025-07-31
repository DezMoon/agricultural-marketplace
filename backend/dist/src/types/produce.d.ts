export interface ProduceListing {
    id: number;
    user_id: number;
    title: string;
    description: string;
    category: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    location: string;
    harvest_date: Date;
    listing_date: Date;
    status: 'active' | 'sold' | 'expired';
    image_url?: string;
    created_at: Date;
    updated_at?: Date;
}
export interface CreateProduceListingData {
    title: string;
    description: string;
    category: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    location: string;
    harvest_date: string;
}
export interface UpdateProduceListingData extends Partial<CreateProduceListingData> {
    status?: 'active' | 'sold' | 'expired';
    image_url?: string;
}
export interface ProduceSearchFilters {
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export interface ProduceListingWithFarmer extends ProduceListing {
    farmer_username: string;
    farmer_email: string;
}
//# sourceMappingURL=produce.d.ts.map