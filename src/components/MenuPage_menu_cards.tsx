import React from 'react';
import Image from 'next/image';
import placeholderImg from "@/../public/Images/menu.png";
import { CartItemOptions, MenuItem } from '@/constants/types';

// Define types

interface MenuCardsProps {
  title: string;
  items: MenuItem[];
  onAddToCart: (item: MenuItem, quantity: number, options: CartItemOptions) => void;
  onToggleFavorite: (itemId: string) => void;
  onReadMore: (itemId: string) => void;
}

const MenuCards: React.FC<MenuCardsProps> = ({
  title,
  items,
  onAddToCart,
  onToggleFavorite,
  onReadMore
}) => {
  return (
    <div className="w-full bg-white">
      <h2 className="text-h4 text-black mb-[20px]">{title}</h2>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 ml-[10px] gap-[10px]">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="flex flex-row min-h-[210px] rounded-[12px] border border-black/[0.03] bg-black/[0.01] hover:bg-black/[0.03] transition-colors"
            style={{
              padding: '12px 16px 16px 12px',
            }}
          >
            {/* Item Image */}
            <div className="relative h-32 w-32 rounded-[12px] overflow-hidden flex-shrink-0">
              <Image 
                src={placeholderImg}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Item Content */}
            <div className="flex flex-col flex-grow pl-[10px] gap-y-[10px]">
              <div>
                {/* Title and Favorite */}
                <div className="flex justify-between items-center">
                  <div className="text-h5 font-bold">{item.name}</div>
                  <button 
                    onClick={() => onToggleFavorite(item.id)}
                    aria-label="Toggle favorite"
                    className='text-h5 text-primary'
                  >
                    {item.isFavorite? "★" : "☆"}
                  </button>
                </div>

                {/* Price and Points */}
                <div className="flex mt-[2px] items-center">
                  <span className="text-normal4 text-primary-dark font-bold">{item.price}</span>
                  <div className='h-1 w-1 bg-black/40 rounded-full m-[5px]'></div>
                  
                  {/* { item.priceL && item.priceL > 0 && item.priceM !== item.priceL &&
                    <>
                      <span className="text-normal4 text-primary-dark font-bold">$ {item.priceL.toFixed(2)}</span>
                      <div className='h-1 w-1 bg-black/40 rounded-full m-[5px]'/>
                    </>
                  } */}
                  <span className="text-normal4 text-primary items-center">+ {item.loyaltyPoints} points</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-[2px]">
                {item.tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="text-normal4 px-[16px] py-1 bg-gray-100 text-black/50 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <p className="text-normal4 text-black/50 ">
                {item.description}
              </p>
                

              {/* Action Buttons */}
              <div className='flex flex-1 items-end'>
                <div className="flex gap-[5px] min-h-[30px] h-fit w-full">
                  <button 
                    onClick={() => onReadMore(item.id)}
                    className="text-normal3 text-black/50 bg-black/[0.03] hover:bg-black/[0.05] py-[6px] px-[5px] rounded-br-[0px] rounded-[14px] w-[calc(50%-2.5px)]"
                  >
                    Read More
                  </button>

                  <button 
                    onClick={() => onAddToCart(item, 1, {})}
                    className="text-normal3 text-white/80 bg-primary hover:bg-primary/90 py-[6px] px-[5px] rounded-tl-[0px] rounded-[14px] w-[calc(50%-2.5px)] "
                  >
                    Add To Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuCards;