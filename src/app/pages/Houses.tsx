import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { mockHouses, House } from '../utils/mockData';
import { HouseCard } from '../components/HouseCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import { Search, SlidersHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';

export const Houses = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [priceRange, setPriceRange] = useState([
    parseInt(searchParams.get('minPrice') || '1000'),
    parseInt(searchParams.get('maxPrice') || '10000'),
  ]);
  const [filteredHouses, setFilteredHouses] = useState<House[]>([]);

  useEffect(() => {
    let filtered = mockHouses;

    filtered = filtered.filter(house => house.approved);

    if (searchQuery) {
      filtered = filtered.filter(
        (house) =>
          house.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
          house.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered = filtered.filter(
      (house) => house.price >= priceRange[0] && house.price <= priceRange[1]
    );

    setFilteredHouses(filtered);
  }, [searchQuery, priceRange]);

  return (
    <div className="min-h-screen bg-[#B19CD9]/5">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by area or location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12"
              />
            </div>
            <Button className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white h-12 px-6">
              <Search className="w-5 h-5 mr-2" />
              Search
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 md:hidden">
                  <SlidersHorizontal className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>Adjust your search preferences</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Price Range: EGP {priceRange[0].toLocaleString()} - EGP {priceRange[1].toLocaleString()}
                    </Label>
                    <Slider min={1000} max={10000} step={100} value={priceRange} onValueChange={setPriceRange} className="w-full" />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="mt-4 hidden md:block">
            <div className="space-y-2">
              <Label className="text-[#34495E]">
                Price Range: EGP {priceRange[0].toLocaleString()} - EGP {priceRange[1].toLocaleString()}
              </Label>
              <Slider min={1000} max={10000} step={100} value={priceRange} onValueChange={setPriceRange} className="w-full max-w-md" />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-[#717182]">
            Found <span className="text-[#00A5A7]">{filteredHouses.length}</span> properties
          </p>
        </div>

        {filteredHouses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredHouses.map((house) => (
              <HouseCard key={house.id} house={house} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[#717182]" style={{ fontSize: '18px' }}>
              No properties found matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

