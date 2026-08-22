// src/app/providers/AuthProvider.tsx
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  loginUser,
  registerUser,
  adjustCivilizationPoints,
  fetchCurrentUser,
  loginAsync,
  loginGoogleAsync,
  registerAsync,
  logoutAsync,
} from '../../features/auth/store/authSlice';
import { User } from '../../types/user';
import { socketService } from '../../services/socketService';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  error: string | null;
  login: (userId: string) => void;
  loginWithCredentials: (phone: string, password: string) => Promise<any>;
  loginWithGoogle: (googleData: { credential?: string; idToken?: string; email?: string; name?: string; avatar?: string; googleId?: string }) => Promise<any>;
  register: (name: string, phone: string, email: string, districtId: string, addressDetail: string) => void;
  registerWithCredentials: (payload: { name: string; phone: string; password: string; email?: string; districtId?: string; districtName?: string; addressDetail?: string }) => Promise<any>;
  logout: () => Promise<void>;
  rewardCivilizationPoints: (userId: string, points: number, reason: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const allUsers = useAppSelector((state) => state.auth.allUsers);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const error = useAppSelector((state) => state.auth.error);

  // Check current session & auto-connect Socket on mount
  useEffect(() => {
    dispatch(fetchCurrentUser())
      .unwrap()
      .then(() => {
        socketService.connect();
      })
      .catch(() => {
        // Fallback: If local demo user is present, socket connects if token is stored
      });
  }, [dispatch]);

  const login = (userId: string) => {
    dispatch(loginUser(userId));
  };

  const loginWithCredentials = async (phone: string, password: string) => {
    return dispatch(loginAsync({ phone, password })).unwrap();
  };

  const loginWithGoogle = async (googleData: { credential?: string; idToken?: string; email?: string; name?: string; avatar?: string; googleId?: string }) => {
    return dispatch(loginGoogleAsync(googleData)).unwrap();
  };

  const registerWithCredentials = async (payload: {
    name: string;
    phone: string;
    password: string;
    email?: string;
    districtId?: string;
    districtName?: string;
    addressDetail?: string;
  }) => {
    return dispatch(registerAsync(payload)).unwrap();
  };

  const logout = async () => {
    await dispatch(logoutAsync()).unwrap();
  };

  const register = (name: string, phone: string, email: string, districtId: string, addressDetail: string) => {
    const districtName =
      districtId === 'hc' ? 'Quận Hải Châu' :
      districtId === 'tk' ? 'Quận Thanh Khê' :
      districtId === 'st' ? 'Quận Sơn Trà' :
      districtId === 'nhs' ? 'Quận Ngũ Hành Sơn' :
      districtId === 'lc' ? 'Quận Liên Chiểu' :
      districtId === 'cl' ? 'Quận Cẩm Lệ' : 'Huyện Hòa Vang';

    dispatch(
      registerUser({
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        name,
        phone,
        email,
        avatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuB6-3G4y5VT09QB_r93FRE4nbSeWA2JCI990UQ9fhsMbTpZwuWK7kzxF-aQr9sJydki3zE-zHuMhzYGrY8mkFtwUsUVYdsl1VZ1q8GRLxjB_GPiS-ULsQ8QKCz05f5wl8frZsErROB6ZrZQ4vv7ZYc3a3Vgb3rNTd-HotoTrX_2k0ha0Ih0KDR1q3HIBr-l94ZD99yk-sFPH_0k1BTd4EESpggGMyGmtGLgewt3DOhn5A1GTNDMgPQ7Q210FABw-JPNZnKZaau1gozw',
        location: {
          districtId,
          districtName,
          addressDetail,
        },
      })
    );
  };

  const rewardCivilizationPoints = (userId: string, points: number, reason: string) => {
    dispatch(adjustCivilizationPoints({ userId, points, reason }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        error,
        login,
        loginWithCredentials,
        loginWithGoogle,
        register,
        registerWithCredentials,
        logout,
        rewardCivilizationPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
