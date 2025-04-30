import { useSelector } from 'react-redux';
import FAQ from './FAQ';
import { RootState } from '@/lib/store/store';

const FAQSection = () => {

  const faqItems = useSelector((state:RootState) => state.restaurant.info?.faqs || []);

  return (
    <div className="">
      <FAQ faqItems={faqItems} />
    </div>
  );
};

export default FAQSection;