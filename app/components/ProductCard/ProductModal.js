import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Minus, Plus, ShoppingBag, Trash2, Star, Share2, AlertCircle } from 'lucide-react';
import { formatPrice } from './utils';
import { toast } from 'react-toastify';
import { useCart } from '@/app/context/CartContext';

const ProductModal = ({
    isOpen,
    setIsOpen,
    product,
    cartItemQty,
    discountPercentage,
    getPrice,
    getOriginalPrice,
    incrementQty,
    decrementQty,
    removeFromCart
}) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [attributeErrors, setAttributeErrors] = useState({});
    const { getCartTotal } = useCart();

    // Constants for free delivery
    const FREE_DELIVERY_THRESHOLD = 2000;

    useEffect(() => {
        if (isOpen && product) {
            setSelectedImageIndex(0);
            setSelectedAttributes({});
            setAttributeErrors({});
        }
    }, [isOpen, product]);

    if (!product) return null;

    const brand = product.brands && product.brands.length > 0 ? product.brands[0] : null;
    const rating = parseFloat(product.average_rating) || 0;
    const ratingStars = rating > 0 ? Math.round(rating) : 0;

    const getMainImage = () => {
        if (product.images && product.images.length > 0) {
            return product.images[selectedImageIndex]?.src || product.images[0].src;
        }
        return product.image;
    };

    const hasRequiredAttributes = product.requires_attribute_selection ||
        (product.attributes && product.attributes.length > 0);

    const handleAttributeSelect = (attributeName, value) => {
        setSelectedAttributes(prev => ({
            ...prev,
            [attributeName.toLowerCase()]: value
        }));

        if (attributeErrors[attributeName.toLowerCase()]) {
            setAttributeErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[attributeName.toLowerCase()];
                return newErrors;
            });
        }
    };

    const validateAttributes = () => {
        if (!hasRequiredAttributes) return true;

        const errors = {};
        let isValid = true;

        product.attributes.forEach(attr => {
            const attrName = attr.name.toLowerCase();
            if (!selectedAttributes[attrName]) {
                errors[attrName] = `Please select ${attr.name}`;
                isValid = false;
            }
        });

        setAttributeErrors(errors);
        return isValid;
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();

        if (hasRequiredAttributes && !validateAttributes()) {
            toast.error("Please select all required options");
            return;
        }

        // Create a modified product with selected attributes
        const productWithAttributes = {
            ...product,
            selectedAttributes,
            attributesSelected: true // Flag to indicate attributes have been selected
        };

        // Call incrementQty with the enhanced product
        incrementQty(e, productWithAttributes);

        // Close modal after adding to cart
        setIsOpen(false);
    };

    // Generate sharing URLs
    const getProductUrl = () => {
        // Assuming the URL structure is /product/[id]
        return `${window.location.origin}/product/${product.id}`;
    };

    const getWhatsAppContactUrl = () => {
        const message = `Check out this product: ${product.name} - ৳${formatPrice(getPrice())} ${getProductUrl()}`;
        return `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace('+', '')}?text=${encodeURIComponent(message)}`;
    };

    const getMessengerContactUrl = () => {
        return process.env.NEXT_PUBLIC_MESSENGER_LINK;
    };

    const handleContact = (platform) => {
        toast.success(`Contacting via ${platform}`);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-60" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                                <button
                                    type="button"
                                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 z-10"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="sr-only">Close</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                <div className="flex flex-col md:flex-row">
                                    <div className="bg-gray-50 p-6 relative md:w-1/2">
                                        {discountPercentage > 0 && (
                                            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
                                                {discountPercentage}% OFF
                                            </div>
                                        )}

                                        <div className="relative h-64 sm:h-72 w-full mb-2 flex items-center justify-center">
                                            <img
                                                src={getMainImage()}
                                                alt={product.name}
                                                className="max-h-full max-w-full object-contain transition-all duration-300"
                                            />
                                        </div>

                                        {product.images && product.images.length > 1 && (
                                            <div className="flex space-x-2 overflow-x-auto mt-3 justify-center">
                                                {product.images.slice(0, 4).map((image, index) => (
                                                    <div
                                                        key={index}
                                                        className={`w-16 h-16 border rounded-md overflow-hidden flex-shrink-0 cursor-pointer transition-all duration-200 ${selectedImageIndex === index ? 'border-blue-500 border-2 shadow-md scale-105' : 'hover:border-blue-500'}`}
                                                        onClick={() => setSelectedImageIndex(index)}
                                                    >
                                                        <img
                                                            src={image.src}
                                                            alt={`${product.name} ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Free delivery notification */}

                                        {getCartTotal() >= FREE_DELIVERY_THRESHOLD ? (
                                            <div className="bg-blue-50 p-3 rounded-lg mt-3">
                                                <div className="flex items-center text-sm text-blue-600">
                                                    <AlertCircle className="w-5 h-5 mr-2" />
                                                    <span>Congratulations! You qualify for free delivery.</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-yellow-50 p-3 rounded-lg mt-3">
                                                <div className="flex items-center text-sm">
                                                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                                                    <span className="text-gray-700">
                                                        Add ৳{formatPrice(FREE_DELIVERY_THRESHOLD - getCartTotal())} more for free delivery!
                                                    </span>
                                                </div>
                                            </div>
                                        )}


                                        {/* Contact buttons - placed after free delivery notification */}
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    window.open(getWhatsAppContactUrl(), '_blank');
                                                    handleContact('WhatsApp');
                                                }}
                                                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-md flex items-center justify-center gap-1 text-sm font-medium"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                WhatsApp
                                            </button>
                                            <button
                                                onClick={() => {
                                                    window.open(getMessengerContactUrl(), '_blank');
                                                    handleContact('Messenger');
                                                }}
                                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-md flex items-center justify-center gap-1 text-sm font-medium"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                Messenger
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 pt-4 md:w-1/2">
                                        {brand && (
                                            <div className="text-xs font-medium text-blue-600 mb-1">
                                                {brand.name}
                                            </div>
                                        )}

                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-medium text-gray-900"
                                        >
                                            {product.name}
                                        </Dialog.Title>

                                        {product.rating_count > 0 && (
                                            <div className="flex items-center mt-1">
                                                <div className="flex items-center">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${i < ratingStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-gray-500 ml-2">
                                                    ({product.rating_count} reviews)
                                                </span>
                                            </div>
                                        )}

                                        {product.quantity && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {product.quantity} pcs
                                            </p>
                                        )}

                                        <div className="mt-3 space-y-4">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-bold text-gray-900">
                                                    ৳{formatPrice(getPrice())}
                                                </span>

                                                {discountPercentage > 0 && (
                                                    <span className="text-sm text-gray-500 line-through">
                                                        ৳{formatPrice(getOriginalPrice())}
                                                    </span>
                                                )}
                                            </div>

                                            {hasRequiredAttributes && product.attributes && product.attributes.length > 0 && (
                                                <div className="space-y-3">
                                                    <h4 className="font-medium text-gray-800">Select Options:</h4>

                                                    {product.attributes.map((attr, index) => {
                                                        const attrName = attr.name.toLowerCase();
                                                        return (
                                                            <div key={index} className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <label className="text-sm font-medium text-gray-700">{attr.name}:</label>
                                                                    {attributeErrors[attrName] && (
                                                                        <span className="text-xs text-red-500">{attributeErrors[attrName]}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {attr.options.map((option, idx) => (
                                                                        <button
                                                                            key={idx}
                                                                            className={`px-3 py-1.5 text-sm border rounded-md transition-all
                                                                                ${selectedAttributes[attrName] === option
                                                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                                                                                }`}
                                                                            onClick={() => handleAttributeSelect(attr.name, option)}
                                                                        >
                                                                            {option}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {product.tags && product.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {product.tags.map(tag => (
                                                        <span key={tag.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                                            {tag.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {product.stock_status && (
                                                <div className={`inline-block px-3 py-1 rounded-full text-sm 
                                                    ${product.stock_status === 'instock'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'}`}
                                                >
                                                    {product.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
                                                </div>
                                            )}

                                            {product.description && (
                                                <div className="text-sm text-gray-600 max-h-40 overflow-y-auto mt-2">
                                                    <h4 className="font-medium text-gray-800 mb-1">Description:</h4>
                                                    <div
                                                        dangerouslySetInnerHTML={{ __html: product.description }}
                                                        className="prose prose-sm max-w-none"
                                                    />
                                                </div>
                                            )}

                                            {product.features && product.features.length > 0 && (
                                                <div className="max-h-24 overflow-y-auto">
                                                    <h4 className="text-sm font-medium text-gray-900 mb-1">Features:</h4>
                                                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                                                        {product.features.map((feature, index) => (
                                                            <li key={index}>{feature}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {product.categories && product.categories.length > 0 && (
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-medium">Category:</span>{' '}
                                                    {product.categories.map((cat, index) => (
                                                        <span key={cat.id}>
                                                            {cat.name}
                                                            {index < product.categories.length - 1 && ', '}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {product.sku && (
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">SKU:</span> {product.sku}
                                                </p>
                                            )}

                                            {cartItemQty > 0 && (
                                                <div className="bg-green-50 p-3 rounded-lg">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="font-medium text-green-600">In your bag:</span>
                                                        <span className="font-medium text-green-600">
                                                            {cartItemQty} × ৳{formatPrice(getPrice())} = ৳{formatPrice(getPrice() * cartItemQty)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Free delivery notification */}

                                        </div>

                                        <div className="mt-6">
                                            {cartItemQty > 0 ? (
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center border border-gray-200 rounded-lg w-full">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (cartItemQty === 1) {
                                                                    removeFromCart();
                                                                    toast.info(`${product.name} removed from cart`);
                                                                } else {
                                                                    decrementQty(e);
                                                                }
                                                            }}
                                                            className="w-12 h-12 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-l-lg"
                                                        >
                                                            {cartItemQty === 1 ? (
                                                                <Trash2 className="w-5 h-5 text-red-500" />
                                                            ) : (
                                                                <Minus className="w-5 h-5" />
                                                            )}
                                                        </button>
                                                        <span className="flex-1 text-center font-medium text-lg">{cartItemQty}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                incrementQty(e);
                                                            }}
                                                            className="w-12 h-12 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-r-lg"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsOpen(false)}
                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                                                    >
                                                        Continue Shopping
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={handleAddToCart}
                                                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium"
                                                    disabled={product.stock_status !== 'instock'}
                                                >
                                                    <ShoppingBag className="w-5 h-5" />
                                                    Add to Cart
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ProductModal;