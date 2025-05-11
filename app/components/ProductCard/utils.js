// Format price with commas
export const formatPrice = (price) => {
    return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
};

// Calculate discount percentage
export const calculateDiscountPercentage = (product) => {
    if (product.on_sale) {
        return Math.round((1 - (product.sale_price / product.regular_price)) * 100);
    } else if (product.originalPrice > product.price) {
        return Math.round((1 - product.price / product.originalPrice) * 100);
    }
    return 0;
};
