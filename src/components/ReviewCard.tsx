import React from 'react';
import Image from 'next/image';


interface ReviewCardProps {
  starCount: number;
  reviewText: string;
  reviewerName: string;
  profileImage: string;
}

const MAX_WORDS = 30;

const ReviewCard: React.FC<ReviewCardProps> = ({
  starCount,
  reviewText,
  reviewerName,
  profileImage
}) => {
  // Ensure star count is between 0 and 5
  const stars = Math.min(Math.max(0, starCount), 5);

  const [isExpanded, setIsExpanded] = React.useState(false);

    // Truncation logic
    const words = reviewText.split(' ');
    const isTruncated = words.length > MAX_WORDS;
    const displayedText = isExpanded ? reviewText : words.slice(0, MAX_WORDS).join(' ') + (isTruncated ? '...' : '');
  
    const toggleExpansion = (e: React.MouseEvent) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        setIsExpanded(!isExpanded);
    };
  
  
  return (
    <div className="flex flex-col items-start gap-3 p-[20px_30px] rounded-2xl bg-white shadow-[0px_0px_18px_0px_rgba(0,0,0,0.12)]">
      {/* Star Rating */}
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <span key={index} className="text-2xl">
            {index < stars ? "★" : ""}
          </span>
        ))}
      </div>
      
      {/* Review Text */}
      <p className="text-normal1 text-gray-800">
        {displayedText}
          {isTruncated && !isExpanded && (
            <button
              onClick={toggleExpansion}
              className="text-blue-600 hover:text-blue-800 text-normal3 font-semibold ml-1 cursor-pointer"
              aria-label="Read full review"
            >
              Read More
            </button>
          )}
          {isTruncated && isExpanded && (
            <button
              onClick={toggleExpansion}
              className="text-blue-600 hover:text-blue-800 text-normal3 font-semibold ml-1 cursor-pointer"
              aria-label="Show less text"
            >
              Show Less
            </button>
          )}      
        </p>

      
      {/* Reviewer Info */}
      <div className="flex items-center mt-auto  gap-2">
        {profileImage && (
          <div className="w-8 h-8 overflow-hidden rounded-full">
            <Image 
              src={profileImage}
              alt={`${reviewerName}'s profile`}
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        <span className="text-grey font-medium">{reviewerName}</span>
      </div>
    </div>
    
  );
};

export default ReviewCard;