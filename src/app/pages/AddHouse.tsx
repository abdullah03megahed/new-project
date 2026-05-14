import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../utils/AuthContext';
import { mockHouses } from '../utils/mockData';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { toast } from "sonner";

export const AddHouse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const existingHouse = editId ? mockHouses.find((h) => h.id === editId) : null;

  const [formData, setFormData] = useState({
    title: existingHouse?.title || '',
    price: existingHouse?.price || 0,
    location: existingHouse?.location || '',
    area: existingHouse?.area || '',
    bedrooms: existingHouse?.bedrooms || 1,
    bathrooms: existingHouse?.bathrooms || 1,
    floor: existingHouse?.floor || 1,
    size: existingHouse?.size || 50,
    description: existingHouse?.description || '',
    landmarks: existingHouse?.landmarks?.join(', ') || '',
    featured: existingHouse?.featured || false,
  });

  if (!user || user.type !== 'landlord') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#717182]">Access denied. Landlords only.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock save - in real app, this would call an API
    if (editId) {
      toast.success('Property updated successfully!');
    } else {
      toast.success('Property added successfully!');
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#B19CD9]/5 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Back Button */}
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
                <h3 className="text-[#34495E]">Basic Information</h3>
                
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Monthly Price (EGP)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Size (m²)</Label>
                    <Input
                      id="size"
                      type="number"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) })}
                      required
                    />
                  </div>
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
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-[#34495E]">Location</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area">Area</Label>
                    <Input
                      id="area"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="e.g., Nasr City"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Full Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Nasr City, Cairo"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landmarks">Nearby Landmarks</Label>
                  <Input
                    id="landmarks"
                    value={formData.landmarks}
                    onChange={(e) => setFormData({ ...formData, landmarks: e.target.value })}
                    placeholder="Separate with commas: Cairo University - 5 min, Metro - 10 min"
                  />
                  <p className="text-[#717182]">Separate multiple landmarks with commas</p>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="text-[#34495E]">Property Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="1"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="1"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor">Floor Number</Label>
                    <Input
                      id="floor"
                      type="number"
                      min="1"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Images & Media */}
              <div className="space-y-4">
                <h3 className="text-[#34495E]">Images & Media</h3>
                <div className="border-2 border-dashed border-[#00A5A7]/30 rounded-lg p-8 text-center">
                  <p className="text-[#717182] mb-2">Upload property images</p>
                  <Button type="button" variant="outline" className="border-[#00A5A7] text-[#00A5A7]">
                    Choose Files
                  </Button>
                  <p className="text-[#717182] mt-2">Image upload feature - coming soon!</p>
                </div>
              </div>

              {/* Featured */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, featured: checked === true })
                  }
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Mark as featured property
                </Label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
                >
                  {editId ? 'Update Property' : 'Add Property'}
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

