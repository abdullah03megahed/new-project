import { useParams, useNavigate } from 'react-router';
import { mockHouses } from '../utils/mockData';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { MapPin, Bed, Bath, Home, Star, ArrowLeft, Phone, Mail } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel';

export const HouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const house = mockHouses.find((h) => h.id === id);

  if (!house) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[#34495E] mb-4">House not found</h2>
          <Button onClick={() => navigate('/houses')} className="bg-[#00A5A7] hover:bg-[#00A5A7]/90">
            Back to Houses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="bg-[#B19CD9]/5 border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/houses')}
            className="text-[#34495E] hover:text-[#00A5A7]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Houses
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Carousel */}
            <Carousel className="mb-8">
              <CarouselContent>
                {house.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`${house.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>

            {/* Title and Rating */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-[#34495E]">{house.title}</h1>
                {house.featured && (
                  <Badge className="bg-[#FFC759] text-[#34495E] border-0">Featured</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-[#FFC759] text-[#FFC759]" />
                  <span className="text-[#34495E]">{house.rating}</span>
                </div>
                <div className="flex items-center gap-2 text-[#717182]">
                  <MapPin className="w-5 h-5" />
                  <span>{house.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#FF6F61]" style={{ fontSize: '32px', fontWeight: '700' }}>
                  EGP {house.price.toLocaleString()}
                </span>
                <span className="text-[#717182]">/month</span>
              </div>
            </div>

            {/* Quick Info */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center p-4 bg-[#00A5A7]/5 rounded-lg">
                    <Bed className="w-6 h-6 text-[#00A5A7] mb-2" />
                    <span className="text-[#34495E]">{house.bedrooms} Bedrooms</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-[#00A5A7]/5 rounded-lg">
                    <Bath className="w-6 h-6 text-[#00A5A7] mb-2" />
                    <span className="text-[#34495E]">{house.bathrooms} Bathrooms</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-[#00A5A7]/5 rounded-lg">
                    <Home className="w-6 h-6 text-[#00A5A7] mb-2" />
                    <span className="text-[#34495E]">{house.size}m²</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-[#00A5A7]/5 rounded-lg">
                    <span className="text-[#00A5A7]" style={{ fontSize: '20px', fontWeight: '600' }}>
                      {house.floor}
                    </span>
                    <span className="text-[#34495E]">Floor</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-[#34495E] mb-4">Description</h3>
                <p className="text-[#717182]">{house.description}</p>
              </CardContent>
            </Card>

            {/* Landmarks */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-[#34495E] mb-4">Nearby Landmarks</h3>
                <div className="space-y-3">
                  {house.landmarks.map((landmark, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-[#B8E986]/10 rounded-lg"
                    >
                      <MapPin className="w-5 h-5 text-[#00A5A7]" />
                      <span className="text-[#34495E]">{landmark}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Contact Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-[#34495E] mb-4">Contact Landlord</h3>
                <div className="space-y-4">
                  <Button className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white h-12">
                    <Phone className="w-5 h-5 mr-2" />
                    Call Now
                  </Button>
                  <Button className="w-full bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white h-12">
                    <Mail className="w-5 h-5 mr-2" />
                    Send Message
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-[#34495E] mb-3">Property Details</h4>
                  <div className="space-y-2 text-[#717182]">
                    <div className="flex justify-between">
                      <span>Property ID:</span>
                      <span className="text-[#34495E]">#{house.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Area:</span>
                      <span className="text-[#34495E]">{house.area}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="text-[#34495E]">Apartment</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

