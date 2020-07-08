import React, { useEffect, useState } from 'react';
import useGlobalStore from 'store/GlobalStore';
import { Carousel } from 'react-responsive-carousel';
import PromoCard from 'components/promotion/PromoCard/PromoCard';
import 'assets/scss/responsive-carousel-override.scss';
import './promo-carousels-container.scss';

export default function () {
  const [localSliderPercentage, setLocalSliderPercentage] = useState(100);
  const {
    offer: offerStore,
    provider: providerStore,
    pathway: pathwayStore,
  } = useGlobalStore();

  const offers = Object.values(offerStore.entities).map((o) => {
    return {
      ...o,
      entity_type: 'offer',
    };
  });

  const providers = Object.values(providerStore.entities).map((p) => {
    return {
      ...p,
      entity_type: 'provider',
    };
  });

  const pathways = Object.values(pathwayStore.entities).map((p) => {
    return {
      ...p,
      entity_type: 'pathway',
    };
  });

  const data = [...offers, ...pathways, ...providers];

  const localPromos = data.filter((d) => {
    return d.is_local_promo;
  });

  const mainPromos = data.filter((d) => {
    return d.is_main_promo;
  });

  useEffect(() => {
    const handleSliderPercentOnResize = () => {
      if (window.innerWidth >= 769) {
        setLocalSliderPercentage(34);
      } else {
        setLocalSliderPercentage(100);
      }
    };

    if (window.innerWidth >= 769) {
      setLocalSliderPercentage(34);
    } else {
      setLocalSliderPercentage(100);
    }

    window.addEventListener('resize', handleSliderPercentOnResize);

    return () =>
      window.removeEventListener('resize', handleSliderPercentOnResize);
  }, [localSliderPercentage]);

  return (
    <div className="h-auto w-full">
      <Carousel
        className="custom-carousel promoCarousel mb-2 cursor-grab"
        centerMode
        infiniteLoop
        centerSlidePercentage={100}
        showArrows={true}
        showIndicators={false}
        swipeable={true}
        emulateTouch={true}
        showStatus={false}
        showThumbs={false}
        interval={7000}
        autoPlay={true}
        swipeScrollTolerance={1}
      >
        {mainPromos.map((promo, index) => {
          return <PromoCard key={index} data={promo} banner={true} />;
        })}
      </Carousel>
      <Carousel
        className="custom-carousel promoCarousel mb-2 mt-5 cursor-grab"
        centerMode
        infiniteLoop
        centerSlidePercentage={localSliderPercentage}
        showArrows={true}
        showIndicators={false}
        swipeable={true}
        emulateTouch={true}
        showStatus={false}
        showThumbs={false}
        interval={7000}
        autoPlay={true}
        swipeScrollTolerance={1}
      >
        {localPromos.map((promo, index) => {
          return (
            <PromoCard key={index} data={promo} size="small" className="mx-1" />
          );
        })}
      </Carousel>
    </div>
  );
}
