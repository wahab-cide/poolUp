import { create } from 'zustand';
import { fetchAPI } from '@/lib/fetch';

export interface Crew {
  id: string;
  name: string;
  description: string | null;
  routeOrigin: string;
  routeDestination: string;
  routeOriginLat?: number;
  routeOriginLng?: number;
  routeDestLat?: number;
  routeDestLng?: number;
  memberCount: number;
  isPublic: boolean;
  collegeName?: string | null;
  collegeId?: string | null;
  createdBy: string;
  createdAt: string;
  isMember?: boolean;
  isAdmin?: boolean;
}

export interface CrewMember {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface CreateCrewParams {
  name: string;
  description?: string;
  routeOrigin: string;
  routeDestination: string;
  routeOriginLat: number;
  routeOriginLng: number;
  routeDestLat: number;
  routeDestLng: number;
  isPublic: boolean;
  collegeId?: string;
}

interface CrewStore {
  // State
  myCrews: Crew[];
  publicCrews: Crew[];
  selectedCrew: Crew | null;
  crewMembers: CrewMember[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMyCrews: (userId: string) => Promise<void>;
  fetchPublicCrews: (collegeId?: string) => Promise<void>;
  fetchCrewDetails: (crewId: string) => Promise<void>;
  createCrew: (params: CreateCrewParams, userId: string) => Promise<Crew | null>;
  joinCrew: (crewId: string, userId: string) => Promise<boolean>;
  leaveCrew: (crewId: string, userId: string) => Promise<boolean>;
  clearSelectedCrew: () => void;
  clearError: () => void;
}

export const useCrewStore = create<CrewStore>((set, get) => ({
  // Initial state
  myCrews: [],
  publicCrews: [],
  selectedCrew: null,
  crewMembers: [],
  isLoading: false,
  error: null,

  // Fetch user's joined crews
  fetchMyCrews: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchAPI(`/api/crews/my-crews?user_id=${userId}`);

      if (data.success) {
        set({ myCrews: data.crews, isLoading: false });
      } else {
        set({ error: data.message || 'Failed to fetch crews', isLoading: false });
      }
    } catch (error) {
      if (__DEV__) console.error('Error fetching my crews:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch crews',
        isLoading: false
      });
    }
  },

  // Fetch public crews
  fetchPublicCrews: async (collegeId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams({
        limit: '20',
        ...(collegeId && { college_id: collegeId })
      });

      const data = await fetchAPI(`/api/crews/public?${params.toString()}`);

      if (data.success) {
        set({ publicCrews: data.crews, isLoading: false });
      } else {
        set({ error: data.message || 'Failed to fetch crews', isLoading: false });
      }
    } catch (error) {
      if (__DEV__) console.error('Error fetching public crews:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch crews',
        isLoading: false
      });
    }
  },

  // Fetch crew details
  fetchCrewDetails: async (crewId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchAPI(`/api/crews/${crewId}`);

      if (data.success) {
        set({
          selectedCrew: data.crew,
          crewMembers: data.members || [],
          isLoading: false
        });
      } else {
        set({ error: data.message || 'Failed to fetch crew details', isLoading: false });
      }
    } catch (error) {
      if (__DEV__) console.error('Error fetching crew details:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch crew details',
        isLoading: false
      });
    }
  },

  // Create new crew
  createCrew: async (params: CreateCrewParams, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchAPI('/api/crews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, user_id: userId })
      });

      if (data.success) {
        // Refresh my crews list
        await get().fetchMyCrews(userId);
        set({ isLoading: false });
        return data.crew;
      } else {
        set({ error: data.message || 'Failed to create crew', isLoading: false });
        return null;
      }
    } catch (error) {
      if (__DEV__) console.error('Error creating crew:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create crew',
        isLoading: false
      });
      return null;
    }
  },

  // Join a crew
  joinCrew: async (crewId: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchAPI(`/api/crews/${crewId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      if (data.success) {
        // Refresh both lists
        await get().fetchMyCrews(userId);
        await get().fetchCrewDetails(crewId);
        set({ isLoading: false });
        return true;
      } else {
        set({ error: data.message || 'Failed to join crew', isLoading: false });
        return false;
      }
    } catch (error) {
      if (__DEV__) console.error('Error joining crew:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to join crew',
        isLoading: false
      });
      return false;
    }
  },

  // Leave a crew
  leaveCrew: async (crewId: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchAPI(`/api/crews/${crewId}/leave`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      if (data.success) {
        // Refresh my crews list
        await get().fetchMyCrews(userId);
        set({ isLoading: false });
        return true;
      } else {
        set({ error: data.message || 'Failed to leave crew', isLoading: false });
        return false;
      }
    } catch (error) {
      if (__DEV__) console.error('Error leaving crew:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to leave crew',
        isLoading: false
      });
      return false;
    }
  },

  // Clear selected crew
  clearSelectedCrew: () => set({ selectedCrew: null, crewMembers: [] }),

  // Clear error
  clearError: () => set({ error: null }),
}));
