export default function ProfilePage() {
  return (
    <div className="mt-10 w-[1650px] mx-auto px-4 py-12">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-12">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">My Profile</h1>
        </div>

        <p className="text-gray-600 mb-6">
        </p>

        <div className="bg-gray-100 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Personal Information
          </h2>
          <p className="text-gray-600 mb-2">
            Name:
          </p>
          <p className="text-gray-600 mb-2">
            Email:
          </p>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800">My Rackets</h2>
      </div>
    </div>
  );
}
