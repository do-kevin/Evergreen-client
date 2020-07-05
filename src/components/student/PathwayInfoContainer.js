import React, { useEffect } from 'react';
import { groupBy, property, uniqueId } from 'lodash';
import useGlobalStore from 'store/GlobalStore';
import axiosInstance from 'services/AxiosInstance';
import { TitleDivider } from 'components/shared';
import { InfoCard, InfoLayout } from 'components/student';
import 'assets/scss/responsive-carousel-override.scss';

export default function (props) {
  const {
    match: { params },
    session,
  } = props;
  const {
    offer: offerStore,
    datafield,
    pathway: pathwayStore,
  } = useGlobalStore();

  const pathwayId = Number(params.id);
  const groupedDataFields = groupBy(datafield.entities, property('type'));

  const getOffer = async (offerId) => {
    const { data } = await axiosInstance.get(
      `/offers/${offerId}?scope=with_details`
    );
    offerStore.addOne(data);
  };

  const getPathway = async () => {
    const { data } = await axiosInstance.get(
      `/pathways/${pathwayId}?scope=with_details`
    );
    if (!pathwayStore.entities[pathwayId]) {
      pathwayStore.addOne(data);
    }
  };

  useEffect(() => {
    getPathway();
  }, []);

  const pathway = pathwayStore.entities[pathwayId];

  if (!pathway) {
    return null;
  }

  let groupsOfOffers = {};
  let groupKeys = [];

  if (pathway && pathway.GroupsOfOffers) {
    groupsOfOffers = groupBy(pathway.GroupsOfOffers, 'group_name');
    groupKeys = Object.keys(groupsOfOffers);
  }

  return (
    <div className="flex flex-col items-center">
      <InfoLayout
        title={pathway && pathway.name ? pathway.name : '---'}
        data={pathway}
        groupedDataFields={groupedDataFields}
        type="pathway"
        session={session}
      >
        <section style={{ maxWidth: 896 }}>
          {(groupKeys.length && (
            <TitleDivider
              title={'GROUPS OF COURSES'}
              align="center"
              classNames={{ middleSpan: 'text-base text-white' }}
            />
          )) ||
            null}
          {(groupKeys.length &&
            groupKeys.map((key, index) => {
              const group = groupsOfOffers[key];
              return (
                <div key={uniqueId('div_')}>
                  <TitleDivider
                    title={key}
                    align="center"
                    classNames={{
                      middleSpan:
                        'text-base bg-teal-600 px-2 rounded text-white',
                    }}
                  />
                  {group.map((g) => {
                    if (!g) {
                      return null;
                    }
                    let p = null;
                    const offer = offerStore.entities[g.offer_id];
                    if (!offer) {
                      getOffer(g.offer_id);
                    }
                    if (offer && offer.provider_id) {
                      p = offer.Provider;
                    }
                    return (
                      <InfoCard
                        key={uniqueId('card_')}
                        className="mb-4"
                        data={offer}
                        provider={p}
                        groupedDataFields={groupedDataFields}
                      />
                    );
                  })}
                </div>
              );
            })) ||
            null}
        </section>
      </InfoLayout>
    </div>
  );
}
