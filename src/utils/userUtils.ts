import { User, findUserById } from '@/lib/mockData';

/**
 * Safely extract a user from a User | User[] | null type
 * Returns the user object if it's a single user, or null otherwise
 */
export const getSingleUser = (user: User | User[] | null): User | null => {
  if (!user) return null;
  if (Array.isArray(user)) return null;
  return user;
};

/**
 * Safely access a property on a User | User[] | null type
 * Returns the property value if it's a single user with that property, or fallback value otherwise
 */
export function getUserProperty<K extends keyof User>(
  user: User | User[] | null, 
  property: K, 
  fallback: User[K]
): User[K] {
  if (!user) return fallback;
  if (Array.isArray(user)) return fallback;
  return user[property] ?? fallback;
}

/**
 * Utility to safely render user name from User | User[] | null
 */
export const getUserName = (user: User | User[] | null, fallback: string = 'Patient Name'): string => {
  // Handle case when user might be a string ID
  if (typeof user === 'string') {
    try {
      const foundUser = findUserById(user);
      if (foundUser && !Array.isArray(foundUser)) {
        return foundUser.name || fallback;
      }
    } catch (error) {
      console.error('Error finding user by ID:', error);
    }
  }
  
  // Handle direct User object
  if (user && !Array.isArray(user)) {
    // Check all possible name fields
    if (user.name) return user.name;
    if (user.fullName) return user.fullName;
    if (user.full_name) return user.full_name;
  }
  
  return fallback;
};

/**
 * Utility to safely render user ID from User | User[] | null
 */
export const getUserId = (user: User | User[] | null, fallback: string = ''): string => {
  return getUserProperty(user, 'id', fallback);
};

/**
 * Utility to safely render wallet address from User | User[] | null
 */
export const getUserWalletAddress = (user: User | User[] | null, fallback: string = ''): string => {
  return getUserProperty(user, 'walletAddress', fallback);
};

/**
 * Safely get a user by ID from the mock data
 * Returns the user if found, null otherwise
 */
export const safeGetUserById = (userId: string): User | null => {
  try {
    if (!userId) return null;
    const user = findUserById(userId);
    return getSingleUser(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
};
