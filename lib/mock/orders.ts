import { Order, User, Review } from '@/lib/types';

export const mockOrders: Order[] = [
  {
    id: 'ord-1', orderNumber: 'EM-20250201-001', status: 'delivered', total: 1380,
    createdAt: '2025-02-01T10:30:00Z', estimatedDelivery: '2025-02-04',
    address: '123 Main Street, Lahore', paymentMethod: 'cod',
    items: [
      { id: 'oi-1', productId: 'prod-1', productName: 'Basmati Rice 5kg', productImage: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&h=100&fit=crop', price: 1200, quantity: 1 },
      { id: 'oi-2', productId: 'prod-2', productName: 'Fresh Milk 1L', productImage: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&h=100&fit=crop', price: 180, quantity: 1 },
    ],
  },
  {
    id: 'ord-2', orderNumber: 'EM-20250208-002', status: 'shipped', total: 2090,
    createdAt: '2025-02-08T14:15:00Z', estimatedDelivery: '2025-02-12',
    address: '456 Market Road, Karachi', paymentMethod: 'cod',
    items: [
      { id: 'oi-3', productId: 'prod-11', productName: 'Power Bank 10000mAh', productImage: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=100&h=100&fit=crop', price: 1200, quantity: 1 },
      { id: 'oi-4', productId: 'prod-8', productName: 'Non-Stick Frying Pan', productImage: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=100&h=100&fit=crop', price: 890, quantity: 1 },
    ],
  },
  {
    id: 'ord-3', orderNumber: 'EM-20250212-003', status: 'processing', total: 570,
    createdAt: '2025-02-12T09:00:00Z', estimatedDelivery: '2025-02-16',
    address: '789 Garden Ave, Islamabad', paymentMethod: 'cod',
    items: [
      { id: 'oi-5', productId: 'prod-3', productName: 'Organic Apples 1kg', productImage: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100&h=100&fit=crop', price: 350, quantity: 1 },
      { id: 'oi-6', productId: 'prod-6', productName: 'Hand Soap 500ml', productImage: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=100&h=100&fit=crop', price: 220, quantity: 1 },
    ],
  },
  {
    id: 'ord-4', orderNumber: 'EM-20250215-004', status: 'pending', total: 870,
    createdAt: '2025-02-15T16:45:00Z',
    address: '321 Lake View, Peshawar', paymentMethod: 'cod',
    items: [
      { id: 'oi-7', productId: 'prod-10', productName: 'Cotton T-Shirt', productImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop', price: 550, quantity: 1 },
      { id: 'oi-8', productId: 'prod-12', productName: 'Notebook Set (3 Pack)', productImage: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=100&h=100&fit=crop', price: 250, quantity: 1 },
    ],
  },
];

export const mockUsers: User[] = [
  { id: 'user-1', name: 'Ahmed Khan', phone: '+923001234567', role: 'buyer', createdAt: '2025-01-01' },
  { id: 'user-2', name: 'Fatima Ali', phone: '+923211234567', role: 'buyer', email: 'fatima@example.com', createdAt: '2025-01-05' },
  { id: 'user-seller', name: 'Hassan Electronics', phone: '+923121234567', role: 'seller', email: 'hassan@emart.pk', createdAt: '2024-11-15' },
  { id: 'user-admin', name: 'Admin User', phone: '+923331234567', role: 'admin', email: 'admin@emart.pk', createdAt: '2024-12-01' },
];

export const mockReviews: Review[] = [
  { id: 'rev-1', userId: 'user-1', userName: 'Ahmed K.', productId: 'prod-1', rating: 5, comment: 'Excellent quality rice! Very aromatic.', createdAt: '2025-02-02' },
  { id: 'rev-2', userId: 'user-2', userName: 'Fatima A.', productId: 'prod-1', rating: 4, comment: 'Good rice, slightly expensive.', createdAt: '2025-02-03' },
  { id: 'rev-3', userId: 'user-1', userName: 'Ahmed K.', productId: 'prod-5', rating: 4, comment: 'Fresh oil, good for daily cooking.', createdAt: '2025-02-01' },
  { id: 'rev-4', userId: 'user-2', userName: 'Fatima A.', productId: 'prod-11', rating: 5, comment: 'Fast charging and compact!', createdAt: '2025-02-09' },
];
