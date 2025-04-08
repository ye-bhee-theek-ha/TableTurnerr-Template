import axios from 'axios'; // Using axios for convenience, but fetch works too

const apiClient = axios.create({
  baseURL: '/api', // Base URL for all API requests
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
});

// Optional: Add interceptors for centralized error handling or logging
apiClient.interceptors.response.use(
  (response) => response, // Simply return successful responses
  (error) => {
    // Handle errors globally if needed
    console.error('API call error:', error.response || error.message);
    // You could dispatch a global error action here
    // Ore-throw the error to be caught by the calling code (e.g., in thunks)
   
    if (error.response) {
      // If the error has a response, return it
      return Promise.reject(error.response.data);
    }
    
    // If the error doesn't have a response, return the error message

    return Promise.reject(error);
  }
);

export default apiClient;
