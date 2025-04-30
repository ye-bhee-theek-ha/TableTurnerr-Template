"use client";

import { div } from 'framer-motion/client';
import React from 'react'

import Image from 'next/image';

import arrow from '@/../public/Svgs/Arrow.svg';
import ScrollableMenuCards from './Home_menu_card';

import placeholderImg from "@/../public/Images/Product img 1.png";
import { useDispatch, useSelector } from 'react-redux';
import { selectPopularItems } from '@/lib/slices/restaurantSlice';
import { AppDispatch, RootState } from '@/lib/store/store';
import { CartItemOptions, MenuItem } from '@/constants/types';
import { addItem } from '@/lib/slices/cartSlice';


export default function Home_menu_section() {

  const dispatch = useDispatch<AppDispatch>();
  const popularItems = useSelector(selectPopularItems);

  const handleAddToCart = (item: MenuItem, quantity: number = 1, options: CartItemOptions = {}) => {
    console.log(`Adding item ${item.id} to cart with options:`, options);
    dispatch(addItem({ item, quantity, options }));
  };
  
    const handleToggleFavorite = (itemId: string) => {
      console.log(`Toggled favorite for item ${itemId}`);
      // TODO: call to backend
    };
  
    const handleReadMore = (itemId: string) => {
      console.log(`Read more about item ${itemId}`);
      // TODO: call to backend
    };


  return (
    <div className='w-full h-[510px] rounded-l-[12px] bg-primary-dark flex flex-row p-[20px]'>
			
			<div className='h-full flex px-[8px] py-[26px] flex-col'>
				<div className='text-h3 text-white text-start leading-[1.2]'>
					Trending
					<br />
					Taiwanese
					<br />
					cusine
				</div>
				<div className='text-white/50 text-normal1 mt-[5px]'>
					Treat yourself to our must-try list that has everyone talking.
				</div>

				<div className='flex-1'/>
				
				<div className='text-normal3 text-white'>
					Scroll through to explore our dishes.
				</div>
				<div className=''>
					<Image
						src={arrow}
						alt="Arrow"
						className="w-[24px] h-[24px] mt-[10px] cursor-pointer"
					/>
				</div>
			</div>

			<div className='overflow-x-hidden'>
				<ScrollableMenuCards
					items={popularItems}
					onAddToCart={handleAddToCart}
					onToggleFavorite={handleToggleFavorite}
					onReadMore={handleReadMore}
				/>
			</div>
    </div>
)
}
