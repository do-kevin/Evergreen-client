import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { groupBy, property, uniqueId, keyBy, head, last, sortBy } from 'lodash';
import dayjs from 'dayjs';
import useGlobalStore from 'store/GlobalStore';
import axiosInstance from 'services/AxiosInstance';
import { TitleDivider } from 'components/shared';
import { InfoCard } from 'components/student';
import UserPathway from 'components/student/user-pathway/UserPathway/UserPathway';
import 'assets/scss/responsive-carousel-override.scss';

export default function (props) {
  const {
    session,
    pathway,
    student,
    completedEnrollments,
    enrollmentsByOfferId,
    myEnrollments,
  } = props;
  const {
    offer: offerStore,
    datafield,
    pathway: pathwayStore,
  } = useGlobalStore();

  const groupedDataFields = groupBy(datafield.entities, property('type'));
  const pathwayId = pathway ? pathway.id : null;

  const getOffer = async (offerId) => {
    const { data } = await axiosInstance.get(
      `/offers/${offerId}?scope=with_details`
    );
    offerStore.addOne(data);
  };

  const getPathway = async (_pathwayId) => {
    if (!_pathwayId) {
      return null;
    }
    if (!pathwayStore.entities[_pathwayId]) {
      const { data } = await axiosInstance.get(
        `/pathways/${pathwayId}?scope=with_details`
      );
      pathwayStore.addOne(data);
    }
  };

  useEffect(() => {
    getPathway(pathwayId);
  }, []);

  if (!pathway) {
    return null;
  }

  let groupsOfOffers = {};
  let groupKeys = [];

  if (pathway && pathway.GroupsOfOffers) {
    groupsOfOffers = groupBy(pathway.GroupsOfOffers, 'group_name');
    groupKeys = Object.keys(groupsOfOffers);
  }

  let studentsPathways = null;

  const keyedByStudentPathwayId = keyBy(
    student.StudentPathways,
    'StudentPathway.pathway_id'
  );

  if (keyedByStudentPathwayId[pathway.id]) {
    studentsPathways = keyedByStudentPathwayId[pathway.id];
  }

  if (pathway && pathway.group_sort_order && pathway.group_sort_order.length) {
    groupKeys = pathway.group_sort_order;
  }

  return (
    <div className="flex flex-col items-center">
      <UserPathway
        title={pathway && pathway.name ? pathway.name : '---'}
        pathway={pathway}
        groupedDataFields={groupedDataFields}
        session={session}
        studentsPathways={studentsPathways}
        completedEnrollments={completedEnrollments}
        enrollmentsByOfferId={enrollmentsByOfferId}
        student={student}
      >
        <section style={{ maxWidth: 896 }}>
          {(groupKeys && groupKeys.length && (
            <TitleDivider
              title={'GROUPS OF COURSES'}
              align="center"
              classNames={{ middleSpan: 'text-base' }}
            />
          )) ||
            null}
          {(groupKeys &&
            groupKeys.length &&
            groupKeys.map((groupName, index) => {
              const group = groupsOfOffers[groupName];
              let groupOfOfferEnrollments = [];
              let firstOfferPathway = head(group);

              let year = null;

              if (!group) {
                return null;
              }

              for (let i = 0; i < group.length; i++) {
                if (!myEnrollments[group[i].offer_id]) {
                  break;
                }
                const offerEnrollments = myEnrollments[group[i].offer_id];
                for (let j = 0; j < offerEnrollments.length; j++) {
                  if (!offerEnrollments[j]) {
                    break;
                  }
                  groupOfOfferEnrollments.push(offerEnrollments[j]);
                }
              }

              groupOfOfferEnrollments = sortBy(groupOfOfferEnrollments, [
                'start_date',
                'updatedAt',
              ]);

              if (!groupOfOfferEnrollments.length) {
                year = dayjs().year() + firstOfferPathway.year - 1;
              }

              if (last(groupOfOfferEnrollments)) {
                year = dayjs(last(groupOfOfferEnrollments).start_date).year();
              }

              return (
                <div key={uniqueId('div_')}>
                  <div className="mb-2">
                    <div className="flex flex-row mx-auto">
                      <span className="px-2 font-bold bg-green-300">
                        {groupName}
                      </span>
                      <span className="block capitalize px-2 bg-green-200">
                        {firstOfferPathway.semester}
                      </span>
                      {year ? (
                        <span className="px-2 bg-gray-300">Year {year}</span>
                      ) : null}
                    </div>
                  </div>
                  {group.map((g, idx) => {
                    let latestEnrollment = null;

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

                    if (myEnrollments[g.offer_id]) {
                      latestEnrollment = last(myEnrollments[g.offer_id]);
                    }

                    return (
                      <Link to={`/home/offer/${offer.id}`} key={idx}>
                        <InfoCard
                          className="mb-4"
                          data={offer}
                          provider={p}
                          key={uniqueId('card_')}
                          groupedDataFields={groupedDataFields}
                          latestEnrollment={latestEnrollment}
                          enableStatus={true}
                        />
                      </Link>
                    );
                  })}
                </div>
              );
            })) ||
            null}
        </section>
      </UserPathway>
    </div>
  );
}
