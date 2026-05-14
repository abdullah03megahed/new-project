import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../utils/AuthContext';
import { mockHouses } from '../utils/mockData';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus, Edit, Trash2, MapPin, DollarSign, Home } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { toast } from "sonner"; 

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [houses, setHouses] = useState(
    user?.type === 'landlord' ? mockHouses.filter((h) => h.landlordId === user.id) : []
  );

  if (!user || user.type !== 'landlord') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#717182]">Access denied. Landlords only.</p>
      </div>
    );
  }

  const handleDelete = (houseId: string) => {
    setHouses(houses.filter((h) => h.id !== houseId));
    toast.success('Property deleted successfully');
  };

  const handleEdit = (houseId: string) => {
    navigate(`/add-house?edit=${houseId}`);
  };

  const stats = {
    totalProperties: houses.length,
    featuredProperties: houses.filter((h) => h.featured).length,
    totalValue: houses.reduce((sum, h) => sum + h.price, 0),
  };

  return (
    <div className="min-h-screen bg-[#B19CD9]/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#34495E] mb-2">Landlord Dashboard</h1>
            <p className="text-[#717182]">Manage your property listings</p>
          </div>
          <Button
            onClick={() => navigate('/add-house')}
            className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Property
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[#717182]">Total Properties</CardTitle>
              <Home className="w-5 h-5 text-[#00A5A7]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#34495E]" style={{ fontSize: '32px', fontWeight: '700' }}>
                {stats.totalProperties}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[#717182]">Featured</CardTitle>
              <Badge className="bg-[#FFC759] text-[#34495E] border-0">Featured</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-[#34495E]" style={{ fontSize: '32px', fontWeight: '700' }}>
                {stats.featuredProperties}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[#717182]">Total Monthly Value</CardTitle>
              <DollarSign className="w-5 h-5 text-[#B8E986]" />
            </CardHeader>
            <CardContent>
              <div className="text-[#34495E]" style={{ fontSize: '24px', fontWeight: '700' }}>
                EGP {stats.totalValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#34495E]">Your Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {houses.length === 0 ? (
              <div className="text-center py-12">
                <Home className="w-16 h-16 text-[#717182] mx-auto mb-4" />
                <p className="text-[#717182] mb-4">No properties listed yet</p>
                <Button
                  onClick={() => navigate('/add-house')}
                  className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white"
                >
                  Add Your First Property
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {houses.map((house) => (
                  <div
                    key={house.id}
                    className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:border-[#00A5A7] transition-colors"
                  >
                    <img
                      src={house.coverImage}
                      alt={house.title}
                      className="w-full md:w-48 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-[#34495E] mb-1">{house.title}</h3>
                          <div className="flex items-center gap-2 text-[#717182]">
                            <MapPin className="w-4 h-4" />
                            <span>{house.location}</span>
                          </div>
                        </div>
                        {house.featured && (
                          <Badge className="bg-[#FFC759] text-[#34495E] border-0">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-[#FF6F61]" style={{ fontSize: '20px', fontWeight: '600' }}>
                          EGP {house.price.toLocaleString()}/mo
                        </span>
                        <span className="text-[#717182]">
                          {house.bedrooms} bed • {house.bathrooms} bath • {house.size}m²
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(house.id)}
                          variant="outline"
                          size="sm"
                          className="border-[#00A5A7] text-[#00A5A7]"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your
                                property listing.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(house.id)}
                                className="bg-[#FF6F61] hover:bg-[#FF6F61]/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

