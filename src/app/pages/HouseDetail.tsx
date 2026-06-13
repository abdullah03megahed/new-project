import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '../components/ui/dialog';
import {
  MapPin, Bed, Home, ArrowLeft, Phone, Wifi, Users,
  X, ChevronLeft, ChevronRight, ZoomIn, Flag,
} from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel';
import { toast } from 'sonner';
import { PaymentModal } from '../components/PaymentModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BedDto { id: number; bedNumber?: number; isBooked: boolean; }
interface Room {
  id: number; name: string; bedCount: number;
  pricePerBed: number; roomImages: string[]; beds: BedDto[];
}
interface BookingInfo {
  id: number; studentId: number; studentName: string;
  startDate: string; endDate: string; bedId: number; listingId: number;
  status: number; amount: number;
}
interface Listing {
  id: number; title: string; description: string;
  address: string; street: string; city: string;
  furnished: boolean; wifiAvailable: boolean;
  numberOfRooms: number; genderPreference: number;
  status: number; publishedAt: string;
  landlordId: number;
  landlordName?: string;
  landlord?: { firstName?: string; lastName?: string; name?: string; accountId?: string; };
  listingImages: string[]; rooms: Room[];
  canViewContact: boolean;
  landlordPhoneNumber: string | null;
  exactAddress: string | null;
}

const IMAGE_BASE = 'https://unimate.runasp.net/';
const GENDER_LABELS: Record<number, string> = { 1: 'Male Only', 2: 'Female Only' };

const prefixImage = (img: string) => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  return `${IMAGE_BASE}${img.startsWith('/') ? img.slice(1) : img}`;
};

const getLandlordName = (listing: Listing): string => {
  if (listing.landlordName?.trim()) return listing.landlordName;
  if (listing.landlord?.name) return listing.landlord.name;
  if (listing.landlord?.firstName || listing.landlord?.lastName)
    return `${listing.landlord.firstName ?? ''} ${listing.landlord.lastName ?? ''}`.trim();
  return '';
};

// ─── Report Modal ─────────────────────────────────────────────────────────────

interface ReportModalProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  onSubmit: (reason: string) => Promise<void>;
}

