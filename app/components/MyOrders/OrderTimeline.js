import { format, formatDistanceToNow } from 'date-fns';
import { Clock, Check, X, RefreshCw, Truck, Package } from 'lucide-react';

const ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    CONFIRMED: 'confirmed',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const OrderTimeline = ({ statusHistory }) => {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return format(date, 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return format(date, 'h:mm a');
        } catch {
            return '';
        }
    };

    // Get deduplicated and sorted status history
    const getOrderTimeline = () => {
        if (!statusHistory?.length) return [];

        // Create a map keyed by status to deduplicate entries
        const statusMap = new Map();

        // Populate map with the latest entry for each status
        statusHistory.forEach(status => {
            if (!statusMap.has(status.status) ||
                new Date(status.timestamp) > new Date(statusMap.get(status.status).timestamp)) {
                statusMap.set(status.status, status);
            }
        });

        // Convert map values to array and sort by timestamp
        return Array.from(statusMap.values())
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    };

    const timeline = getOrderTimeline();

    return (
        <div className="space-y-3">
            {timeline.map((status, index, timeline) => (
                <div key={`${status.status}-${status.timestamp}`} className="flex items-start relative">
                    {/* Vertical timeline connector */}
                    {index < timeline.length - 1 && (
                        <div className="absolute left-[0.7rem] top-6 bottom-0 w-0.5 bg-gray-200 h-8"></div>
                    )}

                    <div className={`rounded-full p-1.5 mt-0.5 mr-3 z-10 ${status.status === ORDER_STATUS.CANCELLED ? 'bg-red-100' :
                            status.status === ORDER_STATUS.CONFIRMED ||
                                status.status === ORDER_STATUS.COMPLETED ? 'bg-green-100' :
                                status.status === ORDER_STATUS.PROCESSING ? 'bg-blue-100' :
                                    status.status === ORDER_STATUS.SHIPPED ? 'bg-indigo-100' : 'bg-yellow-100'
                        }`}>
                        {status.status === ORDER_STATUS.CANCELLED ? (
                            <X className="h-3 w-3 text-red-600" />
                        ) : status.status === ORDER_STATUS.CONFIRMED ||
                            status.status === ORDER_STATUS.COMPLETED ? (
                            <Check className="h-3 w-3 text-green-600" />
                        ) : status.status === ORDER_STATUS.SHIPPED ? (
                            <Truck className="h-3 w-3 text-indigo-600" />
                        ) : status.status === ORDER_STATUS.PROCESSING ? (
                            <RefreshCw className="h-3 w-3 text-blue-600" />
                        ) : (
                            <Clock className="h-3 w-3 text-yellow-600" />
                        )}
                    </div>

                    <div>
                        <div className="flex items-baseline justify-between">
                            <p className="font-medium text-sm capitalize">
                                {status.status || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatTime(status.timestamp) || 'N/A'}
                            </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(status.timestamp) || 'N/A'}
                        </p>
                        {status.notes && (
                            <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">{status.notes}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OrderTimeline; 