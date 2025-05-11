import React from 'react';
import { formatPrice } from './utils';
import { Tag } from 'lucide-react';

const ProductInfo = ({ product, getPrice, getOriginalPrice, discountPercentage }) => {
    // Check if product has attributes that require selection
    const hasAttributes = product.requires_attribute_selection ||
        (product.attributes && product.attributes.length > 0);

    // Get attribute summary for display
    const getAttributeSummary = () => {
        if (!product.attributes || product.attributes.length === 0) return null;

        return product.attributes.map(attr => {
            const attrName = attr.name;
            // Show the first option with "+" if there are multiple options
            const optionText = attr.options.length > 1
                ? `${attr.options[0]}${attr.options.length > 1 ? '+' : ''}`
                : attr.options[0];

            return `${attrName}: ${optionText}`;
        }).join(' | ');
    };

    return (
        <>
            {/* Product Name with Fixed Height */}
            <h3 className="text-xs font-medium text-gray-800 line-clamp-2 min-h-[2.25rem]">
                {product.name}
            </h3>

            {/* Quantity if applicable */}
            {product.quantity && (
                <p className="text-xs text-gray-500 mb-0">
                    {product.quantity} pcs
                </p>
            )}

            {/* Attribute indicator if has attributes */}
            {hasAttributes && (
                <div className="flex items-center mb-1 text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                    <Tag className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">{getAttributeSummary() || 'Options available'}</span>
                </div>
            )}

            {/* Price Section */}
            <div className="flex items-center gap-1 mb-1">
                <span className="text-sm font-bold text-gray-900">
                    ৳{formatPrice(getPrice())}
                </span>
                {discountPercentage > 0 && (
                    <span className="text-xs text-gray-500 line-through">
                        ৳{formatPrice(getOriginalPrice())}
                    </span>
                )}
            </div>
        </>
    );
};

export default ProductInfo;
