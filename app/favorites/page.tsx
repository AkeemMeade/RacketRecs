export default function FavoritesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Your Favorites</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
            <div className="w-full h-40 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}