import { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Edit2, Save, X, Upload, MapPin, GraduationCap, DollarSign, Users, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user || {});

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#717182]">Please log in to view your profile</p>
      </div>
    );
  }

  const handleSave = () => {
    updateUser(formData);
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  const handlePhotoUpload = () => {
    // Mock photo upload - in real app, this would handle file upload
    toast.success('Photo upload feature - coming soon!');
  };

  return (
    <div className="min-h-screen bg-[#B19CD9]/5 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#34495E]">My Profile</CardTitle>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="bg-[#B8E986] hover:bg-[#B8E986]/90 text-[#34495E]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Photo */}
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.photoUrl} />
                <AvatarFallback className="bg-[#00A5A7] text-white" style={{ fontSize: '32px' }}>
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  onClick={handlePhotoUpload}
                  variant="outline"
                  className="border-[#00A5A7] text-[#00A5A7]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              )}
            </div>

            {/* User Type Badge */}
            <div className="inline-block px-4 py-2 bg-[#00A5A7]/10 rounded-full">
              <span className="text-[#00A5A7]">
                {user.type === 'student' ? 'Student' : 'Landlord'}
              </span>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={formData.email} disabled />
            </div>

            {/* Student-specific fields */}
            {user.type === 'student' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    {isEditing ? (
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input id="gender" value={formData.gender || ''} disabled />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">National ID</Label>
                    <Input id="nationalId" value={formData.nationalId} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faculty">Faculty</Label>
                  <Input
                    id="faculty"
                    value={formData.faculty || ''}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lookingForRoommate"
                    checked={formData.lookingForRoommate || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, lookingForRoommate: checked === true })
                    }
                    disabled={!isEditing}
                  />
                  <Label htmlFor="lookingForRoommate" className="cursor-pointer">
                    Looking for a roommate
                  </Label>
                </div>
              </>
            )}

            {/* Landlord-specific fields */}
            {user.type === 'landlord' && (
              <div className="space-y-2">
                <Label htmlFor="nationalId">National ID</Label>
                <Input id="nationalId" value={formData.nationalId} disabled />
              </div>
            )}

            {/* Address (common field) */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Matching Preferences Card - Only for Students */}
        {user.type === 'student' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-[#34495E] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00A5A7]" />
                Roommate Matching Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!user.governorate && !user.budgetRange && !user.sleepCode ? (
                <div className="text-center py-8">
                  <p className="text-[#717182] mb-4">
                    Complete your matching preferences to find the perfect roommate
                  </p>
                  <Button
                    onClick={() => navigate('/matching')}
                    className="bg-[#00A5A7] hover:bg-[#00A5A7]/90 text-white"
                  >
                    Complete Matching Form
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Hometown */}
                  {formData.governorate && (
                    <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#00A5A7]/10 rounded-full flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-[#00A5A7]" />
                        </div>
                        <Label className="text-[#34495E]">Hometown</Label>
                      </div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={formData.governorate || ''}
                            onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                            placeholder="Governorate"
                          />
                          <Input
                            value={formData.hometown || ''}
                            onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                            placeholder="Address (optional)"
                            className="text-sm"
                          />
                        </div>
                      ) : (
                        <p className="text-[#34495E] ml-13">
                          {formData.governorate}
                          {formData.hometown && `, ${formData.hometown}`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Faculty */}
                  {formData.faculty && (
                    <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#FFC759]/10 rounded-full flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-[#FFC759]" />
                        </div>
                        <Label className="text-[#34495E]">Faculty / Study Field</Label>
                      </div>
                      {isEditing ? (
                        <Input
                          value={formData.faculty || ''}
                          onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                        />
                      ) : (
                        <p className="text-[#34495E] ml-13">{formData.faculty}</p>
                      )}
                    </div>
                  )}

                  {/* Budget Range */}
                  {formData.budgetRange && (
                    <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#B8E986]/10 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-[#B8E986]" />
                        </div>
                        <Label className="text-[#34495E]">Budget Range</Label>
                      </div>
                      {isEditing ? (
                        <Input
                          value={formData.budgetRange || ''}
                          onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                          placeholder="e.g., 2000-3000"
                        />
                      ) : (
                        <p className="text-[#34495E] ml-13">{formData.budgetRange} EGP/month</p>
                      )}
                    </div>
                  )}

                  {/* Sleep Code */}
                  {formData.sleepCode && (
                    <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#B19CD9]/10 rounded-full flex items-center justify-center">
                          <Moon className="w-5 h-5 text-[#B19CD9]" />
                        </div>
                        <Label className="text-[#34495E]">Sleep Code</Label>
                      </div>
                      {isEditing ? (
                        <Select
                          value={formData.sleepCode}
                          onValueChange={(value) => setFormData({ ...formData, sleepCode: value as 'Early Bird' | 'Night Owl' | 'Flexible' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Early Bird">🌅 Early Bird</SelectItem>
                            <SelectItem value="Night Owl">🌙 Night Owl</SelectItem>
                            <SelectItem value="Flexible">⚡ Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-[#34495E] ml-13">
                          {formData.sleepCode === 'Early Bird' && '🌅 Early Bird'}
                          {formData.sleepCode === 'Night Owl' && '🌙 Night Owl'}
                          {formData.sleepCode === 'Flexible' && '⚡ Flexible'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Wants Roommate */}
                  {formData.wantsRoommate !== undefined && (
                    <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#FF6F61]/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#FF6F61]" />
                        </div>
                        <Label className="text-[#34495E]">Looking for Roommate</Label>
                      </div>
                      {isEditing ? (
                        <Select
                          value={formData.wantsRoommate ? 'yes' : 'no'}
                          onValueChange={(value) => setFormData({ ...formData, wantsRoommate: value === 'yes' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-[#34495E] ml-13">
                          {formData.wantsRoommate ? 'Yes' : 'No'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Age */}
                  {formData.age && (
                    <div className="bg-[#B19CD9]/5 rounded-lg p-4 border border-[#B19CD9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#00A5A7]/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#00A5A7]" />
                        </div>
                        <Label className="text-[#34495E]">Age</Label>
                      </div>
                      <p className="text-[#34495E] ml-13">{formData.age} years old</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
