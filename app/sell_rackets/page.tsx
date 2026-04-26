"use client";

import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Outfit } from "next/font/google";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/UserContext";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

type ListingStatus = "Available" | "Pending" | "Sold";

type Listing = {
  id: string;
  seller_id: string | null;
  seller_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  racket_name: string;
  brand: string;
  condition: string;
  price: number;
  description: string | null;
  image_url: string | null;
  location: string | null;
  string_setup: string | null;
  weight: string | null;
  grip_size: string | null;
  status: ListingStatus;
  created_at: string;
};

type ListingForm = {
  racket_name: string;
  brand: string;
  condition: string;
  status: ListingStatus;
  price: string;
  description: string;
  image_url: string;
  seller_name: string;
  contact_email: string;
  contact_phone: string;
  location: string;
  string_setup: string;
  weight: string;
  grip_size: string;
};

const conditionOptions = ["Like New", "Good", "Fair", "Heavily Used"];
const statusOptions: Array<ListingStatus | "All"> = ["All", "Available", "Pending", "Sold"];
const sortOptions = ["Newest", "Price: Low to High", "Price: High to Low"];

const initialForm: ListingForm = {
  racket_name: "",
  brand: "",
  condition: "Good",
  status: "Available",
  price: "",
  description: "",
  image_url: "",
  seller_name: "",
  contact_email: "",
  contact_phone: "",
  location: "",
  string_setup: "",
  weight: "",
  grip_size: "",
};

