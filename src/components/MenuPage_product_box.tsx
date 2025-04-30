// product box

"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CartItemOptions, MenuItem } from "@/constants/types"

import placeholderImg from "@/../public/Images/menu.png";
import Image from "next/image";
import { on } from "events";

interface ProductBoxProps {
  item: MenuItem
  recommendedItems: MenuItem[]
  onAddToCart : (item: MenuItem, quantity: number, options: CartItemOptions) => void
}

export default function ProductBox({ item, recommendedItems, onAddToCart }: ProductBoxProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<CartItemOptions>({})
  const [additionalNote, setAdditionalNote] = useState("");

  const normalizedOptions = useMemo(() => {
    if (!item.options) return []; // Return empty array if no options
    return Array.isArray(item.options) ? item.options : [item.options];
  }, [item.options]);

  useEffect(() => {
    const defaultSelections: CartItemOptions = {};
    normalizedOptions.forEach(option => {

      if (option.IsRequired && !option.IsExtra && option.choices.length > 0) {
            defaultSelections[option.Question] = option.choices[0].name;
        }
        if (option.IsExtra) {
            defaultSelections[option.Question] = [];
        }
    });
    setSelectedOptions(defaultSelections);
}, [normalizedOptions]);

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  const handleOptionChange = (questionIndex: number, choiceName: string) => {
    const option = normalizedOptions[questionIndex];
    if (!option) return;

    setSelectedOptions((prev) => ({
      ...prev,
      [option.Question]: choiceName,
    }));
  }

  const handleMultiOptionChange = (questionIndex: number, choiceName: string, isChecked: boolean) => {
    const option = normalizedOptions[questionIndex];
    if (!option || !option.IsExtra) return;

    const question = option.Question;
    const currentSelections = Array.isArray(selectedOptions[question])
                                ? (selectedOptions[question] as string[])
                                : [];

    let newSelections: string[];

    if (isChecked) {
      newSelections = currentSelections.includes(choiceName) ? currentSelections : [...currentSelections, choiceName];
    } else {
      newSelections = currentSelections.filter((c) => c !== choiceName);
    }

    setSelectedOptions((prev) => ({
      ...prev,
      [question]: newSelections,
    }));
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  const handleFinalAddToCart = () => {
    const finalOptions = { ...selectedOptions };
    if (additionalNote.trim()) {
        finalOptions['_additionalNote'] = additionalNote.trim(); // Use a distinct key
    }
    onAddToCart(item, quantity, finalOptions);
};


  return (
    <motion.div
      className="max-w-[450px] min-w-[400px] bg-white rounded-[12px]"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="py-[12px] px-[16px]">
        <motion.div className="flex justify-between items-start" variants={itemVariants}>
          <h1 className="text-h5 font-bold text-black">{item.name}</h1>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            {/* TODO add toggle favourite function */}
            <div className="text-primary text-h5 cursor-pointer" onClick={() => {}}> 
                {item.isFavorite? "★" : "☆"}
            </div>
          </motion.div>
        </motion.div>

        <motion.div className="mt-[2px] h-fit" variants={itemVariants}>
          <span className="text-normal4 text-primary-dark">{item.price}</span>
          <span className="mx-[5px] text-black/40">•</span>
          <span className="text-primary text-normal4">+{item.loyaltyPoints} points</span>
        </motion.div>

        <motion.div className="flex gap-2 my-[10px]" variants={itemVariants}>
          {item.tags.map((tag, index) => (
            <motion.span
              key={index}
              className="bg-black/[0.03] text-black/50 px-3 py-1 rounded-full text-normal4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>

        <motion.div className="text-black/50 text-normal4 mb-[16px]" variants={itemVariants}>
          {item.description}
        </motion.div>

        {/* Options */}
        {item.options && 
        (Array.isArray(item.options) ? item.options : [item.options]).map((option, optionIndex) => (

          <motion.div
            key={optionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + 0.1 * optionIndex }}
          >
            <div className="">
              <div className="flex justify-between items-center">
                
                <div className="text-normal2 text-black">{option.Question}</div>

                {option.IsRequired && (
                  <motion.span
                    className="bg-alert-green text-alert-green-dark text-normal4 px-[16px] py-[2px] rounded-[6px]"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + 0.1 * optionIndex }}
                  >
                    required
                  </motion.span>
                )}
              </div>

              <p className="text-normal4 text-grey/50 ">{option.subtext === "" ? option.subtext : "Select an option"}</p>

              <div className="mt-[10px] gap-y-[5px]">
                {option.IsExtra
                  ? // Checkboxes for add-ons
                    option.choices.map((choice, choiceIndex) => (
                      <motion.label
                        key={choiceIndex}
                        className="flex items-center justify-between"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + 0.05 * choiceIndex }}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            onChange={(e) => {
                              handleMultiOptionChange(optionIndex, choice.name, e.target.checked)
                            }}
                            checked={(selectedOptions[option.Question] as string[])?.includes(choice.name) || false}
                          />
                          <span className="ml-[5px] text-grey capitalize text-normal3">{choice.name}</span>
                        </div>
                        {choice.price > 0 && <span className="text-grey">+$ {choice.price.toFixed(2)}</span>}
                      </motion.label>
                    ))
                  : // Radio buttons for other options
                    option.choices.map((choice, choiceIndex) => (
                      <motion.label
                        key={choiceIndex}
                        className="flex items-center  "
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + 0.05 * choiceIndex }}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                      >
                        <div className="w-full flex justify-between items-center">
                            <div className="flex items-center">
                                <motion.input
                                type="radio"
                                name={`option-${optionIndex}`}
                                className="form-radio"
                                defaultChecked={choiceIndex === 0 && option.IsRequired}
                                onChange={() => handleOptionChange(optionIndex, choice.name)}
                                whileTap={{ scale: 1.2 }}
                                />
                                <span className="ml-[5px] text-grey capitalize text-normal3">{choice.name}</span>
                            </div>
                            {choice.price > 0 && <span className="text-grey">+$ {choice.price.toFixed(2)}</span>}
                        </div>
                      </motion.label>
                    ))}
              </div>
            </div>

            {optionIndex < item.options.length - 1 && (
                <motion.div
                    className="h-[0.5px] bg-black/60 my-[16px] w-[80%] mx-auto"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5 }}
                />
            )}
          </motion.div>
        ))}

        <motion.div
          className="h-[0.5px] bg-black/60 my-[16px] w-[80%] mx-auto"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5 }}
        />

        {/* Additional Note */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h2 className="text-normal2 text-black">Additional Note</h2>
          <p className="text-normal4 text-grey/50 mt-[2px]">
            We'll try our best to accommodate requests, but can't make changes that affect pricing.
          </p>
          <motion.textarea
            className="w-full mt-[10px] p-[10px] border border-black/7 rounded-[5px] text-normal3 text-black/70 placeholder-black/25"
            rows={3}
            placeholder="Add special request"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            transition={{ delay: 0.7 }}
            whileFocus={{ borderColor: "var(--color-primary)" }}
            onChange={(e) => setAdditionalNote(e.target.value)}
          />
        </motion.div>

        {/* Goes Well With */}
        <motion.div className="gap-y-[10px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <div className="text-normal2 text-black my-[10px]">Goes Well With</div>

          {recommendedItems.map((item, index) => (
            <motion.div
              key={index}
              className="flex p-[14px] border-[1px] rounded-[12px] gap-[10px] border-black/[0.03] "
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + 0.1 * index }}
              whileHover={{ backgroundColor: "rgba(0,0,0,0.01)" }}
            >
              <motion.div
                className=""
              >
                <motion.div className="w-[80px] h-[80px] overflow-hidden rounded-[12px] mb-[10px]"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    <Image src={placeholderImg} alt={item.name} className="w-full h-full object-cover" />
                </motion.div>

                <div className="flex justify-between">
                    <motion.button
                    className=" w-[30px] h-[30px]"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="31" viewBox="0 0 30 31" fill="none">
                            <rect y="0.5" width="30" height="30" rx="4.5" fill="#0D0D0D" fillOpacity="0.03"/>
                            <path d="M20.0542 18.9935C19.7613 18.7006 19.2864 18.7006 18.9935 18.9935C18.7006 19.2864 18.7006 19.7613 18.9935 20.0542L20.0542 18.9935ZM21.4696 22.5303C21.7625 22.8232 22.2374 22.8232 22.5303 22.5303C22.8232 22.2374 22.8232 21.7626 22.5303 21.4697L21.4696 22.5303ZM18.9935 20.0542L21.4696 22.5303L22.5303 21.4697L20.0542 18.9935L18.9935 20.0542ZM14.5714 19.3928C11.9086 19.3928 9.75 17.2342 9.75 14.5714H8.25C8.25 18.0626 11.0802 20.8928 14.5714 20.8928V19.3928ZM19.3928 14.5714C19.3928 17.2342 17.2342 19.3928 14.5714 19.3928V20.8928C18.0626 20.8928 20.8928 18.0626 20.8928 14.5714H19.3928ZM14.5714 9.75C17.2342 9.75 19.3928 11.9086 19.3928 14.5714H20.8928C20.8928 11.0802 18.0626 8.25 14.5714 8.25V9.75ZM14.5714 8.25C11.0802 8.25 8.25 11.0802 8.25 14.5714H9.75C9.75 11.9086 11.9086 9.75 14.5714 9.75V8.25Z" fill="#4D4D4D"/>
                        </svg>
                    </motion.button>

                    <motion.button
                        className="flex w-[30px] h-[30px] pt-[8.438px] pb-[8.438px] pr-[7.969px] pl-[8.906px] justify-center items-center aspect-square bg-primary"
                        style={{
                            display: "flex",
                            width: "30px",
                            height: "30px",
                            padding: "8.438px 7.969px 8.438px 8.906px",
                            justifyContent: "center",
                            borderRadius: "4.5px"
                        }}  
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                            <path fillRule="evenodd" clipRule="evenodd" d="M8.19759 0.937663C8.19759 0.534955 7.87113 0.208496 7.46842 0.208496C7.06572 0.208496 6.73926 0.534955 6.73926 0.937663V6.771H0.905924C0.503217 6.771 0.176758 7.09746 0.176758 7.50016C0.176758 7.90287 0.503217 8.22933 0.905924 8.22933H6.73926V14.0627C6.73926 14.4654 7.06572 14.7918 7.46842 14.7918C7.87113 14.7918 8.19759 14.4654 8.19759 14.0627V8.22933H14.0309C14.4336 8.22933 14.7601 7.90287 14.7601 7.50016C14.7601 7.09746 14.4336 6.771 14.0309 6.771H8.19759V0.937663Z" fill="white" fillOpacity="0.8"/>
                        </svg>
                    </motion.button>
                </div>
              </motion.div>

              <div className="flex-1">
                <div className="font-bold text-normal2">{item.name}</div>
                <div className="mb-[10px]">
                    <span className="text-normal4 text-primary-dark">{item.price}</span>
                    <span className="mx-[5px] text-black/40">•</span>
                    <span className="text-primary text-normal4">+{item.loyaltyPoints} points</span>
                </div>
                <p className="text-normal4 text-grey/50">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <motion.div
        className="flex flex-row items-end p-[16px]"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: 0.5,
        }}
      >
        <div className="flex items-center justify-between w-[110px] bg-black/[0.03] rounded-[14px] rounded-br-none mr-[10px] px-[10px] py-[8px]">
          <motion.button
            onClick={decreaseQuantity}
            className="w-[26px] h-[26px] flex items-center justify-center bg-black/[0.03] rounded-[6.6px]"
            style={{
                padding: "4.188px 5.844px 4.188px 6.531px",
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1.53125 5H11.1562" stroke="#4D4D4D" strokeWidth="1.375" strokeLinecap="round"/>
            </svg>
          </motion.button>

          <AnimatePresence mode="wait">
            <motion.span
              key={quantity}
              className="mx-4 w-6 text-center text-normal3 text-black/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {quantity}
            </motion.span>
          </AnimatePresence>

          <motion.button
            onClick={increaseQuantity}
            className="w-[26px] h-[26px] flex items-center justify-center bg-black/[0.03] rounded-[6.6px]"
            style={{
                padding: "4.188px 5.844px 4.188px 6.531px",
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M7.03125 1.1875C7.03125 0.807804 6.72345 0.5 6.34375 0.5C5.96405 0.5 5.65625 0.807804 5.65625 1.1875V5.3125H1.53125C1.15155 5.3125 0.84375 5.6203 0.84375 6C0.84375 6.3797 1.15155 6.6875 1.53125 6.6875H5.65625V10.8125C5.65625 11.1922 5.96405 11.5 6.34375 11.5C6.72345 11.5 7.03125 11.1922 7.03125 10.8125V6.6875H11.1562C11.5359 6.6875 11.8438 6.3797 11.8438 6C11.8438 5.6203 11.5359 5.3125 11.1562 5.3125H7.03125V1.1875Z" fill="#4D4D4D"/>
            </svg>
          </motion.button>
        </div>

        <div className="flex-1 min-w-[200px] flex flex-col justify-center">
            <motion.div
                className="text-right mx-auto text-alert-green-dark bg-alert-green-light rounded-t-[6px] text-normal4 w-fit px-[32px] py-[5px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
            >
                +{item.loyaltyPoints} points
            </motion.div>

            <motion.button
              className="flex items-center justify-between rounded-[14px] rounded-tl-none px-[10px] py-[10px] bg-primary text-white text-normal3 flex-1 w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={() => {handleFinalAddToCart()}}
            >
              <span>Add To Cart</span>
              <div className="flex items-center">
                  <span>{item.price}</span>
                  <motion.span
                  className="mx-[6px]"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, repeatDelay: 2, duration: 0.8 }}
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none">
                          <path d="M8.70711 8.70711C9.09763 8.31658 9.09763 7.68342 8.70711 7.29289L2.34315 0.928932C1.95262 0.538408 1.31946 0.538408 0.928932 0.928932C0.538408 1.31946 0.538408 1.95262 0.928932 2.34315L6.58579 8L0.928932 13.6569C0.538408 14.0474 0.538408 14.6805 0.928932 15.0711C1.31946 15.4616 1.95262 15.4616 2.34315 15.0711L8.70711 8.70711ZM7 9H8V7H7V9Z" fill="white" fillOpacity="0.8"/>
                      </svg>
                  </motion.span>
              </div>
            </motion.button>
        </div>

      </motion.div>
    </motion.div>
  )
}

