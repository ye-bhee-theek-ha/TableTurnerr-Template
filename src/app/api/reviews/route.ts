// app/api/reviews/route.ts

import axios from 'axios';
import { NextResponse } from 'next/server'; // Import NextResponse for convenience

// Define the structure of the expected Google API response
interface GoogleReview {
  author_name: string;
  profile_photo_url: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
  author_url?: string;
}

interface PlaceDetailsResult {
  name: string;
  rating: number;
  reviews: GoogleReview[];
}

interface GooglePlacesApiResponse {
  result?: PlaceDetailsResult;
  status: string; // e.g., 'OK', 'ZERO_RESULTS', 'REQUEST_DENIED'
  error_message?: string; // Included on error statuses
  html_attributions?: string[];
}

// Define the structure of the success response body
type SuccessData = {
    reviews: GoogleReview[];
}

// Define the structure of the error response body
type ErrorData = {
    error: string;
}

// Export the GET handler function for the App Router
export async function GET(
  req: Request // Standard Web API Request object
): Promise<NextResponse<SuccessData | ErrorData>> { // Return type uses NextResponse

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID;

  // Validate environment variables
  if (!apiKey || !placeId) {
    console.error("API Key or Place ID is missing on the server.");
    return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
    );
  }

  const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&fields=name,rating,reviews&key=${apiKey}&language=en`;

  try {
    // Fetch data from Google Places API using axios
    const response = await axios.get<GooglePlacesApiResponse>(apiUrl);

    // Check the status from the Google API response
    if (response.data && response.data.status === 'OK' && response.data.result?.reviews) {
      // Sort reviews by time (most recent first)
      const sortedReviews = response.data.result.reviews.sort((a, b) => b.time - a.time);
      // Send the sorted reviews back to the client using NextResponse
      return NextResponse.json({ reviews: sortedReviews }); // Status 200 is default
    } else {
      // Handle errors reported by the Google API
      const status = response.data?.status || 'Unknown';
      const message = response.data?.error_message || 'Failed to fetch reviews from Google.';
      console.error("Google Places API Error:", status, message);
      return NextResponse.json(
          { error: `Failed to fetch reviews from Google. Status: ${status}` },
          { status: 500 } // Or map Google status codes to HTTP status codes if needed
      );
    }
  } catch (error: any) {
    // Handle network errors or other issues during the axios request
    console.error("Error fetching from Google API in server route:", error);
    if (axios.isAxiosError(error)) {
        // Log more details if available
        console.error("Axios error details:", error.response?.status, error.response?.data);
        const errorStatus = error.response?.status || 500;
        const errorMessage = error.response?.data?.error || error.message || "Server error fetching reviews";
        return NextResponse.json(
            { error: `Server error fetching reviews: ${errorMessage}` },
            { status: errorStatus }
        );
    } else {
        return NextResponse.json(
            { error: "An unexpected server error occurred." },
            { status: 500 }
        );
    }
  }
}
