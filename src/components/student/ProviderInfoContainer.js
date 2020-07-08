import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { groupBy, property } from 'lodash';
import useGlobalStore from 'store/GlobalStore';
import axiosInstance from 'services/AxiosInstance';
import { TitleDivider } from 'components/shared';
import { InfoCard, InfoLayout } from 'components/student';
import 'assets/scss/responsive-carousel-override.scss';

export default function (props) {
  const {
    match: { params },
  } = props;
  const {
    provider: providerStore,
    datafield,
    pathway: pathwayStore,
  } = useGlobalStore();

  const providerId = Number(params.id);

  const provider = providerStore.entities[providerId];

  const getPathway = async (_pathwayId) => {
    const response = await axiosInstance.get(
      `/pathways/${_pathwayId}?scope=with_details`
    );
    if (!pathwayStore.entities[_pathwayId]) {
      pathwayStore.addOne(response.data);
    }
  };

  const getProvider = async (_providerId) => {
    const { data } = await axiosInstance.get(
      `/providers/${_providerId}?scope=with_details`
    );
    if (!providerStore.entities[_providerId]) {
      providerStore.addOne(data);
    }
  };

  useEffect(() => {
    getProvider(providerId);
  }, []);

  const groupedDataFields = groupBy(datafield.entities, property('type'));
  let Offers = [];
  if (provider && provider.Offers) {
    Offers = provider.Offers;
  }

  let Pathways = [];
  if (provider && provider.Pathways) {
    Pathways = provider.Pathways;
  }

  return (
    <div className="flex flex-col items-center">
      <InfoLayout
        title={provider && provider.name ? provider.name : '---'}
        data={provider}
        groupedDataFields={groupedDataFields}
        type="provider"
      >
        <section style={{ maxWidth: 896 }} className="mx-auto">
          {Offers.length ? (
            <TitleDivider
              title={'COURSES'}
              align="center"
              classNames={{ middleSpan: 'text-base text-white' }}
            />
          ) : null}
          {(Offers.length &&
            Offers.map((o, index) => {
              let p = null;
              if (o && o.provider_id) {
                p = providerStore.entities[o.provider_id];
              }
              return (
                <InfoCard
                  className="mb-4"
                  key={`${o.name}_${index}`}
                  data={o}
                  provider={p}
                  groupedDataFields={groupedDataFields}
                  actions={[]}
                />
              );
            })) ||
            null}
        </section>
        <section style={{ maxWidth: 896 }} className="mx-auto">
          {(Pathways.length && (
            <TitleDivider
              title={'PATHWAYS'}
              align="center"
              classNames={{ middleSpan: 'text-base text-white' }}
            />
          )) ||
            null}
          {(Pathways.length &&
            Pathways.map((pathway, index) => {
              if (!pathwayStore.entities[pathway.id]) {
                getPathway(pathway.id);
              }
              let p = null;
              if (pathway && pathway.provider_id) {
                p = providerStore.entities[pathway.provider_id];
                if (!p) {
                  getProvider(pathway.provider_id);
                }
              }
              return (
                <Link
                  to={
                    pathway && pathway.id ? `/home/pathway/${pathway.id}` : null
                  }
                >
                  <InfoCard
                    className="mb-4"
                    key={index}
                    data={pathway}
                    provider={p}
                    groupedDataFields={groupedDataFields}
                  />
                </Link>
              );
            })) ||
            null}
        </section>
      </InfoLayout>
    </div>
  );
}
