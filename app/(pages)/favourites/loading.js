export default function FavouritesLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center pt-20">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
                <p className="text-gray-600">Loading your favorites...</p>
            </div>
        </div>
    );
}
