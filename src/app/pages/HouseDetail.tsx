import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { MapPin, Bed, Home, ArrowLeft, Phone, Wifi, Users } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel';
import { toast } from 'sonner';

interface BedDto { id: number; bedNumber?: number; isBooked: boolean; }
interface Room {
  id: number; name: string; bedCount: number;
  pricePerBed: number; roomImages: string[]; beds: BedDto[];
}
interface Listing {
  id: number; title: string; description: string;
  address: string; street: string; city: string;
  furnished: boolean; wifiAvailable: boolean;
  numberOfRooms: number; genderPreference: number;
  status: number; publishedAt: string;
  landlordId: number; landlordName: string;
  listingImages: string[]; rooms: Room[];
  canViewContact: boolean;
  landlordPhoneNumber: string | null;
  exactAddress: string | null;
}

const GENDER_LABELS: Record<number, string> = { 1: 'Male Only', 2: 'Female Only' };

export const HouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await api.get<Listing>(`/Listing/${id}`);
        setListing(data);
      } catch {
        toast.error('Failed to load listing.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchListing();
  }, [id]);

  const handleBooking = async () => {
    if (!selectedBedId || !startDate || !endDate) {
      toast.error('Please select a bed and dates.');
      return;
    }
    setBookingLoading(true);
    try {
      await api.post('/Booking/CreateBooking', {
        bedId: selectedBedId,
        startDate,
        endDate,
      });
      toast.success('Booking created successfully!');
      const updated = await api.get<Listing>(`/Listing/${id}`);
      setListing(updated);
      setSelectedBedId(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed.';
      toast.error(message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A5A7]" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-[#34495E] mb-4">Listing not found</h2>
          <Button onClick={() => navigate('/houses')} className="bg-[#00A5A7] hover:bg-[#00A5A7]/90">
            Back to Houses
          </Button>
        </div>
      </div>
    );
  }

  const allImages = [
    ...listing.listingImages,
    ...listing.rooms.flatMap(r => r.roomImages),
  ];

  const availableBeds = listing.rooms.flatMap(room =>
    room.beds.filter(b => !b.isBooked).map(b => ({ ...b, roomName: room.name, pricePerBed: room.pricePerBed }))
  );

  const selectedBedPrice = listing.rooms
    .flatMap(r => r.beds.map(b => ({ ...b, price: r.pricePerBed })))
    .find(b => b.id === selectedBedId)?.price;

  return (
    <div className="min-h-screen bg-white">
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
          <div className="lg:col-span-2">
            {allImages.length > 0 ? (
              <Carousel className="mb-8">
                <CarouselContent>
                  {allImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-video rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`${listing.title} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            ) : (
              <div className="aspect-video rounded-lg bg-gray-100 mb-8 flex items-center justify-center">
                <Home className="w-16 h-16 text-gray-300" />
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                <h1 className="text-[#34495E]">{listing.title}</h1>
                <div className="flex gap-2">
                  {listing.furnished && <Badge className="bg-[#B8E986] text-[#34495E] border-0">Furnished</Badge>}
                  {listing.wifiAvailable && <Badge className="bg-[#00A5A7] text-white border-0">WiFi</Badge>}
                  {listing.genderPreference !== 0 && (
                    <Badge variant="outline">{GENDER_LABELS[listing.genderPreference]}</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#717182] mb-2">
                <MapPin className="w-5 h-5" />
                <span>{listing.address}, {listing.city}</span>
              </div>
              <p className="text-[#717182] text-sm">
                Listed by <span className="text-[#00A5A7]">{listing.landlordName}</span>
              </p>
            </div>

            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center p-4 bg-[#00A5A7]/5 rounded-lg">
                    <Home className="w-6 h-6 text-[#00A5A7] mb-2" />
                    <span className="text-[#34495E]">{listing.numberOfRooms} Rooms</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-[#00A5A7]/5 rounded-lg">
                    <Bed className="w-6 h-6 text-[#00A5A7] mb-2" />
                    <span className="text-[#34495E]">{availableBeds.length} Available Beds</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-[#00A5A7]/5 rounded-lg">
                    <Wifi className="w-6 h-6 text-[#00A5A7] mb-2" />
                    <span className="text-[#34495E]">{listing.wifiAvailable ? 'WiFi Yes' : 'No WiFi'}</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-[#00A5A7]/5 rounded-lg">
                    <Users className="w-6 h-6 text-[#00A5A7] mb-2" />
                    <span className="text-[#34495E]">
                      {listing.genderPreference === 0 ? 'Any Gender' : GENDER_LABELS[listing.genderPreference]}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-[#34495E] mb-4">Description</h3>
                <p className="text-[#717182]">{listing.description}</p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-[#34495E] mb-4">Rooms & Beds</h3>
                <div className="space-y-4">
                  {listing.rooms.map(room => (
                    <div key={room.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[#34495E]">{room.name}</h4>
                        <span className="text-[#FF6F61] font-semibold">
                          EGP {room.pricePerBed.toLocaleString()}/bed/month
                        </span>
                      </div>
                      {room.roomImages.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto">
                          {room.roomImages.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`${room.name} image ${i + 1}`}
                              className="h-20 w-32 object-cover rounded flex-shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                            />
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {room.beds.map(bed => (
                          <button
                            key={bed.id}
                            onClick={() => !bed.isBooked && user?.type === 'student' && setSelectedBedId(bed.id)}
                            disabled={bed.isBooked}
                            className={`
                              px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                              ${bed.isBooked
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                : selectedBedId === bed.id
                                  ? 'bg-[#00A5A7] border-[#00A5A7] text-white'
                                  : 'bg-white border-[#B8E986] text-[#34495E] hover:border-[#00A5A7] cursor-pointer'
                              }
                            `}
                          >
                            <Bed className="w-4 h-4 inline mr-1" />
                            Bed {(bed as any).bedNumber ?? bed.id} {bed.isBooked ? '(Booked)' : '(Available)'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                {listing.canViewContact ? (
                  <div className="space-y-3">
                    <h3 className="text-[#34495E] font-semibold">Landlord Contact</h3>
                    {listing.landlordPhoneNumber && (
                      <div className="flex items-center gap-2 p-3 bg-[#B8E986]/10 rounded-lg">
                        <Phone className="w-4 h-4 text-[#00A5A7]" />
                        <span className="text-[#34495E]">{listing.landlordPhoneNumber}</span>
                      </div>
                    )}
                    {listing.exactAddress && (
                      <div className="flex items-center gap-2 p-3 bg-[#B8E986]/10 rounded-lg">
                        <MapPin className="w-4 h-4 text-[#00A5A7]" />
                        <span className="text-[#34495E]">{listing.exactAddress}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-[#FFC759]/10 border border-[#FFC759]/30 rounded-lg text-sm text-[#717182]">
                    Complete a booking and payment to unlock landlord contact details.
                  </div>
                )}

                {user?.type === 'student' && (
                  <div className="space-y-3 border-t pt-4">
                    <h3 className="text-[#34495E] font-semibold">Book a Bed</h3>

                    {selectedBedId && (
                      <div className="p-2 bg-[#00A5A7]/10 rounded text-sm text-[#00A5A7]">
                        Selected: Bed #{selectedBedId}
                        {selectedBedPrice && ` — EGP ${selectedBedPrice.toLocaleString()}/month`}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <Button
                      onClick={handleBooking}
                      disabled={bookingLoading || !selectedBedId || !startDate || !endDate}
                      className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white h-12"
                    >
                      {bookingLoading ? 'Booking...' : 'Book Now'}
                    </Button>

                    {!selectedBedId && (
                      <p className="text-[#717182] text-xs text-center">
                        Select an available bed above to book
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="text-[#34495E] mb-3 font-medium">Property Details</h4>
                  <div className="space-y-2 text-sm text-[#717182]">
                    <div className="flex justify-between">
                      <span>Listing ID:</span>
                      <span className="text-[#34495E]">#{listing.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>City:</span>
                      <span className="text-[#34495E]">{listing.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Furnished:</span>
                      <span className="text-[#34495E]">{listing.furnished ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Published:</span>
                      <span className="text-[#34495E]">
                        {new Date(listing.publishedAt).toLocaleDateString()}
                      </span>
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
