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

const initialState: HomeState = {
  products: [],
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
      state.products = action.payload || [];
    });
    builder.addCase(fetchProducts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || 'Lỗi tải sản phẩm';
    });

    // fetchProductDetail
    builder.addCase(fetchProductDetail.fulfilled, (state, action) => {
      state.currentProductDetail = action.payload;
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
