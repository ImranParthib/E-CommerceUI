import React from 'react';
import { Transition } from '@headlessui/react';

const ProductImage = ({ product, isQuickView, setIsModalOpen }) => {
    return (
        <div className="relative w-full aspect-[3/2.3] mb-1 group cursor-pointer">
            <div className="absolute inset-0 bg-gray-50 rounded-lg">
                {product.images?.[0] ? (
                    <img
                        src={product.images[0].src}
                        alt={product.name}
                        className={`w-full h-full object-contain p-1 transition-transform duration-300 
              ${isQuickView ? 'scale-95' : 'scale-100'}`}
                    />
                ) : (
                    <img
                        src={product.image}
                        alt={product.name}
                        className={`w-full h-full object-contain p-1 transition-transform duration-300 
              ${isQuickView ? 'scale-95' : 'scale-100'}`}
                    />
                )}
            </div>

            {/* Quick View Button */}
            <Transition
                show={isQuickView}
                enter="transition-opacity duration-200"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <div className="absolute bottom-0 left-0 right-0 flex justify-center p-1">
                    <button
                        className="bg-white bg-opacity-90 text-gray-800 text-xs font-medium py-1 px-2 rounded-full shadow-sm hover:bg-opacity-100 transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsModalOpen(true);
                        }}
                    >
                        Quick View
                    </button>
                </div>
            </Transition>

            {/* Combo Pack Badge */}
            {product.isCombo && (
                <div className="absolute top-1/2 left-0 right-0 flex items-center justify-center">
                    <div className="bg-gradient-to-r from-transparent via-red-500 to-transparent w-full h-0.5" />
                    <div className="absolute bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium transform -translate-y-1/2">
                        Combo Pack
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductImage;
