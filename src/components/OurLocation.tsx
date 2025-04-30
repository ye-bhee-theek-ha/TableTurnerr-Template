// location component

"use client";

import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
import { RootState } from '@/lib/store/store';


const LocationComponent = () => {

  const restaurantData = useSelector((state: RootState) => state.restaurant.info);

  console.log(restaurantData)

  // return (
  //   <div className="mx-[70px]">
  //     <h2 className="text-h2 mb-[32px]">Our Location</h2>
  //     {loadingPriority}
  //     <br />
  //     <div className='w-full h-5 my-6 bg-alert-green'></div>

  //     {restaurantData ? JSON.stringify(restaurantData) : 'No restaurant data available'}
  //     <br />
  //     <div className='w-full h-5 my-6 bg-alert-green'></div>


  //     <div className='text-h2 mb-[32px] bg-amber-200'>
  //       popular items:
  //     </div>

  //     {popularItems ? JSON.stringify(popularItems) : 'No popular items available'}
  //     <br />
  //     <div className='w-full h-5 my-6 bg-alert-green'></div>

  //     <div className='text-h2 mb-[32px] bg-amber-200'>
  //       menu items:
  //     </div>

  //     {popularItems ? JSON.stringify(MenuItems) : 'No popular items available'}
  //     <br />
  //     <div className='w-full h-5 my-6 bg-alert-green'></div>

  //     {categories ? JSON.stringify(categories) : 'No categories available'}
  //     <br />
  //     <div className='w-full h-5 my-6 bg-alert-green'></div>

  //     {isLoading? JSON.stringify(isLoading) : 'No loading state available'}
  //   </div>
  // );

  if (!restaurantData) return;

  const resturantInfo = restaurantData.info;
  const address = restaurantData.address;

  // Create the Google Maps embed URL
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  
  return (
    <div className="mx-[70px]">
      <h2 className="text-h2 mb-[32px]">Our Location</h2>
      
      <div className="relative">
        {/* Map Container */}
        <div className="w-full h-[400px] rounded-[14px] overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              id="gmap_canvas"
              src={mapUrl}
              aria-label={`Map showing location of ${resturantInfo.location}`}
            ></iframe>
        </div>

        {/* Overlay Container */}
        <div className="absolute inset-0 z-20 p-[16px] flex flex-wrap pointer-events-none justify-between">
        
          <div className='flex flex-col gap-2'>
            <div className="flex flex-col h-fit w-[264px] px-[24px] py-[21px] items-start gap-[10px] self-stretch rounded-[30px] border-white/25 border bg-white/40 shadow-black/15 shadow-[6px] backdrop-blur-[14px]">
                <div>
                    {resturantInfo.name && <div className="text-normal2 font-medium text-black/50">{resturantInfo.name}</div>}
                    <p className="text-normal2 font-medium text-black">{resturantInfo.location}</p>
                </div>
                  {/* TODO add nav links here */}
                <div className='w-full'>
                    <button className='h-[25px] text-normal3 text-black/50 w-full flex items-center justify-center bg-black/10 rounded-full'>
                        Contact
                    </button>
                </div>

                <div className='w-full'>
                    <button className='h-[25px] w-full flex items-center justify-center bg-primary rounded-full text-white'>
                        Directions
                    </button>
                </div>
            </div>
						{(address || resturantInfo.contact?.phone || resturantInfo.contact?.email) && (
							<div className="flex flex-col h-fit w-[220px] px-[24px] py-[21px] items-start gap-[10px] self-stretch rounded-[30px] border-white/25 border bg-white/40 shadow-black/15 shadow-[6px] backdrop-blur-[14px]">
									<div>
										{address && 
										<>
											<div className='text-normal4 text-black/50'>
													Address
											</div>
											<div className='text-normal4 text-black leading-[24px] mb-[10px]'>
												{address}
											</div>
										</>
										}

										{resturantInfo.contact?.phone && resturantInfo.contact?.email &&
										<>
											<div className='text-normal4 text-black/50'>
													Contact
											</div>
											<div className='text-normal4 text-black leading-[24px]'>
												{resturantInfo.contact?.phone}
												<br />
												{resturantInfo.contact?.email}
											</div>
										</>
										}
									</div>
							</div>
						)}
          </div>
          


          <div className="flex flex-col h-fit w-[264px] px-[24px] py-[21px] items-end gap-[10px] self-stretch rounded-[30px] border-white/25 border bg-white/40 shadow-black/15 shadow-[6px] backdrop-blur-[14px]">
            {resturantInfo.OpeningTime && (
              <div className="w-full">
                <p className="text-normal4 font-medium">Opens at {resturantInfo.OpeningTime}</p>
              </div>
            )}
            
            {resturantInfo.openingHours && resturantInfo.openingHours.length > 0 && (
              <div className="w-full">
                <h4 className="text-normal4 font-medium text-center text-gray-600 mb-2">Timings</h4>
                <div className="">
                  {resturantInfo.openingHours.map((item, index) => (
                    <React.Fragment key={index}>
											<div className='w-full flex items-center justify-between'>
												<p className="text-normal4 text-black/60">{item.day}</p>
												<p className="text-normal4 text-black/60">{item.timing}</p>
											</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationComponent;