// MenuPage_menu_section.tsx

"use client";

import MenuCards from '@/components/MenuPage_menu_cards';
import { CartItemOptions, MenuItem } from '@/constants/types';
import { selectAllMenuItems, selectCategories  } from '@/lib/slices/restaurantSlice';
import { AppDispatch, RootState } from '@/lib/store/store';
import { group } from 'console';
import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ProductBox from './MenuPage_product_box';
import { addItem } from '@/lib/slices/cartSlice';

function MenuPage_Menu_Section() {
  const menuItems = useSelector(selectAllMenuItems);
  const categories = useSelector(selectCategories);
  const isLoading = useSelector((state: RootState) => state.restaurant.loading);

  const dispatch = useDispatch<AppDispatch>();

  const [activeCategory, setActiveCategory] = React.useState('');

  // State to control the ProductBox modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);


  // Refs for category sections using a mutable object
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Callback ref setter function
  const setSectionRef = useCallback((categoryName: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[categoryName] = el;
  }, []);

  // to observe current category section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const name = entry.target.getAttribute('data-category');
            if (name) setActiveCategory(name);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.6, // section is active when 60% in view
      }
    );
  
    // Observe each section
    Object.entries(sectionRefs.current).forEach(([key, el]) => {
      if (el) observer.observe(el);
    });
  
    return () => observer.disconnect();
  }, []);

  // Scroll to category section
  const scrollToSection = useCallback((categoryName: string) => {
    const element = sectionRefs.current[categoryName];
    console.log("scrollToSection - categoryName:", categoryName, "element:", element);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Group menu items by category name
  const itemsByCategory = useMemo(() => {
    if (!menuItems || !categories) return {};
    const grouped: { [key: string]: MenuItem[] } = {};
    categories.forEach(category => {
      grouped[category.name] = menuItems.filter(item =>
        category.ids.includes(item.id)
      );
    });
    return grouped;
  }, [menuItems, categories]);

   const getRecommendedItems = (itemId: string) => {
    // This is a simple recommendation logic - you should replace with your actual recommendation system
    const allOtherItems = menuItems?.filter(item => item.id !== itemId) || [];
    return allOtherItems.slice(0, 3); // Just get first 3 other items as recommendations
  };

  const handleOnReadMore = (id: string) => {
    const item = menuItems?.find(item => item.id === id);
    if (item) {
      setSelectedItem(item);
      setIsModalOpen(true);
    }
  };

  const handleAddToCart = (item: MenuItem, quantity: number = 1, options: CartItemOptions = {}) => {
    console.log(`Adding item ${item.id} to cart with options:`, options);
    dispatch(addItem({ item, quantity, options }));
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isModalOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Add styles to prevent body scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Cleanup function to restore scrolling when component unmounts or modal closes
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isModalOpen]);


  // if (isLoading) {
  //   return <div className="flex items-center justify-center w-full h-64">Loading menu...</div>;
  // }

  return (
    <>
      <div className="flex w-full px-[30px] lg:px-[70px]">

        {/* Sidebar */}
        <div 
          className="w-[250px] p-[25px] rounded-[30px] border-1 border-white/25 sticky top-[70px] h-fit overflow-y-auto"
          style={{
            boxShadow: "0px 0px 7px 0px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="space-y-2">
            {categories?.map((category) => (
              <button
                key={category.name}
                
                className={`w-full text-left text-black/25 text-normal3 px-[16px] py-[6px] rounded-full transition-colors ${
                  activeCategory === category.name ? 'bg-black/[0.1] text-black/50' : 'bg-black/[0.03]'
                }`}
                
                onClick={() => scrollToSection(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="ml-[20px] flex-1">
          {categories?.map((category) => (
            <div
              key={category.name}
              
              ref={(el) => {
                sectionRefs.current[category.name] = el;
              }}

              data-category={category.name}

              className="mb-[20px]"
            >
              {itemsByCategory[category.name]?.length > 0 ? (
                <div className="">
                    <MenuCards
                      title={category.name}
                      items={itemsByCategory[category.name]}
                      onReadMore={(id) => {handleOnReadMore(id)}}
                      onAddToCart={(item, quantity, options) => handleAddToCart(item, quantity, options)}
                      onToggleFavorite={(id) => console.log(`Toggled favorite for item ${id}`)}
                    />
                </div>
              ) : (
                <p className="text-gray-500">No items found.</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ProductBox Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-start overflow-y-auto justify-center bg-black/20" onClick={handleCloseModal}>
          <div className="relative w-fit my-[100px] mx-auto" onClick={(e) => e.stopPropagation()}>
            <ProductBox 
              item={selectedItem} 
              recommendedItems={getRecommendedItems(selectedItem.id)} 
              onAddToCart={(item, quantity, options) => {
                console.log(`Adding item ${item.id} to cart with options:`, options);
                console.log(`Adding item ${item.id} to cart with quantity:`, quantity);
                console.log(`Adding item ${item.id} to cart with item:`, item);
                handleAddToCart(item, quantity, options);
                handleCloseModal();
              }}

            />
          </div>
        </div>
      )}
    </>
    
  );
}

export default MenuPage_Menu_Section;