const ReportModal = ({ trigger, title, description, onSubmit }: ReportModalProps) => {
  const [open, setOpen]       = useState(false);
  const [reason, setReason]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onSubmit(reason.trim());
      toast.success('Report submitted. Our team will review it.');
      setReason('');
      setOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#34495E]">{title}</DialogTitle>
          <DialogDescription className="text-[#717182]">{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-[#34495E]">Reason</Label>
            <Textarea
              id="reason" value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue..." rows={4} required
              className="border-[#00A5A7]/20 focus:border-[#00A5A7] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-[#717182]">{reason.length}/500 characters</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !reason.trim()}
              className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white">
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps { images: string[]; initialIndex: number; onClose: () => void; }

const Lightbox = ({ images, initialIndex, onClose }: LightboxProps) => {
  const [current, setCurrent] = useState(initialIndex);
  const prev = useCallback(() => setCurrent(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(10,15,30,0.95)' }} onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
        <X className="w-5 h-5 text-white" />
      </button>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
        {current + 1} / {images.length}
      </div>
      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      <div className="max-w-5xl max-h-[85vh] w-full mx-16 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}>
        <img src={prefixImage(images[current])} alt={`Image ${current + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
      </div>
      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-lg px-2">
          {images.map((img, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`flex-shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-all ${
                i === current ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-75'}`}>
              <img src={prefixImage(img)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const HouseDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing]               = useState<Listing | null>(null);
  const [loading, setLoading]               = useState(true);
  const [selectedBedId, setSelectedBedId]   = useState<number | null>(null);
  const [bookingMode, setBookingMode]       = useState<'bed' | 'room'>('bed');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [durationMonths, setDurationMonths] = useState<number | ''>(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [paymentOpen, setPaymentOpen]           = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null);
  const [pendingAmount, setPendingAmount]       = useState<number | undefined>(undefined);
  const [paymentDone, setPaymentDone]           = useState(false);

  const [bookedStudents, setBookedStudents] = useState<BookingInfo[]>([]);

  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex]   = useState(0);
  const [lightboxOpen, setLightboxOpen]     = useState(false);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Fetch listing
  useEffect(() => {
    if (!id) return;
    api.get<Listing>(`/Listing/${id}`)
      .then(data => setListing(data))
      .catch(() => toast.error('Failed to load listing.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Landlord: fetch booked students
  useEffect(() => {
    if (!user || user.type !== 'landlord' || !id || !user.id) return;
    api.get<any>(`/Booking/GetLandLordBookings/${user.id}?PageIndex=1&PageSize=100`)
      .then(async data => {
        const listingBookings = (data.data || []).filter(
          (b: any) => String(b.listingId) === String(id)
        );
        if (!listingBookings.length) return;
        const detailed = await Promise.all(
          listingBookings.map((b: any) =>
            api.get<BookingInfo>(`/Booking/GetBooking/${b.id}`).catch(() => null)
          )
        );
        setBookedStudents(detailed.filter(Boolean) as BookingInfo[]);
      })
      .catch(() => { /* silently fail */ });
  }, [user, id]);

  // ─── Handle Booking ────────────────────────────────────────────────────────
  const handleBooking = async () => {
    if (bookingMode === 'bed') {
      if (!selectedBedId) { toast.error('Please select a bed.'); return; }
    } else {
      if (!selectedRoomId) { toast.error('Please select a room.'); return; }
    }

    if (!durationMonths || Number(durationMonths) < 1) {
      toast.error('Please enter a valid duration (minimum 1 month).');
      return;
    }

    setBookingLoading(true);
    try {
      if (bookingMode === 'bed') {
        // ── Single bed booking ─────────────────────────────────────────────
        const res = await api.post<any>('/Booking/CreateBooking', {
          bedId: selectedBedId,
          durationInMonths: Number(durationMonths),
          type: 1,
        });

        const bookingId =
          typeof res === 'number' ? res : res?.id ?? res?.bookingId ?? null;

        if (!bookingId) {
          toast.error('Booking created but no ID returned. Please contact support.');
          return;
        }

        const totalPrice = listing?.rooms
          .flatMap(r => r.beds.map(b => ({ id: b.id, price: r.pricePerBed })))
          .find(b => b.id === selectedBedId)?.price;

        setPendingBookingId(bookingId);
        setPendingAmount(totalPrice);
        setPaymentOpen(true);

      } else {
        // ── Whole room booking — single POST ──────────────────────────────
        const room = listing?.rooms.find(r => r.id === selectedRoomId);
        if (!room) { toast.error('Room not found.'); return; }

        const availableRoomBeds = room.beds.filter(b => !b.isBooked);
        if (availableRoomBeds.length === 0) {
          toast.error('No available beds in this room.');
          return;
        }

        const res = await api.post<any>('/Booking/CreateBooking', {
          roomId: selectedRoomId,
          durationInMonths: Number(durationMonths),
          type: 2,
        });

        const bookingId =
          typeof res === 'number' ? res : res?.id ?? res?.bookingId ?? null;

        if (!bookingId) {
          toast.error('Booking created but no ID returned. Please contact support.');
          return;
        }

        const totalPrice = room.pricePerBed * availableRoomBeds.length;
        setPendingBookingId(bookingId);
        setPendingAmount(totalPrice);
        setPaymentOpen(true);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  // ─── Payment success ───────────────────────────────────────────────────────
  const handlePaymentSuccess = async () => {
    setPaymentDone(true);
    setPendingBookingId(null);
    setSelectedBedId(null);
    setSelectedRoomId(null);
    setBookingMode('bed');
    setDurationMonths(1);
    try {
      const updated = await api.get<Listing>(`/Listing/${id}`);
      setListing(updated);
    } catch { /* ignore */ }
    toast.success('Payment successful! Landlord contact is now unlocked.');
  };

  const handleReportListing = async (reason: string) => {
    if (!listing) return;
    const reportedId = listing.landlord?.accountId || String(listing.landlordId);
    await api.post('/Report/CreateReport', { reason, reportedId, listingId: listing.id });
  };

  const handleReportStudent = async (reason: string, studentId: number) => {
    if (!listing) return;
    await api.post('/Report/CreateReport', {
      reason,
      reportedId: String(studentId),
      listingId: listing.id,
    });
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
    room.beds.filter(b => !b.isBooked).map(b => ({ ...b, pricePerBed: room.pricePerBed }))
  );

  const selectedBedPrice = listing.rooms
    .flatMap(r => r.beds.map(b => ({ ...b, price: r.pricePerBed })))
    .find(b => b.id === selectedBedId)?.price;

  const selectedRoom           = listing.rooms.find(r => r.id === selectedRoomId);
  const selectedRoomTotalPrice = selectedRoom
    ? selectedRoom.pricePerBed * selectedRoom.beds.length
    : undefined;

  const activePrice   = bookingMode === 'bed' ? selectedBedPrice : selectedRoomTotalPrice;
  const totalWithFees = activePrice && durationMonths
    ? Math.round(activePrice * Number(durationMonths) * 1.1)
    : undefined;

  const landlordName    = getLandlordName(listing);
  const isOwnListing    = user?.type === 'landlord' && String(listing.landlordId) === String(user.id);
  const showContact     = listing.canViewContact || paymentDone;
  const bookingComplete = paymentDone || listing.canViewContact;

  return (
    <div className="min-h-screen bg-white">

      {lightboxOpen && (
        <Lightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {pendingBookingId !== null && (
        <PaymentModal
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          onSuccess={handlePaymentSuccess}
          type="booking"
          resourceId={pendingBookingId}
          label={`Booking for ${listing.title}`}
          amount={pendingAmount}
        />
      )}

      {/* Back nav */}
      <div className="bg-[#B19CD9]/5 border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/houses')} className="text-[#34495E] hover:text-[#00A5A7]">
            <ArrowLeft className="w-5 h-5 mr-2" />Back to Houses
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main Content ── */}
          <div className="lg:col-span-2">

            {/* Carousel */}
            {allImages.length > 0 ? (
              <div className="mb-8">
                <Carousel>
                  <CarouselContent>
                    {allImages.map((image, index) => (
                      <CarouselItem key={index}>
                        <div
                          className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer"
                          onClick={() => openLightbox(allImages, index)}
                        >
                          <img
                            src={prefixImage(image)}
                            alt={`${listing.title} - Image ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 rounded-full p-3">
                              <ZoomIn className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </Carousel>
                <p className="text-xs text-[#717182] text-center mt-2">Click any image to view full size</p>
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-gray-100 mb-8 flex items-center justify-center">
                <Home className="w-16 h-16 text-gray-300" />
              </div>
            )}

            {/* Title & badges */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                <h1 className="text-[#34495E]">{listing.title}</h1>
                <div className="flex gap-2 flex-wrap">
                  {listing.furnished && <Badge className="bg-[#B8E986] text-[#34495E] border-0">Furnished</Badge>}
                  {listing.wifiAvailable && <Badge className="bg-[#00A5A7] text-white border-0">WiFi</Badge>}
                  {listing.genderPreference !== 0 && (
                    <Badge variant="outline">{GENDER_LABELS[listing.genderPreference]}</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#717182] mb-2">
                <MapPin className="w-5 h-5" />
                <span>
                  {showContact && listing.exactAddress
                    ? `${listing.exactAddress}, ${listing.city}`
                    : `${listing.address}, ${listing.city}`}
                </span>
              </div>
              {landlordName && (
                <p className="text-[#717182] text-sm">
                  Listed by <span className="text-[#00A5A7]">{landlordName}</span>
                </p>
              )}
            </div>

            {/* Quick info */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: <Home  className="w-6 h-6 text-[#00A5A7] mb-2" />, label: `${listing.numberOfRooms} Rooms` },
                    { icon: <Bed   className="w-6 h-6 text-[#00A5A7] mb-2" />, label: `${availableBeds.length} Available Beds` },
                    { icon: <Wifi  className="w-6 h-6 text-[#00A5A7] mb-2" />, label: listing.wifiAvailable ? 'WiFi Yes' : 'No WiFi' },
                    { icon: <Users className="w-6 h-6 text-[#00A5A7] mb-2" />, label: listing.genderPreference === 0 ? 'Any Gender' : GENDER_LABELS[listing.genderPreference] },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex flex-col items-center p-4 bg-[#00A5A7]/5 rounded-lg">
                      {icon}<span className="text-[#34495E]">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-[#34495E] mb-4">Description</h3>
                <p className="text-[#717182]">{listing.description}</p>
              </CardContent>
            </Card>

            {/* Rooms & Beds */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-[#34495E] mb-4">Rooms & Beds</h3>
                <div className="space-y-4">
                  {listing.rooms.map((room, roomIndex) => {
                    const allBedsAvailable = room.beds.length > 0 && room.beds.every(b => !b.isBooked);
                    const isRoomSelected   = selectedRoomId === room.id && bookingMode === 'room';

                    return (
                      <div key={room.id} className="border rounded-lg p-4">

                        {/* Room header */}
                        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="text-[#34495E]">Room {roomIndex + 1}</h4>

                            {/* Book a Room button — only when all beds are free */}
                            {user?.type === 'student' && !bookingComplete && allBedsAvailable && (
                              <Button
                                size="sm"
                                variant={isRoomSelected ? 'default' : 'outline'}
                                onClick={() => {
                                  if (isRoomSelected) {
                                    setSelectedRoomId(null);
                                    setBookingMode('bed');
                                  } else {
                                    setSelectedRoomId(room.id);
                                    setSelectedBedId(null);
                                    setBookingMode('room');
                                  }
                                }}
                                className={
                                  isRoomSelected
                                    ? 'bg-[#00A5A7] text-white border-[#00A5A7] hover:bg-[#00A5A7]/90'
                                    : 'border-[#00A5A7] text-[#00A5A7] hover:bg-[#00A5A7] hover:text-white'
                                }
                              >
                                <Home className="w-3.5 h-3.5 mr-1" />
                                {isRoomSelected ? 'Room Selected ✓' : 'Book a Room'}
                              </Button>
                            )}
                          </div>

                          <span className="text-[#FF6F61] font-semibold">
                            EGP {room.pricePerBed.toLocaleString()}/bed/month
                          </span>
                        </div>

                        {/* Room images */}
                        {room.roomImages.length > 0 && (
                          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                            {room.roomImages.map((img, i) => (
                              <div
                                key={i}
                                className="relative flex-shrink-0 group cursor-pointer"
                                onClick={() => openLightbox(room.roomImages, i)}
                              >
                                <img
                                  src={prefixImage(img)}
                                  alt={`Room ${roomIndex + 1} image ${i + 1}`}
                                  className="h-24 w-36 object-cover rounded transition-transform group-hover:scale-[1.03]"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 rounded bg-black/0 group-hover:bg-black/25 flex items-center justify-center">
                                  <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 drop-shadow" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Bed buttons */}
                        <div className="flex flex-wrap gap-2">
                          {room.beds.map(bed => (
                            <button
                              key={bed.id}
                              onClick={() => {
                                if (!bed.isBooked && user?.type === 'student' && !bookingComplete) {
                                  setSelectedBedId(bed.id);
                                  setSelectedRoomId(null);
                                  setBookingMode('bed');
                                }
                              }}
                              disabled={bed.isBooked || bookingComplete}
                              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                                ${bed.isBooked || bookingComplete
                                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                  : selectedBedId === bed.id && bookingMode === 'bed'
                                    ? 'bg-[#00A5A7] border-[#00A5A7] text-white'
                                    : 'bg-white border-[#B8E986] text-[#34495E] hover:border-[#00A5A7] cursor-pointer'
                                }`}
                            >
                              <Bed className="w-4 h-4 inline mr-1" />
                              Bed {bed.bedNumber ?? bed.id} {bed.isBooked ? '(Booked)' : '(Available)'}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">

                {/* Contact */}
                {showContact ? (
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
                        <span className="text-[#34495E]">{listing.exactAddress}, {listing.city}</span>
                      </div>
                    )}
                    {listing.street && (
                      <div className="flex items-center gap-2 p-3 bg-[#B8E986]/10 rounded-lg">
                        <MapPin className="w-4 h-4 text-[#00A5A7]" />
                        <span className="text-[#34495E]">Street: {listing.street}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-[#FFC759]/10 border border-[#FFC759]/30 rounded-lg text-sm text-[#717182]">
                    Book a bed and complete payment to unlock the landlord's contact details and exact address.
                  </div>
                )}

                {/* Booking form — students only, hidden after payment */}
                {user?.type === 'student' && !bookingComplete && (
                  <div className="space-y-3 border-t pt-4">
                    <h3 className="text-[#34495E] font-semibold">
                      {bookingMode === 'room' ? 'Book Entire Room' : 'Book a Bed'}
                    </h3>

                    {/* Selected bed summary */}
                    {selectedBedId && bookingMode === 'bed' && (
                      <div className="p-2 bg-[#00A5A7]/10 rounded text-sm text-[#00A5A7]">
                        Selected: Bed #{selectedBedId}
                        {selectedBedPrice && ` — EGP ${selectedBedPrice.toLocaleString()}/month`}
                      </div>
                    )}

                    {/* Selected room summary */}
                    {selectedRoomId && bookingMode === 'room' && selectedRoom && (
                      <div className="p-2 bg-[#00A5A7]/10 rounded text-sm text-[#00A5A7]">
                        Selected: Entire Room ({selectedRoom.beds.length} beds)
                        {selectedRoomTotalPrice && ` — EGP ${selectedRoomTotalPrice.toLocaleString()}/month`}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Duration (months)</Label>
                      <Input
                        type="number" min="1" max="24"
                        value={durationMonths === '' ? '' : durationMonths}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDurationMonths(val === '' ? '' : parseInt(val) || 1);
                        }}
                        onBlur={() => {
                          if (!durationMonths || Number(durationMonths) < 1) setDurationMonths(1);
                        }}
                        placeholder="e.g. 6"
                      />
                      {activePrice && durationMonths && Number(durationMonths) >= 1 && (
                        <p className="text-xs text-[#717182]">
                          Total + Fees (10%): EGP {totalWithFees?.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handleBooking}
                      disabled={
                        bookingLoading ||
                        (bookingMode === 'bed' ? !selectedBedId : !selectedRoomId) ||
                        !durationMonths ||
                        Number(durationMonths) < 1
                      }
                      className="w-full bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white h-12"
                    >
                      {bookingLoading
                        ? 'Creating Booking...'
                        : bookingMode === 'room'
                          ? 'Book Entire Room & Pay'
                          : 'Book Now & Pay'}
                    </Button>

                    {!selectedBedId && !selectedRoomId && (
                      <p className="text-[#717182] text-xs text-center">
                        Select an available bed or an entire room above to book
                      </p>
                    )}
                  </div>
                )}

                {/* Property Details */}
                <div className="border-t pt-4">
                  <h4 className="text-[#34495E] mb-3 font-medium">Property Details</h4>
                  <div className="space-y-2 text-sm text-[#717182]">
                    <div className="flex justify-between">
                      <span>Listing ID:</span><span className="text-[#34495E]">#{listing.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>City:</span><span className="text-[#34495E]">{listing.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Furnished:</span><span className="text-[#34495E]">{listing.furnished ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Published:</span>
                      <span className="text-[#34495E]">{new Date(listing.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Report listing — students only */}
                  {user?.type === 'student' && (
                    <div className="mt-4 pt-4 border-t">
                      <ReportModal
                        trigger={
                          <Button variant="outline" size="sm"
                            className="w-full border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white">
                            <Flag className="w-4 h-4 mr-2" />Report this Listing
                          </Button>
                        }
                        title="Report this Listing"
                        description="Describe the issue with this listing. Our team will review your report within 24 hours."
                        onSubmit={handleReportListing}
                      />
                    </div>
                  )}

                  {/* Landlord: booked students */}
                  {isOwnListing && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-[#34495E] font-medium text-sm mb-3">
                        Booked Students
                        {bookedStudents.length > 0 && (
                          <span className="text-[#717182] font-normal ml-1">({bookedStudents.length})</span>
                        )}
                      </h4>
                      {bookedStudents.length === 0 ? (
                        <p className="text-[#717182] text-xs">No students have booked in this listing yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {bookedStudents.map((booking) => (
                            <div key={booking.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                              <div>
                                <p className="text-[#34495E] text-sm font-medium">
                                  {booking.studentName || `Student #${booking.studentId}`}
                                </p>
                                <p className="text-[#717182] text-xs">
                                  Bed #{booking.bedId} · {booking.startDate} → {booking.endDate}
                                </p>
                              </div>
                              <ReportModal
                                trigger={
                                  <Button variant="ghost" size="sm"
                                    className="text-[#FF6F61] hover:bg-[#FF6F61]/10 flex-shrink-0"
                                    title={`Report ${booking.studentName || 'student'}`}>
                                    <Flag className="w-4 h-4" />
                                  </Button>
                                }
                                title={`Report ${booking.studentName || 'Student'}`}
                                description="Describe the issue with this student. Our team will review your report."
                                onSubmit={(reason) => handleReportStudent(reason, booking.studentId)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};
