import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../utils/AuthContext';
import { api } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoomInput {
  bedCount: number;
  pricePerBed: number;
  images: File[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AddHouse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    street: '',
    city: '',
    furnished: false,
    wifiAvailable: false,
    genderPreference: '0',
  });

  const [rooms, setRooms] = useState<RoomInput[]>([
    { bedCount: 1, pricePerBed: 0, images: [] },
  ]);

  const [listingImages, setListingImages] = useState<File[]>([]);

  // If editing, fetch existing listing data
  useEffect(() => {
    if (!editId) return;
    const fetchListing = async () => {
      try {
        const data = await api.get<any>(`/Listing/${editId}`);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          address: data.address || '',
          street: data.street || '',
          city: data.city || '',
          furnished: data.furnished || false,
          wifiAvailable: data.wifiAvailable || false,
          genderPreference: String(data.genderPreference || '0'),
        });
        if (data.rooms?.length > 0) {
          setRooms(data.rooms.map((r: any) => ({
            bedCount: r.bedCount || 1,
            pricePerBed: r.pricePerBed || 0,
            images: [],
          })));
        }
      } catch {
        toast.error('Failed to load listing for editing.');
      }
    };
    fetchListing();
  }, [editId]);

  if (!user || user.type !== 'landlord') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#717182]">Access denied. Landlords only.</p>
      </div>
    );
  }

  const addRoom = () => {
    setRooms([...rooms, { bedCount: 1, pricePerBed: 0, images: [] }]);
  };

  const removeRoom = (index: number) => {
    if (rooms.length === 1) return;
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const updateRoom = (index: number, field: keyof RoomInput, value: any) => {
    setRooms(rooms.map((room, i) => i === index ? { ...room, [field]: value } : room));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('Title', formData.title);
      fd.append('Description', formData.description);
      fd.append('Address', formData.address);
      fd.append('Street', formData.street);
      fd.append('City', formData.city);
      fd.append('Furnished', String(formData.furnished));
      fd.append('WifiAvailable', String(formData.wifiAvailable));
      fd.append('GenderPreference', formData.genderPreference);

      // Listing images
      listingImages.forEach(file => fd.append('ListingImages', file));

      // Rooms as JSON array string
      const roomsPayload = rooms.map(r => ({
        BedCount: r.bedCount,
        PricePerBed: r.pricePerBed,
      }));
      fd.append('Rooms', JSON.stringify(roomsPayload));

      if (editId) {
        await api.upload<any>(`/Listing/${editId}`, fd);
        toast.success('Property updated successfully!');
      } else {
        await api.upload<any>('/Listing', fd);
        toast.success('Property added successfully!');
      }

      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save listing.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#B19CD9]/5 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-[#34495E] hover:text-[#00A5A7]"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#34495E]">
              {editId ? 'Edit Property' : 'Add New Property'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-[#34495E] font-medium">Basic Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="title">Property Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Modern Apartment Near Campus"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your property..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genderPreference">Gender Preference</Label>
                  <Select
                    value={formData.genderPreference}
                    onValueChange={(v) => setFormData({ ...formData, genderPreference: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any Gender</SelectItem>
                      <SelectItem value="1">Male Only</SelectItem>
                      <SelectItem value="2">Female Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="furnished"
                      checked={formData.furnished}
                      onCheckedChange={(c) => setFormData({ ...formData, furnished: c === true })}
                    />
                    <Label htmlFor="furnished" className="cursor-pointer">Furnished</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wifi"
                      checked={formData.wifiAvailable}
                      onCheckedChange={(c) => setFormData({ ...formData, wifiAvailable: c === true })}
                    />
                    <Label htmlFor="wifi" className="cursor-pointer">WiFi Available</Label>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-[#34495E] font-medium">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g., Cairo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">Street</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="e.g., 15 Tahrir St"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Area / Neighborhood</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., Nasr City (this is shown publicly)"
                    required
                  />
                </div>
              </div>

              {/* Listing Images */}
              <div className="space-y-4">
                <h3 className="text-[#34495E] font-medium">Listing Images</h3>
                <div className="border-2 border-dashed border-[#00A5A7]/30 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setListingImages(Array.from(e.target.files || []))}
                    className="hidden"
                    id="listing-images"
                  />
                  <label htmlFor="listing-images" className="cursor-pointer">
                    <p className="text-[#717182] mb-2">
                      {listingImages.length > 0
                        ? `${listingImages.length} image(s) selected`
                        : 'Click to upload listing images'}
                    </p>
                    <Button type="button" variant="outline" className="border-[#00A5A7] text-[#00A5A7]">
                      Choose Images
                    </Button>
                  </label>
                </div>
              </div>

              {/* Rooms */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-[#34495E] font-medium">Rooms</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRoom}
                    className="border-[#00A5A7] text-[#00A5A7]"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Room
                  </Button>
                </div>

                {rooms.map((room, index) => (
                  <Card key={index} className="border-[#B19CD9]/20">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[#34495E] font-medium">Room {index + 1}</h4>
                        {rooms.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRoom(index)}
                            className="text-[#FF6F61] hover:text-[#FF6F61]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Number of Beds</Label>
                          <Input
                            type="number"
                            min="1"
                            value={room.bedCount}
                            onChange={(e) => updateRoom(index, 'bedCount', parseInt(e.target.value))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Price Per Bed (EGP/month)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={room.pricePerBed}
                            onChange={(e) => updateRoom(index, 'pricePerBed', parseFloat(e.target.value))}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Room Images (optional)</Label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => updateRoom(index, 'images', Array.from(e.target.files || []))}
                          className="text-sm text-[#717182]"
                        />
                        {room.images.length > 0 && (
                          <p className="text-xs text-[#00A5A7]">{room.images.length} image(s) selected</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
                >
                  {loading ? 'Saving...' : editId ? 'Update Property' : 'Add Property'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
