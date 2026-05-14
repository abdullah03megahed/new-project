export interface User {
  id: string;
  type: 'student' | 'landlord' | 'admin';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: 'male' | 'female';
  nationalId: string;
  dateOfBirth?: string;
  address: string;
  faculty?: string;
  lookingForRoommate?: boolean;
  photoUrl?: string;
  // Matching preferences
  age?: number;
  governorate?: string;
  hometown?: string;
  budgetRange?: string;
  wantsRoommate?: boolean;
  sleepCode?: 'Early Bird' | 'Night Owl' | 'Flexible';
}

export interface House {
  id: string;
  title: string;
  price: number;
  location: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  size: number;
  description: string;
  coverImage: string;
  images: string[];
  videoUrl?: string;
  landmarks: string[];
  landlordId: string;
  featured: boolean;
  rating: number;
  approved: boolean;
}

// Mock houses data
export const mockHouses: House[] = [
  {
    id: '1',
    title: 'Modern Apartment Near Campus',
    price: 3500,
    location: 'Nasr City, Cairo',
    area: 'Nasr City',
    bedrooms: 2,
    bathrooms: 1,
    floor: 3,
    size: 85,
    description: 'A beautiful modern apartment close to universities with all amenities. Perfect for students looking for comfortable accommodation.',
    coverImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ],
    landmarks: ['Cairo University - 5 min', 'Metro Station - 10 min', 'Shopping Mall - 3 min'],
    landlordId: 'landlord1',
    featured: true,
    rating: 4.8,
    approved: true,
  },
  {
    id: '2',
    title: 'Spacious Studio in Heliopolis',
    price: 2800,
    location: 'Heliopolis, Cairo',
    area: 'Heliopolis',
    bedrooms: 1,
    bathrooms: 1,
    floor: 2,
    size: 60,
    description: 'Cozy studio apartment with modern furnishings and easy access to transportation.',
    coverImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ],
    landmarks: ['Ain Shams University - 15 min', 'Bus Station - 5 min', 'Supermarket - 2 min'],
    landlordId: 'landlord1',
    featured: true,
    rating: 4.5,
    approved: true,
  },
  {
    id: '3',
    title: 'Shared Apartment - 3 Bedrooms',
    price: 1500,
    location: 'Dokki, Giza',
    area: 'Dokki',
    bedrooms: 3,
    bathrooms: 2,
    floor: 5,
    size: 120,
    description: 'Perfect for students looking for roommates. Large shared spaces and individual bedrooms.',
    coverImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    ],
    landmarks: ['Giza University - 10 min', 'Dokki Metro - 8 min', 'Restaurants - 5 min'],
    landlordId: 'landlord2',
    featured: true,
    rating: 4.3,
    approved: true,
  },
  {
    id: '4',
    title: 'Affordable Room in Mohandessin',
    price: 2200,
    location: 'Mohandessin, Giza',
    area: 'Mohandessin',
    bedrooms: 1,
    bathrooms: 1,
    floor: 4,
    size: 50,
    description: 'Clean and comfortable room in a quiet neighborhood, great for studying.',
    coverImage: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    ],
    landmarks: ['Library - 5 min', 'Gym - 10 min', 'Market - 3 min'],
    landlordId: 'landlord2',
    featured: false,
    rating: 4.1,
    approved: true,
  },
  {
    id: '5',
    title: 'Luxury Apartment with Balcony',
    price: 4500,
    location: 'Maadi, Cairo',
    area: 'Maadi',
    bedrooms: 2,
    bathrooms: 2,
    floor: 6,
    size: 100,
    description: 'Premium apartment with stunning views and modern amenities. Fully furnished.',
    coverImage: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    ],
    landmarks: ['American University - 20 min', 'Maadi Metro - 12 min', 'Corniche - 10 min'],
    landlordId: 'landlord3',
    featured: true,
    rating: 4.9,
    approved: true,
  },
  {
    id: '6',
    title: 'Budget-Friendly Studio',
    price: 1800,
    location: 'Shubra, Cairo',
    area: 'Shubra',
    bedrooms: 1,
    bathrooms: 1,
    floor: 1,
    size: 45,
    description: 'Perfect starter apartment for students on a budget. Clean and well-maintained.',
    coverImage: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800',
    images: [
      'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800',
    ],
    landmarks: ['University - 25 min', 'Metro - 5 min'],
    landlordId: 'landlord3',
    featured: false,
    rating: 3.9,
    approved: true,
  },
  {
    id: '7',
    title: 'Penthouse with Rooftop',
    price: 5000,
    location: 'Zamalek, Cairo',
    area: 'Zamalek',
    bedrooms: 3,
    bathrooms: 2,
    floor: 8,
    size: 150,
    description: 'Exclusive penthouse apartment with private rooftop access. Premium location.',
    coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    ],
    landmarks: ['Cairo Tower - 5 min', 'Nile Corniche - 2 min', 'Restaurants - 1 min'],
    landlordId: 'landlord1',
    featured: true,
    rating: 5.0,
    approved: true,
  },
  {
    id: '8',
    title: 'Student-Friendly Flat',
    price: 2500,
    location: '6th October City, Giza',
    area: '6th October',
    bedrooms: 2,
    bathrooms: 1,
    floor: 2,
    size: 75,
    description: 'Great for students attending universities in 6th October. Quiet and safe area.',
    coverImage: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800',
    images: [
      'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800',
    ],
    landmarks: ['Mall - 10 min', 'University - 15 min'],
    landlordId: 'landlord2',
    featured: false,
    rating: 4.2,
    approved: true,
  },
  {
    id: '9',
    title: 'Cozy Corner Apartment',
    price: 3200,
    location: 'New Cairo, Cairo',
    area: 'New Cairo',
    bedrooms: 2,
    bathrooms: 1,
    floor: 3,
    size: 90,
    description: 'Well-lit corner apartment with plenty of natural light. Modern and clean.',
    coverImage: 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800',
    images: [
      'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800',
    ],
    landmarks: ['AUC - 10 min', 'Shopping Center - 5 min'],
    landlordId: 'landlord3',
    featured: true,
    rating: 4.6,
    approved: true,
  },
  {
    id: '10',
    title: 'Modern Loft Style Apartment',
    price: 4200,
    location: 'Sheikh Zayed, Giza',
    area: 'Sheikh Zayed',
    bedrooms: 2,
    bathrooms: 2,
    floor: 4,
    size: 110,
    description: 'Contemporary loft-style living with high ceilings and modern design.',
    coverImage: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800',
    images: [
      'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800',
    ],
    landmarks: ['Mall of Arabia - 15 min', 'Universities - 20 min'],
    landlordId: 'landlord1',
    featured: true,
    rating: 4.7,
    approved: true,
  },
];

// Mock user
export const mockUser: User = {
  id: 'user1',
  type: 'student',
  firstName: 'Ahmed',
  lastName: 'Hassan',
  email: 'ahmed.hassan@email.com',
  phone: '+20 123 456 7890',
  gender: 'male',
  nationalId: '29901011234567',
  dateOfBirth: '1999-01-01',
  address: 'Cairo, Egypt',
  faculty: 'Engineering',
  lookingForRoommate: true,
  // Matching preferences
  age: 23,
  governorate: 'Cairo',
  hometown: 'Alexandria',
  budgetRange: '2000-3000',
  wantsRoommate: true,
  sleepCode: 'Flexible',
};
