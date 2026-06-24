// src/app/providers/ItemProvider.tsx
import React, { createContext, useReducer, ReactNode, Dispatch } from 'react';

export interface SellerProfile {
  name: string;
  avatar: string;
  rating: number;
  transactions: number;
}

export interface ProductItem {
  id: string;
  title: string;
  xu: number;
  category: string;
  condition: string;
  ageRange: string;
  location: string;
  image: string;
  description: string;
  seller: SellerProfile;
  status: 'active' | 'hidden' | 'matched' | 'completed';
  createdAt: string;
}

export type ItemAction =
  | { type: 'ADD_ITEM'; payload: Omit<ProductItem, 'id' | 'status' | 'createdAt'> }
  | { type: 'UPDATE_ITEM'; payload: Partial<ProductItem> & { id: string } }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'TOGGLE_ITEM_STATUS'; payload: string };

const initialItems: ProductItem[] = [
  {
    id: '1',
    title: 'Xe đẩy Combi đời 2024',
    xu: 12,
    category: 'xe_noi',
    condition: 'Còn tốt',
    ageRange: '0-2 tuổi',
    location: 'Quận 7, TP.HCM',
    image: 'https://images.unsplash.com/photo-1591536120035-0100e5b6f08f?w=400',
    description: 'Xe đẩy Combi còn rất mới, sử dụng được khoảng 6 tháng. Gấp gọn tiện lợi, có mái che chống nắng. Bánh xe êm ái, phanh an toàn.',
    seller: { name: 'Mẹ Bống', avatar: 'B', rating: 4.8, transactions: 12 },
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Bộ xếp hình Lego Duplo 120 chi tiết',
    xu: 5,
    category: 'do_choi',
    condition: 'Mới',
    ageRange: '2-5 tuổi',
    location: 'Quận Bình Thạnh, TP.HCM',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400',
    description: 'Bộ Lego Duplo nguyên hộp, mua về bé không chơi. Đầy đủ 120 chi tiết, màu sắc sặc sỡ, an toàn cho bé.',
    seller: { name: 'Mẹ Min', avatar: 'M', rating: 4.9, transactions: 8 },
    status: 'active',
    createdAt: '2024-01-18',
  },
  {
    id: '3',
    title: 'Sách vải Montessori cho bé sơ sinh',
    xu: 3,
    category: 'sach_truyen',
    condition: 'Còn tốt',
    ageRange: '0-1 tuổi',
    location: 'Quận 2, TP.HCM',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    description: 'Bộ 5 cuốn sách vải Montessori với nhiều chủ đề: động vật, trái cây, hình khối. Giặt được, an toàn tuyệt đối cho bé.',
    seller: { name: 'Mẹ Na', avatar: 'N', rating: 4.7, transactions: 15 },
    status: 'active',
    createdAt: '2024-01-20',
  },
  {
    id: '4',
    title: 'Bộ quần áo bé gái 2-3 tuổi (10 bộ)',
    xu: 4,
    category: 'quan_ao',
    condition: 'Đã dùng nhiều',
    ageRange: '2-3 tuổi',
    location: 'Quận Gò Vấp, TP.HCM',
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400',
    description: '10 bộ quần áo bé gái từ các hãng Cotton On, H&M. Một số bộ còn mới, một số đã giặt nhiều lần nhưng còn đẹp.',
    seller: { name: 'Mẹ Sóc', avatar: 'S', rating: 4.5, transactions: 20 },
    status: 'active',
    createdAt: '2024-01-22',
  },
  {
    id: '5',
    title: 'Nôi điện tự động Mastela',
    xu: 8,
    category: 'xe_noi',
    condition: 'Có lỗi nhỏ',
    ageRange: '0-1 tuổi',
    location: 'Quận Tân Bình, TP.HCM',
    image: 'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=400',
    description: 'Nôi điện Mastela có chế độ rung nhẹ, phát nhạc. Lỗi nhỏ ở nút bấm volume nhưng vẫn dùng tốt. Đã thay pin mới.',
    seller: { name: 'Mẹ Gấu', avatar: 'G', rating: 4.6, transactions: 5 },
    status: 'active',
    createdAt: '2024-01-25',
  },
  {
    id: '6',
    title: 'Bộ đồ chơi nhà bếp gỗ cho bé',
    xu: 6,
    category: 'do_choi',
    condition: 'Còn tốt',
    ageRange: '3-6 tuổi',
    location: 'Quận 1, TP.HCM',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400',
    description: 'Bộ đồ chơi nhà bếp bằng gỗ tự nhiên, sơn an toàn. Gồm bếp, nồi, chảo, thớt và các loại rau củ quả giả.',
    seller: { name: 'Mẹ Meo', avatar: 'E', rating: 4.8, transactions: 7 },
    status: 'active',
    createdAt: '2024-01-28',
  },
  {
    id: '7',
    title: 'Bộ bút màu sáp 64 màu Crayola',
    xu: 2,
    category: 'do_hoc_tap',
    condition: 'Mới',
    ageRange: '3-10 tuổi',
    location: 'Quận 3, TP.HCM',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    description: 'Hộp bút màu sáp Crayola 64 màu, mua dư 1 hộp. Nguyên seal chưa mở, hàng xách tay từ Mỹ.',
    seller: { name: 'Mẹ Bi', avatar: 'I', rating: 5.0, transactions: 3 },
    status: 'active',
    createdAt: '2024-02-01',
  },
  {
    id: '8',
    title: 'Gấu bông Teddy lớn 80cm',
    xu: 0,
    category: 'tram_tang',
    condition: 'Còn tốt',
    ageRange: '0-10 tuổi',
    location: 'Quận 7, TP.HCM',
    image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=400',
    description: 'Gấu bông Teddy lớn, đã giặt sạch sẽ. Mình tặng miễn phí cho ai cần, bé nhà mình lớn không chơi nữa.',
    seller: { name: 'Mẹ Bống', avatar: 'B', rating: 4.8, transactions: 12 },
    status: 'active',
    createdAt: '2024-02-05',
  },
];

const itemReducer = (state: ProductItem[], action: ItemAction): ProductItem[] => {
  switch (action.type) {
    case 'ADD_ITEM':
      return [
        ...state,
        {
          ...action.payload,
          id: Date.now().toString(),
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
        },
      ];
    case 'UPDATE_ITEM':
      return state.map(item =>
        item.id === action.payload.id ? { ...item, ...action.payload } : item
      );
    case 'DELETE_ITEM':
      return state.filter(item => item.id !== action.payload);
    case 'TOGGLE_ITEM_STATUS':
      return state.map(item =>
        item.id === action.payload
          ? { ...item, status: item.status === 'active' ? 'hidden' : 'active' }
          : item
      );
    default:
      return state;
  }
};

export const ItemContext = createContext<{
  items: ProductItem[];
  dispatch: Dispatch<ItemAction>;
}>({
  items: initialItems,
  dispatch: () => null,
});

export const ItemProvider = ({ children }: { children: ReactNode }) => {
  const [items, dispatch] = useReducer(itemReducer, initialItems);

  return (
    <ItemContext.Provider value={{ items, dispatch }}>
      {children}
    </ItemContext.Provider>
  );
};
