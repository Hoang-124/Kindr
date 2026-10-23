// src/features/home/store/homeSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../../types/common';
import { DEFAULT_IMAGES } from '../../../utils/constants';
import * as productService from '../../../services/productService';

interface HomeState {
  products: Product[];
  currentProductDetail: Product | null;
  searchQuery: string;
  selectedCategory: string;
  selectedDistrict: string;
  selectedCondition: string | null;
  sortOrder: 'newest' | 'closest' | 'price_asc' | 'price_desc';
  isLoading: boolean;
  error: string | null;
}

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'demo_prod_1',
    name: 'Đồ chơi gỗ Montessori Luồn hạt đa giác phát triển trí não',
    price: 4,
    condition: '90',
    conditionLabel: 'Mới 90% (Rất mới)',
    category: 'do_choi',
    ageRange: '1-3y',
    distance: '0.8 km',
    locationName: 'P. Thạch Thang, Q. Hải Châu, Đà Nẵng',
    wardId: 'hc_thachthang',
    districtId: 'dn_haichau',
    timeAgo: '2 giờ trước',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
    description: 'Bộ luồn hạt gỗ tự nhiên sơn an toàn không mùi, các hạt gỗ nhẵn bóng không có dằm.',
    sellerId: 'seller_hoalan',
    sellerName: 'Mẹ Hoa Lan',
    sellerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905123456',
    safeFeeLocked: 1,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'demo_prod_2',
    name: 'Set 3 bộ body suit cộc tay Nous Organic Cotton size 3-6m',
    price: 5,
    condition: '90',
    conditionLabel: 'Mới 90% (Rất mới)',
    category: 'quan_ao',
    ageRange: '0-6m',
    distance: '1.2 km',
    locationName: 'P. Vĩnh Trung, Q. Thanh Khê, Đà Nẵng',
    wardId: 'tk_vinhtrung',
    districtId: 'dn_thanhkhe',
    timeAgo: '5 giờ trước',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
    description: 'Set body Nous vải sợi tre siêu thoáng mát. Bé trộm vía tăng cân nhanh nên mặc được 2 tuần là chật.',
    sellerId: 'seller_mebap',
    sellerName: 'Mẹ Bắp',
    sellerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905234567',
    safeFeeLocked: 1,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'demo_prod_3',
    name: 'Xe chòi chân hình chú Khủng Long có nhạc và đèn vui nhộn',
    price: 8,
    condition: '80',
    conditionLabel: 'Mới 80% (Khá mới)',
    category: 'xe_noi',
    ageRange: '1-3y',
    distance: '1.5 km',
    locationName: 'P. Hòa Cường Bắc, Q. Hải Châu, Đà Nẵng',
    wardId: 'hc_hoacuongbac',
    districtId: 'dn_haichau',
    timeAgo: '8 giờ trước',
    image: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&auto=format&fit=crop&q=80',
    description: 'Xe chòi chân nhựa đúc nguyên khối chịu lực 30kg, bánh xe chống trượt êm ái.',
    sellerId: 'seller_ngocanh',
    sellerName: 'Mẹ Ngọc Ánh',
    sellerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905345678',
    safeFeeLocked: 1,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'demo_prod_4',
    name: 'Bộ sách vải Lalala Baby 6 cuốn kích thích đa giác quan',
    price: 3,
    condition: '90',
    conditionLabel: 'Mới 90% (Rất mới)',
    category: 'sach_truyen',
    ageRange: '0-6m',
    distance: '2.1 km',
    locationName: 'P. An Hải Bắc, Q. Sơn Trà, Đà Nẵng',
    wardId: 'st_anhaibac',
    districtId: 'dn_sontra',
    timeAgo: '12 giờ trước',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    description: 'Sách vải có sột soạt, đuôi thú nổi 3D, bé gặm an toàn không độc hại.',
    sellerId: 'seller_daudau',
    sellerName: 'Mẹ Dâu Dâu',
    sellerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905456789',
    safeFeeLocked: 1,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'demo_prod_5',
    name: 'Ghế ăn dặm Hanbei gập gọn có bánh xe đa năng nâng hạ',
    price: 15,
    condition: '90',
    conditionLabel: 'Mới 90% (Rất mới)',
    category: 'xe_noi',
    ageRange: '6-12m',
    distance: '1.4 km',
    locationName: 'P. Vĩnh Trung, Q. Thanh Khê, Đà Nẵng',
    wardId: 'tk_vinhtrung',
    districtId: 'dn_thanhkhe',
    timeAgo: '16 giờ trước',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80',
    description: 'Ghế Hanbei chính hãng khay ăn kép tháo rời vệ sinh dễ dàng.',
    sellerId: 'seller_mebap',
    sellerName: 'Mẹ Bắp',
    sellerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905234567',
    safeFeeLocked: 2,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
  {
    id: 'demo_prod_6',
    name: '[Tặng 0 Xu] Set 5 bình sữa và túi trữ sữa mới chưa bóc tem',
    price: 0,
    condition: '90',
    conditionLabel: 'Mới 90% (Rất mới)',
    category: 'tu_thien',
    ageRange: '0-6m',
    distance: '0.9 km',
    locationName: 'P. Hòa Hải, Q. Ngũ Hành Sơn, Đà Nẵng',
    wardId: 'nhs_hoahai',
    districtId: 'dn_nguhanhson',
    timeAgo: '20 giờ trước',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop&q=80',
    description: 'Mình mua dư set bình sữa và túi trữ sữa nên gửi tặng 0 Xu cho mẹ nào chuẩn bị sinh bé nhé!',
    sellerId: 'seller_hoalan',
    sellerName: 'Mẹ Hoa Lan',
    sellerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    sellerPhone: '0905123456',
    safeFeeLocked: 0,
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
];

