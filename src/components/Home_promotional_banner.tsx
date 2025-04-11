import React from 'react';
import Image from 'next/image';

interface PromotionalBannerProps {
  image: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
}

import placeholderImg from "@/../public/Images/Product img 2.png";
import ThemeButton from './ThemeBtn';


const PromotionalBanner: React.FC<PromotionalBannerProps> = ({
  image,
  title,
  description,
  buttonText,
  buttonUrl
}) => {
  return (
    <div className="relative w-full h-[664px] p-[42px] rounded-lg overflow-hidden"
        style={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '10px',
            alignSelf: 'stretch',
        }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image 
          src={placeholderImg}
          alt="Promotional background"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      {/* Content Overlay */}
      <div className="w-fit h-full"
        style={{
            display: "flex",
            paddingInline: "50px",
						padding: "114px 50px",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "10px",
            flex: "1 0 0",
            borderRadius: "28px",
            background: "var(--Site-Black-25, rgba(13, 13, 13, 0.25))",
            backdropFilter: "blur(13px)"
        }}
      >
				<div
					style={{
						display: "flex",
						width: '548px',
						flexDirection: 'column',
						alignItems: 'flex-start',
						gap: '28px',
					}}
				>

					<h2 className="text-h2 font-medium text-white w-[70%]">{title}</h2>
					
					<p className="text-white/65 text-normal1">
						{description}
					</p>
					
					<ThemeButton
            href='/MenuPage'
          />

				</div>
      </div>
    </div>
  );
};

export default PromotionalBanner;