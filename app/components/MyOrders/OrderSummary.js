const OrderSummary = ({ order }) => {
    const formatPrice = (price) => {
        if (price === undefined || price === null) return '0';
        return Number(price).toLocaleString('en-US');
    };

    const calculateTotalPrice = () => {
        const subtotal = order.total || 0;
        const deliveryFee = order.deliveryFee || 0;
        const discount = order.discount || 0;
        return subtotal + deliveryFee - discount;
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm">৳{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Delivery Fee</span>
                    <span className="text-sm">৳{formatPrice(order.deliveryFee)}</span>
                </div>
                {order.discount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-sm text-green-600">Discount</span>
                        <span className="text-sm text-green-600">-৳{formatPrice(order.discount)}</span>
                    </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-100 font-bold">
                    <span className="text-gray-800">Total</span>
                    <span className="text-gray-800">৳{formatPrice(calculateTotalPrice())}</span>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary; 