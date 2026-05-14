import { Link } from 'react-router';
import { MapPin, Bed, Bath, Star, Phone, MessageCircle } from 'lucide-react';
import { House } from '../utils/mockData';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface HouseCardProps {
  house: House;
}

export const HouseCard = ({ house }: HouseCardProps) => {
  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = 'tel:+201234567890';
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open('https://wa.me/201234567890', '_blank');
  };

  return (
    <Link to={`/house/${house.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
        {/* Upper Half - Photo */}
        <div className="relative h-64">
          <img
            src={house.coverImage}
            alt={house.title}
            className="w-full h-full object-cover"
          />
          {house.featured && (
            <Badge className="absolute top-2 right-2 bg-[#FFC759] text-[#34495E] border-0 text-xs">
              Featured
            </Badge>
          )}
          <div className="absolute bottom-2 left-2">
            <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-[#FFC759] text-[#FFC759]" />
              <span className="text-[#34495E] text-xs">{house.rating}</span>
            </div>
          </div>
        </div>

        {/* Bottom Half - Content */}
        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="text-[#34495E] mb-2">{house.title}</h3>
          
          <div className="flex items-center gap-2 text-[#717182] mb-2 text-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span>{house.location}</span>
          </div>

          <div className="flex items-center gap-3 mb-2 text-sm">
            <div className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-[#717182]" />
              <span className="text-[#34495E]">{house.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-[#717182]" />
              <span className="text-[#34495E]">{house.bathrooms}</span>
            </div>
            <span className="text-[#717182]">{house.size}m²</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[#FF6F61]" style={{ fontSize: '18px', fontWeight: '600' }}>
                EGP {house.price.toLocaleString()}
              </span>
              <span className="text-[#717182] text-sm">/month</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCall}
              className="flex-1 bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white h-8"
            >
              <Phone className="w-3.5 h-3.5 mr-1" />
              Call
            </Button>
            <Button
              size="sm"
              onClick={handleWhatsApp}
              className="flex-1 bg-[#25D366] hover:bg-[#25D366]/90 text-white h-8"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1" />
              WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
