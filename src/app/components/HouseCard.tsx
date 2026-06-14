// Regular listings grid:
{listings.map((listing) => (
  <HouseCard key={listing.id} listing={{ ...listing, sortingOption }} />
))}

// Matched listings grid:
{matchedListings.map((listing) => (
  <div key={listing.id} className="relative">
    <HouseCard listing={{ ...listing, sortingOption }} />
    <div className="absolute top-3 right-3 z-10 bg-[#00A5A7] text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
      {listing.overallScore}% · {listing.compatibilityLabel}
    </div>
  </div>
))}
