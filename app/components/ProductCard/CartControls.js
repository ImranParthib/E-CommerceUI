import React from 'react';
import { Minus, Plus, ShoppingBag, Trash2, Settings } from 'lucide-react';
import { formatPrice } from './utils';
import { toast } from 'react-toastify';

const CartControls = ({ product, cartItemQty, getPrice, incrementQty, decrementQty, removeFromCart }) => {
    // Handle item removal with toast notification
    const handleRemoveItem = (e) => {
        e.stopPropagation();
        toast.info(`${product.name} removed from cart`);
        removeFromCart();
    };

    // Check if product requires attribute selection
    const requiresSelection = product.requires_attribute_selection ||
        (product.attributes && product.attributes.length > 0);

    return (
        <div className="mt-auto pt-0">
            {cartItemQty > 0 ? (
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-xs text-green-600 font-medium">
                        <span>In cart:</span>
                        <span>৳{formatPrice(getPrice() * cartItemQty)}</span>
                    </div>
                    <div className="flex items-center justify-between border border-gray-200 rounded-lg">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (cartItemQty === 1) {
                                    handleRemoveItem(e);
                                } else {
                                    decrementQty(e);
                                }
                            }}
                            className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-l-lg"
                        >
                            {cartItemQty === 1 ? (
                                <Trash2 className="w-3 h-3 text-red-500" />
                            ) : (
                                <Minus className="w-3 h-3" />
                            )}
                        </button>
                        <span className="flex-1 text-center text-xs font-medium">{cartItemQty}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                incrementQty(e);
                            }}
                            className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-r-lg"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={(e) => {
                        // No need to show notification here as the ProductCard's incrementQty will handle that
                        e.stopPropagation();
                        incrementQty(e);
                    }}
                    className={`w-full py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-colors text-xs font-medium
                        ${requiresSelection
                            ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                            : 'bg-yellow-400 hover:bg-yellow-500 text-black'}`}
                >
                    {requiresSelection ? (
                        <>
                            <Settings className="w-3 h-3" />
                            Select options
                        </>
                    ) : (
                        <>
                            <ShoppingBag className="w-3 h-3" />
                            Add to cart
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default CartControls;
