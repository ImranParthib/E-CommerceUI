import React from 'react';

const ProductBadges = ({ discountPercentage, stockStatus }) => {
    return (
        <>
            {/* Discount badge */}
            {discountPercentage > 0 && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium z-10">
                    {discountPercentage}% OFF
                </div>
            )}

            {/* Stock status badge */}
            {stockStatus && (
                <div className={`absolute top-2 ${discountPercentage > 0 ? 'left-14' : 'left-2'} 
          ${stockStatus === 'instock' ? 'bg-green-500' : 'bg-red-500'} 
          text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium z-10`}>
                    {stockStatus === 'instock' ? 'In Stock' : 'Out of Stock'}
                </div>
            )}
        </>
    );
};

export default ProductBadges;
