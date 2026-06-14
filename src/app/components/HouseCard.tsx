import type { MouseEvent } from 'react';
import { Link } from 'react-router';
import { MapPin, Bed, Bath, Star, Phone, MessageCircle } from 'lucide-react';
import { House } from '../utils/mockData';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ListingCard {
  id: number;
  title: string;
  address: string;
  city: string;
  furnished: boolean;
  listingImages: string[];
  numberOfRooms: number;
  rooms: {
    pricePerBed: number;
    beds: { isBooked: boolean }[];
  }[];
  landlordPhoneNumber: string | null;
  pricePerMonth?: number;
}

type HouseCardProps =
  | { house: House; listing?: never }
  | { house?: never; listing: ListingCard };

const IMAGE_BASE = 'https://unimate.runasp.net/';

const listingImageUrl = (image?: string) => {
  if (!image) return '/placeholder.jpg';
  return image.startsWith('http') ? image : `${IMAGE_BASE}${image}`;
};

export const HouseCard = ({ house, listing }: HouseCardProps) => {
  const availableBeds = listing
    ? listing.rooms.flatMap((room) => room.beds).filter((bed) => !bed.isBooked).length
    : 0;

  const lowestPrice = listing
    ? listing.pricePerMonth ??
      listing.rooms.reduce((min, room) => Math.min(min, room.pricePerBed), Infinity)
    : 0;

  const card = house
    ? {
        id: house.id,
        title: house.title,
        price: house.price,
        location: house.location,
        coverImage: house.coverImage,
        badge: house.featured ? 'Featured' : null,
        rating: house.rating,
        firstMetric: String(house.bedrooms),
        secondMetric: String(house.bathrooms),
        thirdMetric: `${house.size}m2`,
        phoneNumber: '+201234567890',
      }
    : {
        id: listing.id,
        title: listing.title,
        price: Number.isFinite(lowestPrice) ? lowestPrice : 0,
        location: `${listing.address}, ${listing.city}`,
        coverImage: listingImageUrl(listing.listingImages[0]),
        badge: listing.furnished ? 'Furnished' : null,
        rating: null,
        firstMetric: `${listing.numberOfRooms} rooms`,
        secondMetric: `${availableBeds} beds`,
        thirdMetric: listing.city,
        phoneNumber: listing.landlordPhoneNumber,
      };

  const handleCall = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!card.phoneNumber) return;
    window.location.href = `tel:${card.phoneNumber}`;
  };

  const handleWhatsApp = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!card.phoneNumber) return;
    const phone = card.phoneNumber.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  return (
    <Link to={`/house/${card.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
        <div className="relative h-64">
          <img
            src={card.coverImage}
            alt={card.title}
            className="w-full h-full object-cover"
          />
          {card.badge && (
            <Badge className="absolute top-2 right-2 bg-[#FFC759] text-[#34495E] border-0 text-xs">
              {card.badge}
            </Badge>
          )}
          {card.rating !== null && (
            <div className="absolute bottom-2 left-2">
              <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-[#FFC759] text-[#FFC759]" />
                <span className="text-[#34495E] text-xs">{card.rating}</span>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="text-[#34495E] mb-2">{card.title}</h3>

          <div className="flex items-center gap-2 text-[#717182] mb-2 text-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span>{card.location}</span>
          </div>

          <div className="flex items-center gap-3 mb-2 text-sm">
            <div className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-[#717182]" />
              <span className="text-[#34495E]">{card.firstMetric}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-[#717182]" />
              <span className="text-[#34495E]">{card.secondMetric}</span>
            </div>
            <span className="text-[#717182]">{card.thirdMetric}</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[#FF6F61]" style={{ fontSize: '18px', fontWeight: '600' }}>
                EGP {card.price.toLocaleString()}
              </span>
              <span className="text-[#717182] text-sm">/month</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCall}
              disabled={!card.phoneNumber}
              className="flex-1 bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white h-8"
            >
              <Phone className="w-3.5 h-3.5 mr-1" />
              Call
            </Button>
            <Button
              size="sm"
              onClick={handleWhatsApp}
              disabled={!card.phoneNumber}
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