const initialState: HomeState = {
  products: FALLBACK_PRODUCTS,
  currentProductDetail: null,
  searchQuery: '',
  selectedCategory: 'all',
  selectedDistrict: 'all',
  selectedCondition: null,
  sortOrder: 'newest',
  isLoading: false,
  error: null,
};

// ---- Async Thunks ----

export const fetchProducts = createAsyncThunk(
  'home/fetchProducts',
  async (filters: productService.ProductFilters | undefined, { rejectWithValue }) => {
    try {
      const data = await productService.getProducts(filters);
      return data.products;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Không thể tải danh sách sản phẩm');
    }
  }
);

export const fetchProductDetail = createAsyncThunk(
  'home/fetchProductDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      const product = await productService.getProductById(id);
      return product;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Không thể tải chi tiết sản phẩm');
    }
  }
);

export const createProductAsync = createAsyncThunk(
  'home/createProductAsync',
  async (payload: productService.CreateProductPayload, { rejectWithValue }) => {
    try {
      const result = await productService.createProduct(payload);
      return result.product;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Đăng đồ không thành công');
    }
  }
);

export const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    setSelectedDistrict: (state, action: PayloadAction<string>) => {
      state.selectedDistrict = action.payload;
    },
    setSelectedCondition: (state, action: PayloadAction<string | null>) => {
      state.selectedCondition = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'newest' | 'closest' | 'price_asc' | 'price_desc'>) => {
      state.sortOrder = action.payload;
    },
    resetFilters: (state) => {
      state.searchQuery = '';
      state.selectedCategory = 'all';
      state.selectedDistrict = 'all';
      state.selectedCondition = null;
      state.sortOrder = 'newest';
    },
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.unshift(action.payload);
    },
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
    removeProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter(p => p.id !== action.payload);
    },
    updateProductStatus: (state, action: PayloadAction<{ id: string; status: Product['status'] }>) => {
      const prod = state.products.find(p => p.id === action.payload.id);
      if (prod) {
        prod.status = action.payload.status;
      }
    },
    hydrateProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    resetProducts: (state) => {
      state.products = [];
    },
  },
  extraReducers: (builder) => {
    // fetchProducts
    builder.addCase(fetchProducts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchProducts.fulfilled, (state, action) => {
      state.isLoading = false;
      state.products =
        action.payload && action.payload.length > 0 ? action.payload : FALLBACK_PRODUCTS;
    });
    builder.addCase(fetchProducts.rejected, (state, action) => {
      state.isLoading = false;
      if (state.products.length === 0) {
        state.products = FALLBACK_PRODUCTS;
      }
      state.error = (action.payload as string) || 'Lỗi tải sản phẩm';
    });

    // fetchProductDetail
    builder.addCase(fetchProductDetail.fulfilled, (state, action) => {
      state.currentProductDetail = action.payload;
    });
    builder.addCase(fetchProductDetail.rejected, (state, action) => {
      const found = state.products.find((p) => p.id === action.meta.arg);
      if (found) {
        state.currentProductDetail = found;
      }
    });

    // createProductAsync
    builder.addCase(createProductAsync.fulfilled, (state, action) => {
      state.products.unshift(action.payload);
    });
  },
});

export const {
  setSearchQuery,
  setSelectedCategory,
  setSelectedDistrict,
  setSelectedCondition,
  setSortOrder,
  resetFilters,
  addProduct,
  updateProduct,
  removeProduct,
  updateProductStatus,
  hydrateProducts,
  resetProducts,
} = homeSlice.actions;

export default homeSlice.reducer;
