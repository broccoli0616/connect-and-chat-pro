export interface UserProfile {
  name: string;
  age: string;
  role: "learner" | "caregiver" | "therapist";
  createdAt: string;
}

const PROFILE_KEY = "commpractice_profile";

export const saveProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getProfile = (): UserProfile | null => {
  const data = localStorage.getItem(PROFILE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as UserProfile;
  } catch {
    return null;
  }
};

export const clearProfile = () => {
  localStorage.removeItem(PROFILE_KEY);
};
