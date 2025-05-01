import Image from 'next/image';
import ReviewCard from './ReviewCard';
import pattern from "@/../public/Svgs/BG Pattern.svg";
import ThemeButton from './ThemeBtn';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Slider from 'react-slick';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";


    interface GoogleReview {
        author_name: string;
        profile_photo_url: string;
        rating: number;
        text: string;
        time: number;
        relative_time_description: string;
        author_url?: string;
    }

  
    interface ApiRouteResponse {
        reviews?: GoogleReview[];
        error?: string;
    }


    const Reviews = () => {

    const [reviews, setReviews] = useState<GoogleReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<String | null>(null);

    const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID;
    const reviewLink = `https://search.google.com/local/writereview?placeid=${placeId}`;
  
    useEffect(() => {
      const fetchReviewsFromApiRoute = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Fetch data from *your* Next.js API route
          const response = await axios.get<ApiRouteResponse>('/api/reviews');
          if (response.data && response.data.reviews) {
            setReviews(response.data.reviews);
          } else if (response.data && response.data.error) {
             console.error("Error from API route:", response.data.error);
             setError(response.data.error);
             setReviews([]);
          } else {
              // Handle unexpected structure from your API route
              console.error("Unexpected response structure from API route:", response.data);
              setError("Failed to load reviews due to unexpected server response.");
              setReviews([]);
          }
        } catch (err: any) {
          console.error("Error fetching reviews from API route:", err);
           if (axios.isAxiosError(err)) {
              // Error could be network to *your* server, or a 5xx error from your API route handler
              setError(`Error loading reviews: ${err.response?.data?.error || err.message}`);
           } else {
              setError("An unexpected error occurred while loading reviews.");
           }
           setReviews([]);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchReviewsFromApiRoute();
    }, []);
    
    const sliderSettings = {
        dots: true,
        infinite: false, 
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1, 
        arrows: true,
        responsive: [
          {
            breakpoint: 1024, 
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
              infinite: false,
              dots: true
            }
          },
          {
            breakpoint: 640,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              infinite: false,
              dots: true,
              arrows: false
            }
          }
        ]
      };

  return (
    <div className="relative h-full"
        style={{
        overflow: "hidden",
        minHeight: '644px',
        alignSelf: "stretch",
        borderRadius: "36px",
        background: "var(--Site-Black-10, rgba(13, 13, 13, 0.10))",
        }}
    >
        <div className="absolute h-full w-full">
        <Image
            src={pattern}
            alt="bg pattern"
            fill
            className="object-cover -z-20"
        />
        </div>
        
        <div
        style={{
            display: 'flex',
            width: '',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '42px',
            padding: '76px 52px',
        }}
        >

        <div>
            <div className="text-h2 w-full text-center font-medium">
            What our customers are
            <br />
            saying
            </div>

            <div className="text-normal1 w-full text-center font-medium mt-[20px]">
            Check out our most recent reviews!
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        </div>

        {/* Reviews Grid - Conditional Rendering */}
        <div className="w-full max-w-6xl">
          {isLoading && <p className="text-center">Loading reviews...</p>}
          {error && <p className="text-center text-red-600">{error}</p>}
          {!isLoading && !error && reviews.length === 0 && (
             <p className="text-center">No reviews available at the moment.</p>
          )}
          {!isLoading && !error && reviews.length > 0 && (
            <Slider {...sliderSettings} className="mx-[-10px]"> {/* Added negative margin */}
            {reviews.map((review) => (
              // Add padding to the slide element itself
              <div key={review.author_url || `${review.author_name}-${review.time}`} className="px-[10px] h-full">
                <ReviewCard
                  starCount={review.rating}
                  reviewText={review.text}
                  reviewerName={review.author_name}
                  profileImage={review.profile_photo_url}
                />
              </div>
            ))}
          </Slider>
          )}
        </div>

        <div>
            <ThemeButton
                text='Give Us a Review'
                textClassname="pr-[8px] pl-[14px]"
                href='/'
            />
        </div>

    </div>
    <style jsx global>{`
        .slick-prev, .slick-next {
          z-index: 1;
          height: 40px;
          width: 40px;
        }
        .slick-prev:before, .slick-next:before {
          font-size: 30px;
          color: #621E21;
          opacity: 0.5;
        }
        .slick-prev:hover:before, .slick-next:hover:before {
           opacity: 1;
        }
        .slick-prev {
          left: -35px; /* Adjust position */
        }
        .slick-next {
          right: -35px; /* Adjust position */
        }
         @media (max-width: 640px) {
           .slick-prev, .slick-next {
             display: none !important; /* Hide arrows on small screens as configured */
           }
         }

        .slick-dots {
          bottom: -40px;
          color: #621E21;
        }

         /* Ensure slides display correctly - Check this in dev tools if issue persists */
        .slick-slide {
           display: inline-block; /* Default slick style, ensure it's not overridden */
           vertical-align: middle;
         }
        .slick-slide > div {
           margin: 0 10px;
         }
        .slick-list {
            margin: 0 -10px; /* Counteract slide margin */
        }

         .slick-track {
            display: flex;
            align-items: stretch; 
         }
         .slick-slide > div {
             height: 100%; 
             display: flex; 
         }
         .slick-slide > div > * {
             flex: 1 1 auto; 
             height: 100%; 
         }


      `}</style>
    </div>
  );
};

export default Reviews;