// src/features/grade/store/ratingSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Rating } from '../../../types/rating';

interface RatingState {
  ratings: Rating[];
}

const initialState: RatingState = {
  ratings: [],
};

const ratingSlice = createSlice({
  name: 'rating',
  initialState,
  reducers: {
    submitRating: (state, action: PayloadAction<Omit<Rating, 'id' | 'createdAt'>>) => {
      const newRating: Rating = {
        ...action.payload,
        id: 'rate_' + Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
      };
      state.ratings.unshift(newRating);
    },
  },
});

export const { submitRating } = ratingSlice.actions;
export default ratingSlice.reducer;
