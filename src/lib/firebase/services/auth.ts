import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
  linkWithCredential,
  User,
  deleteUser
} from 'firebase/auth';
import { auth } from '../ClientApp';
import { doc, setDoc, getDoc, arrayUnion, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../ClientApp';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

// Create a new user with email and password
export const createUser = async (email: string, password: string, displayName: string, phoneNumber: string) => {
  console.log("Creating user with email:", email, "and displayName:", displayName);
  try {
    // Check if phone number already exists
    const isPhoneUsed = await isPhoneNumberInUse(phoneNumber);
    if (isPhoneUsed) {
      throw new Error("This phone number is already registered with another account");
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Store initial user data
    await updateUserProfile(userCredential.user.uid, { 
      email, 
      displayName, 
      phoneNumber,
      phoneVerified: false, // Initially not verified
      createdAt: new Date(),
      loyaltyPoints: 0,
      role: 'customer',
      addresses: []
    });
    
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Check if phone number is already in use
export const isPhoneNumberInUse = async (phoneNumber: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("phoneNumber", "==", phoneNumber), where("phoneVerified", "==", true));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking if phone number is in use:", error);
    throw error;
  }
};

let recaptchaVerifierInstance: RecaptchaVerifier | null = null;

export const sendVerificationCode = async (phoneNumber: string) => {
  console.log("Sending verification code to phone number:", phoneNumber);
  try {
    // Always clean up any existing reCAPTCHA
    if (recaptchaVerifierInstance) {
      try {
        recaptchaVerifierInstance.clear();
      } catch (e) {
        console.log("Error clearing existing reCAPTCHA:", e);
      }
      recaptchaVerifierInstance = null;
    }
    
    // Clear the container's contents
    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (recaptchaContainer) {
      recaptchaContainer.innerHTML = '';
    }
    
    // Create a new div element for reCAPTCHA
    const newRecaptchaDiv = document.createElement('div');
    newRecaptchaDiv.id = 'recaptcha-container-' + Date.now(); // Unique ID
    
    // Replace the old container with the new one
    if (recaptchaContainer && recaptchaContainer.parentNode) {
      recaptchaContainer.parentNode.replaceChild(newRecaptchaDiv, recaptchaContainer);
    } else {
      const body = document.body;
      newRecaptchaDiv.style.display = 'none'; // Hide it
      body.appendChild(newRecaptchaDiv);
    }
    
    // Create a new reCAPTCHA verifier with the new element
    recaptchaVerifierInstance = new RecaptchaVerifier(auth, newRecaptchaDiv.id, {
      size: 'invisible',
      callback: (response: any) => {
        console.log("reCAPTCHA verified successfully:", response);
      },
    });
    
    // Render the reCAPTCHA
    await recaptchaVerifierInstance.render();
    console.log("reCAPTCHA verifier created successfully on element:", newRecaptchaDiv.id);
    
    // Send verification code
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierInstance);
    console.log("Verification code sent successfully to:", phoneNumber);
    
    return confirmationResult;
  } catch (error: any) {
    console.error("Error sending verification code:", error.message || error);
    throw new Error(`Failed to send verification code: ${error.message || "Unknown error"}`);
  }
};

export const clearRecaptchaVerifier = () => {
  if (recaptchaVerifierInstance) {
    try {
      recaptchaVerifierInstance.clear();
    } catch (e) {
      console.log("Error clearing reCAPTCHA:", e);
    }
    recaptchaVerifierInstance = null;
  }
  
  // Also clean up any reCAPTCHA containers
  document.querySelectorAll('[id^="recaptcha-container-"]').forEach(el => {
    el.remove();
  });
};

export const verifyPhoneNumber = async (
  verificationId: string, 
  verificationCode: string, 
  user: User
) => {
  console.log("Verifying phone number with verificationId:", verificationId, "and verificationCode:", verificationCode);
  try {
    // Check if phone number already exists and is verified
    const phoneNumber = user.phoneNumber;
    if (phoneNumber) {
      const isPhoneUsed = await isPhoneNumberInUse(phoneNumber);
      if (isPhoneUsed) {
        throw new Error("This phone number is already registered with another account");
      }
    }
    
    // Create phone auth credential
    const phoneCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
    
    // If user is already logged in, link the phone credential to their account
    if (user) {
      await linkWithCredential(user, phoneCredential);
      
      // Update user profile with phone number and verified flag
      await updateUserProfile(user.uid, { 
        phoneVerified: true, 
        phoneNumber: user.phoneNumber 
      });
      
      // Add user to restaurant's users array
      await addUserToRestaurant(user.uid);
      
      return user;
    }
    
    return null;
  } catch (error) {
    throw error;
  }
};

// Add user to restaurant's users array
export const addUserToRestaurant = async (userId: string) => {
  if (!RESTAURANT_ID) {
    console.error("Restaurant ID not found in environment variables");
    throw new Error("Restaurant ID not configured");
  }
  
  try {
    console.log("Adding user to restaurant's users array: ", userId, " for restaurant ID:", RESTAURANT_ID);

    const restaurantUsersRef = collection(db, 'Restaurants', RESTAURANT_ID, 'users');
    const userDocRef = doc(restaurantUsersRef, userId);
    await setDoc(userDocRef, { userId });

    // Also update the user document to reference the restaurant
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      restaurantId: RESTAURANT_ID
    });
    
    console.log(`User ${userId} successfully linked to restaurant ${RESTAURANT_ID}`);
    return true;
  } catch (error) {
    console.error("Error adding user to restaurant:", error);
    throw error;
  }
};

// Check if user belongs to the current restaurant
export const userBelongsToRestaurant = async (userId: string) => {
  if (!RESTAURANT_ID) {
    console.error("Restaurant ID not found in environment variables");
    throw new Error("Restaurant ID not configured");
  }
  
  try {
    const userDocRef = doc(db, 'restaurants', RESTAURANT_ID, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return true;
    }

    // TODO Add proper security rules to protect unauthorized deletions
    
    await deleteDoc(doc(db, 'restaurants', RESTAURANT_ID, 'users', userId));
    await deleteDoc(doc(db, 'users', userId));
    
    return false;
  } catch (error) {
    console.error("Error checking if user belongs to restaurant:", error);
    throw error;
  }
};

// Sign in with email and password with additional restaurant validation
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user profile to check phone verification status
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // If phone is verified, check if user belongs to the restaurant
      if (userData.phoneVerified) {
        const belongsToRestaurant = await userBelongsToRestaurant(user.uid);
        
        if (!belongsToRestaurant) {
          console.log("User not found in restaurant's users list. Deleting user account...");
          await deleteUser(user);
          throw new Error("Your account is not associated with this restaurant. Access denied.");
        }
      }
      // If phone is not verified, allow login regardless of restaurant association
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    throw error;
  }
};

// Update user profile in Firestore
export const updateUserProfile = async (userId: string, data: any) => {
  console.log("Updating user profile in Firestore:", userId, data);
  
  try {
    const userRef = doc(db, 'users', userId);
    
    // Check if user document exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing document
      await setDoc(userRef, data, { merge: true });
    } else {
      // Create new document
      await setDoc(userRef, {
        ...data,
        createdAt: new Date(),
        loyaltyPoints: 0,
        role: 'customer', // Default role
        addresses: []
      });
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return new Promise<User | null>((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};