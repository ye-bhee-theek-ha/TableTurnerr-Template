"use client";

import React, { use, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

import cart from '@/../public/Svgs/Cart icon.svg'
import UserProfile from './UserProfile';
interface AnimatedCTAButtonProps {
  onSignInClick: () => void;
  handelOrderNowClick?: () => void;
}

export const AnimatedCTAButton_LoggedOut:React.FC<AnimatedCTAButtonProps> = ({ onSignInClick, handelOrderNowClick }) => {
  const [hoveredButton, setHoveredButton] = useState<'left' | 'right' | null>(null);
  
  return (
    <div className="flex justify-center items-center w-[251px] h-[41px]">
      <div className="relative w-full max-w-lg h-full">
        {/* Left Button */}
        <motion.button
          className="absolute h-full rounded-l-lg overflow-hidden flex items-center border-2 bg-white border-primary"
          style={{ 
            originX: 1, 
            zIndex: hoveredButton === 'left' ? 10 : 5 
          }}
          animate={{
            width: hoveredButton === 'right' ? "10%" : "35%",
            left: hoveredButton === 'right' ? "35%" : "0%",
						borderTopRightRadius: hoveredButton === 'right' ? "8px" : "0px",
						borderBottomRightRadius: hoveredButton === 'right' ? "8px" : "0px"
          }}
          initial={{ width: "50%", left: "0%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onMouseEnter={() => setHoveredButton('left')}
          onMouseLeave={() => setHoveredButton(null)}
          onClick={onSignInClick}
        >
          <div className="flex items-center justify-between w-full">
						<motion.div className='overflow-hidden text-nowrap text-normal2 font-bold text-grey mx-auto'
							animate={{
								width: hoveredButton === 'right' ? "0%" : "100%",
								borderTopLeftRadius: hoveredButton === 'left' ? "8px" : "0px",
								borderBottomLeftRadius: hoveredButton === 'left' ? "8px" : "0px"
							}}
							initial={{ width: "100%", right: "0%" }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
						>
							Sign In
						</motion.div>
          </div>
        </motion.button>

        {/* Right Button */}
        <motion.button
          className="absolute h-full rounded-r-lg overflow-hidden flex items-center bg-primary"
          style={{ 
            originX: 0, 
            zIndex: hoveredButton === 'right' ? 10 : 5 
          }}
          animate={{
            width: hoveredButton === 'left' ? "18%" : "65%",
            right: hoveredButton === 'left' ? "50%" : "0%",
						borderTopLeftRadius: hoveredButton === 'right' ? "8px" : "0px",
						borderBottomLeftRadius: hoveredButton === 'right' ? "8px" : "0px"
          }}
          initial={{ width: "50%", right: "0%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onMouseEnter={() => setHoveredButton('right')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <div className="flex items-center justify-between w-full">
						<motion.div className='overflow-hidden text-nowrap text-normal2 font-bold text-white flex-1 mx-auto'
							animate={{
								width: hoveredButton === 'left' ? "0%" : "50%",
								borderTopLeftRadius: hoveredButton === 'right' ? "8px" : "0px",
								borderBottomLeftRadius: hoveredButton === 'right' ? "8px" : "0px"
							}}
							initial={{ width: "50%", right: "0%" }}
							transition={{ duration: 0.3, ease: "easeInOut" }}

              onClick={handelOrderNowClick}
						>
							Order Now
						</motion.div>
						<div className='flex justify-end m-[5px]'>
							<div className="w-[31px] h-[31px] bg-white/15 rounded-[7px] flex items-center justify-center">
								<svg className="w-6 h-6 text-white -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
								</svg>
							</div>
						</div>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export const AnimatedCTAButton_LoggedIn = ({cart_alerts, handelOrderNowClick}: {cart_alerts: number , handelOrderNowClick?:() => void}) => {
  
  return (
    <div className="flex justify-center items-center w-[471px] h-[41px]">
      <div className="relative w-full h-full flex flex-row">

        {/* Left Buttons */}
        <div className='flex flex-row items-center right-[50px] sm:right-[169px]'
          style={{
            position: "absolute",
          }}
        >
          <div className='h-full w-fit flex relative'>
            <Image
              src={cart}
              alt='cart icon'
              width={31}
              height={31}
              className='min-w-[31px]'
            />
            {cart_alerts > 0 && (
              <div className='bg-black rounded-full h-[18px] w-[18px] absolute top-[13px] -right-[7px] border-2 border-white'>
                <div className='text-white justify-center flex text-[10px] font-bold z-20'>
                  {cart_alerts}
                </div>
              </div>
            )}
          </div>

          <div className='h-full flex flex-1 ml-4'>
            <UserProfile />
          </div>
        </div>

        {/* Right Button */}
        <div
          className="absolute h-full rounded-lg overflow-hidden flex items-center bg-primary w-fit sm:w-[157px]"
          style={{ right: "0%" }}
        >
          <div className="flex items-center justify-between w-full ">
            <div 
              className='overflow-hidden text-nowrap text-normal2 font-bold text-white flex-1 text-center hidden sm:block'
              onClick={handelOrderNowClick}
            >
							Order Now
            </div>
						<div className='flex justify-end m-[5px]'>
							<div className="w-[31px] h-[31px] bg-white/15 rounded-[7px] flex items-center justify-center">
								<svg className="w-6 h-6 text-white -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
								</svg>
							</div>
						</div>
          </div>
        </div>
      </div>
    </div>
  );
};

