import { useState } from 'react';
import { mockHouses, House } from '../utils/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckCircle, XCircle, MapPin, Bed, Bath, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const Admin = () => {
  // In a real app, this would come from state management or API
  const [houses, setHouses] = useState<House[]>(mockHouses);

  // Filter houses pending approval
  const pendingHouses = houses.filter(house => !house.approved);
  const approvedHouses = houses.filter(house => house.approved);

  const handleApprove = (houseId: string) => {
    setHouses(prevHouses =>
      prevHouses.map(house =>
        house.id === houseId ? { ...house, approved: true } : house
      )
    );
    toast.success('House approved successfully!');
  };

  const handleReject = (houseId: string) => {
    setHouses(prevHouses => prevHouses.filter(house => house.id !== houseId));
    toast.success('House rejected and removed from listings.');
  };

  const handleDelete = (houseId: string) => {
    setHouses(prevHouses => prevHouses.filter(house => house.id !== houseId));
    toast.success('House deleted successfully.');
  };

  const handleUpdate = (houseId: string) => {
    // In a real app, this would navigate to an edit page or open a modal
    toast.info(`Edit functionality for house ${houseId} - Coming soon!`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-[#34495E] mb-2">Admin Dashboard</h1>
          <p className="text-[#717182]">Manage house listings and approvals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#00A5A7]">{houses.length}</CardTitle>
              <CardDescription>Total Listings</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-[#B8E986]">{approvedHouses.length}</CardTitle>
              <CardDescription>Approved Houses</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-[#FF6F61]">{pendingHouses.length}</CardTitle>
              <CardDescription>Pending Approval</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Pending Approvals */}
        <div className="mb-8">
          <h2 className="text-[#34495E] mb-4">Pending Approvals</h2>
          {pendingHouses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-[#717182]">
                No houses pending approval
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingHouses.map(house => (
                <Card key={house.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <img
                        src={house.coverImage}
                        alt={house.title}
                        className="w-48 h-32 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-[#34495E] mb-1">{house.title}</h3>
                            <div className="flex items-center gap-2 text-[#717182] text-sm mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>{house.location}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-[#FF6F61] text-[#FF6F61]">
                            Pending
                          </Badge>
                        </div>
                        
                        <p className="text-[#717182] text-sm mb-3 line-clamp-2">
                          {house.description}
                        </p>

                        <div className="flex items-center gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Bed className="w-4 h-4 text-[#717182]" />
                            <span className="text-[#34495E]">{house.bedrooms} Beds</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bath className="w-4 h-4 text-[#717182]" />
                            <span className="text-[#34495E]">{house.bathrooms} Baths</span>
                          </div>
                          <span className="text-[#34495E]">{house.size}m²</span>
                          <span className="text-[#FF6F61]" style={{ fontWeight: '600' }}>
                            EGP {house.price.toLocaleString()}/month
                          </span>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApprove(house.id)}
                            className="bg-[#B8E986] hover:bg-[#B8E986]/90 text-[#34495E]"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(house.id)}
                            variant="outline"
                            className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        

        {/* Approved Houses */}
        <div>
          <h2 className="text-[#34495E] mb-4">Approved Houses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedHouses.slice(0, 6).map(house => (
              <Card key={house.id} className="overflow-hidden">
                <img
                  src={house.coverImage}
                  alt={house.title}
                  className="w-full h-40 object-cover"
                />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-[#34495E]">{house.title}</h3>
                    <Badge className="bg-[#B8E986] text-[#34495E] border-0">
                      Approved
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[#717182] text-sm mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{house.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm mb-3">
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

                  {/* Admin Controls */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdate(house.id)}
                      className="flex-1 border-[#00A5A7] text-[#00A5A7] hover:bg-[#00A5A7] hover:text-white"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Update
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(house.id)}
                      className="flex-1 border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
