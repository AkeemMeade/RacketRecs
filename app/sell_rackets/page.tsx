"use client";

import { useMemo, useState } from "react";

type Listing = {
  id: number;
  racketName: string;
  brand: string;
  condition: string;
  price: string;
  description: string;
  imageUrl?: string;
};

const mockListings: Listing[] = [
  {
    id: 1,
    racketName: "Astrox 88D Pro",
    brand: "Yonex",
    condition: "Good",
    price: "140",
    description: "Minor paint chips, still in great playing condition.",
    imageUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    racketName: "Nanoflare 700",
    brand: "Yonex",
    condition: "Like New",
    price: "155",
    description: "Barely used. Selling because it doesn't fit my playstyle.",
    imageUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function SellRacketsPage() {
  const [form, setForm] = useState({
    racketName: "",
    brand: "",
    condition: "Good",
    price: "",
    description: "",
    imageUrl: "",
  });

  const [listings, setListings] = useState<Listing[]>(mockListings);
  const [search, setSearch] = useState("");

  const filteredListings = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return listings;

    return listings.filter(
      (listing) =>
        listing.racketName.toLowerCase().includes(term) ||
        listing.brand.toLowerCase().includes(term) ||
        listing.condition.toLowerCase().includes(term)
    );
  }, [listings, search]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.racketName || !form.brand || !form.price) return;

    const newListing: Listing = {
      id: Date.now(),
      racketName: form.racketName,
      brand: form.brand,
      condition: form.condition,
      price: form.price,
      description: form.description,
      imageUrl: form.imageUrl,
    };

    setListings((prev) => [newListing, ...prev]);

    setForm({
      racketName: "",
      brand: "",
      condition: "Good",
      price: "",
      description: "",
      imageUrl: "",
    });
  };

  return (
    <main className="min-h-screen px-6 py-10 text-slate-900 relative">
     <div className="fixed inset-0 -z-10 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-10 w-1 rounded-full bg-amber-400" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sell Your Racket</h1>
              <p className="mt-1 text-sm text-slate-600">
                List your used badminton racket for other users to browse.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
            >
              <h2 className="mb-4 text-xl font-semibold">Create Listing</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Racket Name
                  </label>
                  <input
                    type="text"
                    name="racketName"
                    value={form.racketName}
                    onChange={handleChange}
                    placeholder="e.g. Astrox 100ZZ"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="e.g. Yonex"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={form.condition}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-400"
                  >
                    <option>Like New</option>
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Heavily Used</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="120"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Image URL
                  </label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleChange}
                    placeholder="Optional image link"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Describe the racket's condition, string setup, chips, scratches, etc."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-sky-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 inline-flex items-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Post Listing
              </button>
            </form>

            {/* Quick info */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-xl font-semibold">Marketplace Preview</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  For now this page is frontend-only. Users can fill out the form and
                  see mock listings appear instantly on the page.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-semibold">Future ideas</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>• Save listings to Supabase</li>
                  <li>• Link listings to logged-in users</li>
                  <li>• Add image upload support</li>
                  <li>• Add “Message Seller” or “Mark as Sold” buttons</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Used Racket Listings</h2>
              <p className="mt-1 text-sm text-slate-600">
                Browse community listings for used badminton rackets.
              </p>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-400 sm:max-w-xs"
            />
          </div>

          {filteredListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
              No listings found.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => (
                <article
                  key={listing.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="h-48 w-full bg-slate-100">
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt={listing.racketName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        No image provided
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                          {listing.brand}
                        </p>
                        <h3 className="text-lg font-bold text-slate-900">
                          {listing.racketName}
                        </h3>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                        ${listing.price}
                      </span>
                    </div>

                    <p className="mb-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      Condition: {listing.condition}
                    </p>

                    <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                      {listing.description || "No description provided."}
                    </p>

                    <div className="mt-5 flex gap-3">
                      <button className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
                        View Listing
                      </button>
                      <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        Contact Seller
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}