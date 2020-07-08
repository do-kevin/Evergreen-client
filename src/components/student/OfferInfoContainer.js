import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { last, groupBy, property, uniqueId } from 'lodash';
import useGlobalStore from 'store/GlobalStore';
import axiosInstance from 'services/AxiosInstance';
import { TitleDivider } from 'components/shared';
import { InfoCard, InfoLayout } from 'components/student';
import { Carousel } from 'react-responsive-carousel';
import 'assets/scss/responsive-carousel-override.scss';

const centerSlidePercentage = 90;

export default function (props) {
  const { session } = props;
  let { id: offerId } = useParams();
  const { datafield, offer: offerStore } = useGlobalStore();

  useEffect(() => {
    const getOffer = async () => {
      const { data } = await axiosInstance.get(
        `/offers/${offerId}?scope=with_details`
      );
      if (!offerStore.entities[offerId]) {
        offerStore.addOne(data);
      }
    };
    getOffer();
  }, []);

  let offer = offerStore.entities[offerId];

  if (!offer) {
    return null;
  }

  const groupedDataFields = groupBy(
    Object.values(datafield.entities),
    property('type')
  );

  let imageSrc = null;
  let provider = offer.Provider;
  let alt = '';

  if (offer && offer.Files && offer.Files.length) {
    const { file_link, location } = last(offer.Files);
    imageSrc = file_link;
    alt = location;
  }

  return (
    <div className="flex flex-col items-center">
      <InfoLayout
        data={offer}
        src={imageSrc}
        alt={alt}
        session={session}
        groupedDataFields={groupedDataFields}
      >
        <section className="mx-auto w-full">
          {(offer && offer.RelatedOffers && offer.RelatedOffers.length && (
            <>
              <TitleDivider
                title={'RELATED COURSES'}
                align="center"
                classNames={{ middleSpan: 'text-base text-white' }}
              />
              <Carousel
                className="custom-carousel mb-2 cursor-grab"
                centerMode
                infiniteLoop
                centerSlidePercentage={
                  offer.RelatedOffers.length === 1 ? 100 : centerSlidePercentage
                }
                showArrows={true}
                showIndicators={false}
                swipeable={true}
                emulateTouch={true}
                showThumbs={false}
                showStatus={false}
                swipeScrollTolerance={10}
              >
                {offer.RelatedOffers.map((o, index) => {
                  return (
                    <InfoCard
                      className="mx-1"
                      key={uniqueId('related_card_')}
                      data={o}
                      provider={provider}
                      groupedDataFields={groupedDataFields}
                    />
                  );
                })}
              </Carousel>
            </>
          )) ||
            null}
        </section>
        <section className="mx-auto w-full">
          {(offer &&
            offer.PrerequisiteOffers &&
            offer.PrerequisiteOffers.length && (
              <>
                <TitleDivider
                  title={'PREREQUISITES'}
                  align="center"
                  classNames={{ middleSpan: 'text-base text-white' }}
                />
                <Carousel
                  className="custom-carousel mb-4 cursor-grab"
                  centerMode
                  infiniteLoop
                  centerSlidePercentage={
                    offer.PrerequisiteOffers.length === 1
                      ? 100
                      : centerSlidePercentage
                  }
                  showArrows={true}
                  showIndicators={false}
                  swipeable={true}
                  emulateTouch={true}
                  showThumbs={false}
                  showStatus={false}
                  swipeScrollTolerance={10}
                >
                  {offer.PrerequisiteOffers.map((o, index) => {
                    return (
                      <InfoCard
                        className="mx-1"
                        key={uniqueId('prereq_card_')}
                        data={o}
                        provider={provider}
                        groupedDataFields={groupedDataFields}
                      />
                    );
                  })}
                </Carousel>
              </>
            )) ||
            null}
        </section>
      </InfoLayout>
    </div>
  );
}
