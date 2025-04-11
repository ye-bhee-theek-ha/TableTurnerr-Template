import Image from 'next/image';
import ReviewCard from './ReviewCard';
import pattern from "@/../public/Svgs/BG Pattern.svg";
import ThemeButton from './ThemeBtn';

const Reviews = () => {
  return (
    <div className="relative"
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
            <ReviewCard 
            starCount={5}
            reviewText="Rice noodles, tofu, Asian greens, carrots, cabbage and sliced white onion, lightly sprinkled with cilantro and green onion."
            reviewerName="Nikki S."
            profileImage="/images/avatars/nikki.jpg"
            />
            
            <ReviewCard 
            starCount={4}
            reviewText="Delicious vegetable curry with just the right amount of spice. Would order again!"
            reviewerName="Michael T."
            profileImage="/images/avatars/michael.jpg"
            />
            
            <ReviewCard 
            starCount={5}
            reviewText="The best pad thai I've had in years. Authentic flavors and generous portions."
            reviewerName="Sarah J."
            profileImage="/images/avatars/sarah.jpg"
            />
        </div>

        <div>
            <ThemeButton
                text='Give Us a Review'
                textClassname="pr-[8px] pl-[14px]"
                href='/'
            />
        </div>

    </div>
    </div>
  );
};

export default Reviews;