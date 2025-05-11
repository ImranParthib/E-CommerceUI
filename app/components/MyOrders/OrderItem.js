import { Package } from 'lucide-react';

const OrderItem = ({ item }) => {
    return (
        <div className="p-3 flex items-center justify-between border-b border-gray-100 last:border-b-0">
            <div className="flex items-center gap-3">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    {item.images && item.images[0]?.src ? (
                        <img
                            src={item.images[0].src}
                            alt={item.name}
                            className="h-full w-full object-contain object-center"
                        />
                    ) : item.image ? (
                        <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-contain object-center"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-100">
                            <Package className="w-6 h-6 text-gray-300" />
                        </div>
                    )}
                </div>
                <div>
                    <p className="font-medium text-sm">{item.name || 'Unnamed Product'}</p>

                    {/* Display only selected attributes */}
                    {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                        <p className="text-xs text-blue-600">
                            {Object.entries(item.selectedAttributes).map(([key, value], i, arr) => (
                                <span key={key}>
                                    {key}: {value}{i < arr.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </p>
                    )}

                    <p className="text-xs text-gray-500">
                        {item.weight ? item.weight : `${item.quantity || 1} pcs`}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-medium text-sm">৳ {Number(item.price).toLocaleString('en-US')}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
            </div>
        </div>
    );
};

export default OrderItem; 