export default function SellRacketsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { user, loading: loadingUser } = useUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "All">("All");
  const [sortBy, setSortBy] = useState(sortOptions[0]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [form, setForm] = useState<ListingForm>(initialForm);
  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydrationSnapshot
  );

  const fetchListings = useCallback(async () => {
    setLoadingListings(true);
    setError("");

    const { data, error: listingsError } = await supabase
      .from("marketplace_listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (listingsError) {
      setError("Marketplace listings could not be loaded. Create the Supabase table to enable live listings.");
      setListings([]);
    } else {
      setListings((data ?? []) as Listing[]);
    }

    setLoadingListings(false);
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchListings();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchListings]);

  const filteredListings = useMemo(() => {
    const term = search.toLowerCase().trim();

    return listings
      .filter((listing) => {
        const matchesSearch =
          !term ||
          listing.racket_name.toLowerCase().includes(term) ||
          listing.brand.toLowerCase().includes(term) ||
          listing.condition.toLowerCase().includes(term) ||
          (listing.location ?? "").toLowerCase().includes(term);
        const matchesCondition = conditionFilter === "All" || listing.condition === conditionFilter;
        const matchesStatus = statusFilter === "All" || listing.status === statusFilter;

        return matchesSearch && matchesCondition && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "Price: Low to High") return a.price - b.price;
        if (sortBy === "Price: High to Low") return b.price - a.price;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [conditionFilter, listings, search, sortBy, statusFilter]);

  const marketplaceStats = useMemo(() => {
    const available = listings.filter((listing) => listing.status === "Available").length;
    const averagePrice =
      listings.length === 0
        ? 0
        : Math.round(listings.reduce((sum, listing) => sum + Number(listing.price), 0) / listings.length);
    const myListings = user ? listings.filter((listing) => listing.seller_id === user.id).length : 0;

    return { available, averagePrice, myListings };
  }, [listings, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setNotice("");
    setError("");
    setEditingListing(null);
    setForm(initialForm);
    setShowCreateModal(true);
  };

  const openEditModal = (listing: Listing) => {
    setNotice("");
    setError("");
    setSelectedListing(null);
    setEditingListing(listing);
    setForm({
      racket_name: listing.racket_name,
      brand: listing.brand,
      condition: listing.condition,
      status: listing.status,
      price: String(listing.price),
      description: listing.description ?? "",
      image_url: listing.image_url ?? "",
      seller_name: listing.seller_name,
      contact_email: listing.contact_email ?? "",
      contact_phone: listing.contact_phone ?? "",
      location: listing.location ?? "",
      string_setup: listing.string_setup ?? "",
      weight: listing.weight ?? "",
      grip_size: listing.grip_size ?? "",
    });
    setShowCreateModal(true);
  };

  const closeListingModal = () => {
    setShowCreateModal(false);
    setEditingListing(null);
    setForm(initialForm);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("");
    setError("");

    if (!user) {
      setError("Sign in before posting a racket listing.");
      return;
    }

    if (!form.racket_name.trim() || !form.brand.trim() || !form.price.trim()) {
      setError("Add a racket name, brand, and price before posting.");
      return;
    }

    setSaving(true);

    const listingPayload = {
      seller_name: form.seller_name.trim() || user.email?.split("@")[0] || "RacketRecs user",
      contact_email: form.contact_email.trim() || user.email || null,
      contact_phone: form.contact_phone.trim() || null,
      racket_name: form.racket_name.trim(),
      brand: form.brand.trim(),
      condition: form.condition,
      price: Number(form.price),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      location: form.location.trim() || null,
      string_setup: form.string_setup.trim() || null,
      weight: form.weight.trim() || null,
      grip_size: form.grip_size.trim() || null,
      status: form.status,
    };

    if (editingListing) {
      const { data, error: updateError } = await supabase
        .from("marketplace_listings")
        .update(listingPayload)
        .eq("id", editingListing.id)
        .eq("seller_id", user.id)
        .select()
        .single();

      if (updateError) {
        setError("Listing could not be updated. Check the update RLS policy.");
      } else {
        setListings((prev) =>
          prev.map((listing) => (listing.id === editingListing.id ? (data as Listing) : listing))
        );
        setNotice("Listing updated.");
        closeListingModal();
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("marketplace_listings")
        .insert({
          seller_id: user.id,
          ...listingPayload,
          status: "Available",
        })
        .select()
        .single();

      if (insertError) {
        setError("Listing could not be posted. Check the Supabase table and RLS policy.");
      } else {
        setListings((prev) => [data as Listing, ...prev]);
        setForm({ ...initialForm, seller_name: form.seller_name });
        setNotice("Listing posted to the community marketplace.");
        setShowCreateModal(false);
      }
    }

    setSaving(false);
  };

  const toggleSaved = (id: string) => {
    setSavedListingIds((prev) =>
      prev.includes(id) ? prev.filter((listingId) => listingId !== id) : [...prev, id]
    );
  };

  const markAsSold = async (listing: Listing) => {
    setNotice("");
    setError("");

    const { data, error: updateError } = await supabase
      .from("marketplace_listings")
      .update({ status: "Sold" })
      .eq("id", listing.id)
      .eq("seller_id", user?.id)
      .select()
      .single();

    if (updateError) {
      setError("Could not mark this listing as sold.");
      return;
    }

    setListings((prev) => prev.map((item) => (item.id === listing.id ? (data as Listing) : item)));
    setNotice("Listing marked as sold.");
  };

  const deleteListing = async (listing: Listing) => {
    if (!user || listing.seller_id !== user.id) return;

    const confirmed = window.confirm(`Remove "${listing.racket_name}" from the marketplace?`);
    if (!confirmed) return;

    setNotice("");
    setError("");
    setDeletingListingId(listing.id);

    const { error: deleteError } = await supabase
      .from("marketplace_listings")
      .delete()
      .eq("id", listing.id)
      .eq("seller_id", user.id);

    if (deleteError) {
      setError("Could not remove this listing. Check the delete RLS policy.");
    } else {
      setListings((prev) => prev.filter((item) => item.id !== listing.id));
      setSavedListingIds((prev) => prev.filter((listingId) => listingId !== listing.id));
      setSelectedListing((prev) => (prev?.id === listing.id ? null : prev));
      setNotice("Listing removed.");
    }

    setDeletingListingId(null);
  };

  const formatPostedTime = (timestamp: string) => {
    const date = new Date(timestamp);

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isAuthReady = hasHydrated && !loadingUser;
  const isLoading = !isAuthReady || loadingListings;

  return (
    <main className={`${outfit.className} min-h-screen`}>
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200" />

      <div className="-mt-5 mx-auto max-w-[1250px] px-4 py-12">
        <div className="rounded-2xl bg-white/70 p-8 shadow-xl backdrop-blur-sm sm:p-12">
          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Community Listings</h1>
              <p className="mt-2 text-sm text-gray-600">
                Browse used rackets from other players or post one of your own.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={!isAuthReady || !user}
              className="rounded-full bg-[#FFC038] px-6 py-3 text-sm font-bold text-slate-900 transition hover:cursor-pointer hover:bg-[#FFB800] hover:outline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!isAuthReady ? "Checking account..." : user ? "Create Listing" : "Sign in to Sell"}
            </button>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Available listings" value={marketplaceStats.available.toString()} />
            <Stat label="Average price" value={`$${marketplaceStats.averagePrice}`} />
            <Stat label="My listings" value={marketplaceStats.myListings.toString()} />
          </div>

          <div className="mb-8 grid gap-3 lg:grid-cols-[1fr_150px_140px_180px_auto]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by model, brand, condition, or location..."
              className="block w-full rounded-full border border-gray-300 bg-white px-5 py-3 text-sm text-gray-900 placeholder-gray-500 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <FilterSelect value={conditionFilter} onChange={setConditionFilter} options={["All", ...conditionOptions]} />
            <FilterSelect value={statusFilter} onChange={(value) => setStatusFilter(value as ListingStatus | "All")} options={statusOptions} />
            <FilterSelect value={sortBy} onChange={setSortBy} options={sortOptions} />
            <button
              type="button"
              onClick={fetchListings}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>

          {notice && (
            <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
              {notice}
            </div>
          )}

          {isLoading ? (
            <div className="py-20 text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
              <p className="mt-4 text-gray-600">Loading marketplace listings...</p>
            </div>
          ) : error && listings.length === 0 ? (
            <EmptyState message={error} />
          ) : filteredListings.length === 0 ? (
            <EmptyState message="No marketplace listings yet. Be the first to post one." />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => {
                const isMine = user?.id === listing.seller_id;
                const isSaved = savedListingIds.includes(listing.id);

                return (
                  <article
                    key={listing.id}
                    className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:border-blue-400 hover:shadow-xl"
                  >
                    {isMine && (
                      <div className="absolute right-3 top-3 z-10 flex gap-2">
                        {listing.status !== "Sold" && (
                          <button
                            type="button"
                            onClick={() => markAsSold(listing)}
                            className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-100"
                          >
                            Sold
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(listing)}
                          className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteListing(listing)}
                          disabled={deletingListingId === listing.id}
                          className="rounded-full bg-red-50/95 px-3 py-1 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingListingId === listing.id ? "..." : "Remove"}
                        </button>
                      </div>
                    )}

                    <div className="relative h-48 bg-white">
                      {listing.image_url ? (
                        // User-submitted marketplace photos can come from arbitrary hosts.
                        // A plain image avoids next/image remote host crashes for valid pasted URLs.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.image_url}
                          alt={listing.racket_name}
                          className="h-full w-full object-contain p-5"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">{listing.brand}</p>
                          <h3 className="mt-1 line-clamp-2 text-lg font-bold text-gray-900">
                            {listing.racket_name}
                          </h3>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                          ${listing.price}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500">
                        {listing.location || "Local pickup"} - Posted {formatPostedTime(listing.created_at)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                        <span className="rounded-full bg-slate-100 px-3 py-1">{listing.status}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">{listing.condition}</span>
                        {listing.weight && <span className="rounded-full bg-slate-100 px-3 py-1">{listing.weight}</span>}
                        {listing.grip_size && <span className="rounded-full bg-slate-100 px-3 py-1">{listing.grip_size}</span>}
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                        {listing.description || "No description provided."}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedListing(listing)}
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          View Details
                        </button>
                        {!isMine && (
                          <button
                            type="button"
                            onClick={() => toggleSaved(listing.id)}
                            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                          >
                            {isSaved ? "Saved" : "Save"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {editingListing ? "Edit Listing" : "Create Listing"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {editingListing
                    ? "Update your marketplace listing details."
                    : "Post a racket for the RacketRecs community."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeListingModal}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Racket Name" name="racket_name" value={form.racket_name} onChange={handleChange} placeholder="Astrox 100ZZ" />
                <Field label="Brand" name="brand" value={form.brand} onChange={handleChange} placeholder="Yonex" />
                <SelectField label="Condition" name="condition" value={form.condition} onChange={handleChange} options={conditionOptions} />
                {editingListing && (
                  <SelectField label="Status" name="status" value={form.status} onChange={handleChange} options={statusOptions.filter((option) => option !== "All")} />
                )}
                <Field label="Price ($)" name="price" type="number" min="1" value={form.price} onChange={handleChange} placeholder="120" />
                <Field label="Seller Name" name="seller_name" value={form.seller_name} onChange={handleChange} placeholder="Your name" />
                <Field label="Contact Email" name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="you@example.com" />
                <Field label="Contact Phone" name="contact_phone" value={form.contact_phone} onChange={handleChange} placeholder="Optional phone number" />
                <Field label="Location" name="location" value={form.location} onChange={handleChange} placeholder="Long Beach, CA" />
                <Field label="Image URL" name="image_url" value={form.image_url} onChange={handleChange} placeholder="Optional photo link" />
                <Field label="String Setup" name="string_setup" value={form.string_setup} onChange={handleChange} placeholder="BG80 at 26 lbs" />
                <Field label="Weight" name="weight" value={form.weight} onChange={handleChange} placeholder="4U" />
                <Field label="Grip" name="grip_size" value={form.grip_size} onChange={handleChange} placeholder="G5" />
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Condition notes, chips, string tension, pickup details."
                  className="mt-2 w-full resize-none rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-900 ring-1 ring-slate-100 transition focus:bg-white focus:outline-none focus:ring-blue-400"
                />
              </label>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!user || saving}
                className="w-full rounded-full bg-[#FFC038] px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-[#FFB800] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? editingListing
                    ? "Saving..."
                    : "Posting..."
                  : editingListing
                    ? "Save Changes"
                    : user
                      ? "Post Listing"
                      : "Sign in to Post"}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-slate-950 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase text-blue-600">{selectedListing.brand}</p>
                <h2 className="text-2xl font-extrabold">{selectedListing.racket_name}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Posted by {selectedListing.seller_name} on {formatPostedTime(selectedListing.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedListing(null)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-100">
              <Detail label="Price" value={`$${selectedListing.price}`} />
              <Detail label="Status" value={selectedListing.status} />
              <Detail label="Condition" value={selectedListing.condition} />
              <Detail label="String Setup" value={selectedListing.string_setup || "Not listed"} />
              <Detail label="Pickup Area" value={selectedListing.location || "Local pickup"} />
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {selectedListing.description || "No description provided."}
            </p>

            {user?.id === selectedListing.seller_id ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedListing)}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-900 hover:bg-slate-200"
                >
                  Edit Listing
                </button>
                <button
                  type="button"
                  onClick={() => deleteListing(selectedListing)}
                  disabled={deletingListingId === selectedListing.id}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingListingId === selectedListing.id ? "Removing..." : "Remove Listing"}
                </button>
              </div>
            ) : (
              <>
                <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm ring-1 ring-amber-100">
                  <p className="font-bold text-slate-900">Seller Contact</p>
                  <div className="mt-2 space-y-1 text-slate-700">
                    <p>Email: {selectedListing.contact_email || "Not provided"}</p>
                    <p>Phone: {selectedListing.contact_phone || "Not provided"}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <a
                    href={
                      selectedListing.contact_email
                        ? `mailto:${selectedListing.contact_email}?subject=RacketRecs listing: ${encodeURIComponent(
                            selectedListing.racket_name
                          )}`
                        : undefined
                    }
                    className={`inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
                      selectedListing.contact_email
                        ? "bg-amber-400 text-slate-900 hover:bg-amber-300"
                        : "pointer-events-none bg-slate-100 text-slate-400"
                    }`}
                  >
                    Email Seller
                  </a>
                  <button
                    type="button"
                    onClick={() => toggleSaved(selectedListing.id)}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {savedListingIds.includes(selectedListing.id) ? "Saved" : "Save Listing"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  min?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        min={min}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-900 ring-1 ring-slate-100 transition focus:bg-white focus:outline-none focus:ring-blue-400"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-900 ring-1 ring-slate-100 transition focus:bg-white focus:outline-none focus:ring-blue-400"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-white px-4 py-12 text-center shadow-sm ring-1 ring-slate-100">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-900">{value}</span>
    </div>
  );
}
