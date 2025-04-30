import React from 'react';
import Image from 'next/image';

import placeholderImg from "@/../public/Images/menu.png";
import { CartItemOptions, MenuItem } from '@/constants/types';

// Define types
interface ScrollableMenuCardsProps {
  items: MenuItem[];
  onAddToCart : (item: MenuItem, quantity: number, options: CartItemOptions) => void
  onToggleFavorite: (itemId: string) => void;
  onReadMore: (itemId: string) => void;
}

const ScrollableMenuCards: React.FC<ScrollableMenuCardsProps> = ({
  items,
  onAddToCart,
  onToggleFavorite,
  onReadMore
}) => {


  console.log(items, "items in scrollable menu cards")

  return (
    <div className="w-full bg-primary-dark text-white px-6 pt-3 pb-0">


      {/* Scrollable Cards Section */}
      <div className="flex overflow-x-auto gap-4 scrollbar-hide">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="w-[386px] text-black rounded-[12px] overflow-hidden flex-shrink-0"
          >
            {/* Card Image */}
            <div className="relative h-[240px] w-full">
              <Image 
                src={placeholderImg}
                alt={item.name}
                fill
                className="object-cover"
              />

              {/* Favorite Button */}
              <button 
                onClick={() => onToggleFavorite(item.id)}
                className="absolute top-2 right-2 bg-white/80 rounded-full p-1"
              >
                {item.isFavorite? "★" : "☆"}
              </button>
            </div>

            {/* Card Content */}
            <div className="mt-[-12px] z-10 relative bg-white rounded-[12px] px-[16px]">
              <div className="text-h5 font-bold">{item.name}</div>
              
              {/* Price and Points */}
              <div className="flex mt-1 items-center">
                <span className="text-normal4 text-primary-dark font-bold">{item.price}</span>
                <div className='h-1 w-1 bg-black/40 rounded-full m-[6.5px]'></div>
                
                {/* { item.priceL && item.priceL > 0 && item.priceM !== item.priceL &&
                  <>
                    <span className="text-normal4 text-primary-dark font-bold">$ {item.priceL.toFixed(2)}</span>
                    <div className='h-1 w-1 bg-black/40 rounded-full m-[6.5px]'/>
                  </>
                } */}
                <span className="text-normal4 text-primary items-center">+ {item.loyaltyPoints} points</span>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {item.tags.map((tag, idx) => {
                 
                  return (
                    <span 
                      key={idx} 
                      className={`text-normal4 px-[12px] py-[3px] rounded-full bg-black/[0.03] text-black/50`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
              
              {/* Buttons */}
              <div className="pb-4 mt-[10px] flex flex-col gap-2">
                <button 
                  onClick={() => onReadMore(item.id)}
                  className="text-normal3 text-black/50 text-center bg-black/5 h-[31px] rounded-full"
                >
                  Read More
                </button>

                <button 
                  onClick={() => onAddToCart(item, 1, {})}
                  className="text-normal3 font-bold text-white text-center bg-primary h-[31px] rounded-full"
                >
                  Add To Cart
                </button>

              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>
        {`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;     /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;             /* Chrome, Safari and Opera */
        }
      `}
      </style>

    </div>
  );
};

export default ScrollableMenuCards;