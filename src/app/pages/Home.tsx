import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, TrendingUp, Award, SlidersHorizontal } from 'lucide-react';
import { mockHouses } from '../utils/mockData';
import { HouseCard } from '../components/HouseCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';

// Make sure this file exists at src/assets/hero-image.png
// If you don't have it, replace with a URL string instead
import heroImage from "../../assets/cd6dd4e08337e596d3243a6d5cdac5811e60fa10.png";

export const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([1000, 5000]);
  const navigate = useNavigate();

  const recommendedHouses = mockHouses.filter((house) => house.featured && house.approved).slice(0, 6);
  const topHouses = [...mockHouses].filter(house => house.approved).sort((a, b) => b.rating - a.rating).slice(0, 10);

  const handleSearch = () => {
    navigate(`/houses?search=${searchQuery}&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative min-h-[700px] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.85,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#00A5A7]/70 to-[#34495E]/60 z-[1]" />
        <div className="container mx-auto px-4 relative z-10 w-full pt-24 pb-16">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h1 className="text-white" style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              Find Your Perfect Student Home
            </h1>
            <p className="text-white" style={{ fontSize: '18px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              Discover the best housing options near your university
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl p-6 md:p-8">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by area (e.g., Nasr City, Heliopolis, Dokki)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="hidden md:block">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-12 px-6 whitespace-nowrap">
                        <SlidersHorizontal className="w-5 h-5 mr-2" />
                        EGP {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[#34495E]">
                            Price Range: EGP {priceRange[0].toLocaleString()} - EGP {priceRange[1].toLocaleString()}
                          </Label>
                          <Slider min={1000} max={10000} step={100} value={priceRange} onValueChange={setPriceRange} className="w-full" />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="md:hidden">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-12">
                      <SlidersHorizontal className="w-5 h-5 mr-2" />
                      EGP {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[#34495E]">
                          Price Range: EGP {priceRange[0].toLocaleString()} - EGP {priceRange[1].toLocaleString()}
                        </Label>
                        <Slider min={1000} max={10000} step={100} value={priceRange} onValueChange={setPriceRange} className="w-full" />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Button onClick={handleSearch} className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white h-12 w-full">
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-8 h-8 text-[#FFC759]" />
          <h2 className="text-[#34495E]">Recommended Houses</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedHouses.map((house) => (
            <HouseCard key={house.id} house={house} />
          ))}
        </div>
      </div>

      <div className="bg-[#B19CD9]/5 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-[#00A5A7]" />
            <h2 className="text-[#34495E]">Top Rated Houses</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {topHouses.map((house) => (
              <HouseCard key={house.id} house={house} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#00A5A7] to-[#00A5A7]/80 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4">Ready to Find Your Perfect Home?</h2>
          <p className="mb-6" style={{ fontSize: '18px' }}>Browse through hundreds of verified listings</p>
          <Button onClick={() => navigate('/houses')} className="bg-[#FFC759] hover:bg-[#FFC759]/90 text-[#34495E] px-8 h-12">
            View All Houses
          </Button>
        </div>
      </div>
    </div>
  );
};

