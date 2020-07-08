import React, { useEffect, useState } from 'react';
import { Alert, Col, Row } from 'antd';
import useAxios, { configure } from 'axios-hooks';
import {
  isEqual,
  groupBy,
  filter,
  sortBy,
  flow,
  mapValues,
  uniqueId,
  property,
  last,
  compact,
} from 'lodash';
import axiosInstance from 'services/AxiosInstance';
import useGlobalStore from 'store/GlobalStore';
import { InfoCard } from 'components/student';
import UserPathwayContainer from 'components/student/user-pathway/UserPathwayContainer';
import './student-dashboard.scss';

configure({
  axios: axiosInstance,
});

export default function (props) {
  const { session = {} } = props;
  const studentId = session.student_id;
  const [student, setStudent] = useState({});
  const [{ data: studentPayload }] = useAxios(
    `/students/${studentId}?scope=with_details`
  );
  const {
    offer: offerStore,
    pathway: pathwayStore,
    enrollment: enrollmentStore,
    datafield,
  } = useGlobalStore();

  const groupedDataFields = groupBy(datafield.entities, property('type'));

  async function getPathway(pathwayId) {
    const response = await axiosInstance.get(
      `/pathways/${pathwayId}?scope=with_details`
    );
    pathwayStore.addOne(response.data);
  }

  async function getOffer(offerId) {
    const response = await axiosInstance.get(
      `/offers/${offerId}?scope=with_details`
    );
    offerStore.addOne(response.data);
  }

  const getEnrollments = async (studentId) => {
    if (!studentId) {
      return null;
    }

    if (!Object.keys(enrollmentStore.entities).length) {
      const studentEnrollments = await axiosInstance.get(
        `/enrollments?student_id=${studentId}`
      );

      const unenrollments = await axiosInstance.get(
        `/enrollments?student_id=${null}`
      );

      if (studentEnrollments.data.length) {
        enrollmentStore.addMany(studentEnrollments.data);
      }

      if (unenrollments.data.length) {
        enrollmentStore.addMany(unenrollments.data);
      }
    }
  };

  let completedEnrollments = [];
  let enrollmentsByOfferId = [];
  let myEnrollments = [];
  const enrollmentEntities = Object.values(enrollmentStore.entities);

  if (studentId) {
    for (let i = 0; i < enrollmentEntities.length; i++) {
      if (!enrollmentEntities[i]) {
        break;
      }

      if (
        enrollmentEntities[i].status === 'Completed' &&
        enrollmentEntities[i].student_id === studentId
      ) {
        completedEnrollments.push(enrollmentEntities[i]);
      }

      if (enrollmentEntities[i].student_id === null) {
        enrollmentsByOfferId.push(enrollmentEntities[i]);
      }

      if (enrollmentEntities[i].student_id === studentId) {
        myEnrollments.push(enrollmentEntities[i]);
        enrollmentsByOfferId.push(enrollmentEntities[i]);
      }
    }
  }

  completedEnrollments = groupBy(completedEnrollments, 'offer_id');
  enrollmentsByOfferId = groupBy(enrollmentsByOfferId, 'offer_id');
  myEnrollments = flow([
    (enrs) => groupBy(enrs, 'offer_id'),
    (enrs) =>
      mapValues(enrs, (enr) => sortBy(enr, ['start_date', 'updatedAt'])),
  ])(myEnrollments);

  useEffect(() => {
    if (studentPayload) {
      const isNewStudentInfo = isEqual(student, studentPayload);
      if (!isNewStudentInfo) {
        setStudent(studentPayload);
      }
    }
    getEnrollments(studentId);
  }, [studentPayload]);

  let offerIds = filter(student.Enrollments || [], ({ status }) => {
    if (status === 'Activated') {
      return true;
    }
    if (status === 'Completed') {
      return true;
    }
    return false;
  });
  offerIds = groupBy(offerIds, 'offer_id');
  offerIds = Object.keys(offerIds);
  if (student.StudentPathways) {
    for (let i = 0; i < student.StudentPathways.length; i++) {
      const newOfferIds = [];
      if (student.StudentPathways[i].StudentPathway) {
        const pathwayId = student.StudentPathways[i].StudentPathway.pathway_id;
        const _pathway = pathwayStore.entities[pathwayId];
        let groupOffers = groupBy(_pathway.GroupsOfOffers, 'offer_id');
        groupOffers = Object.keys(groupOffers).sort(
          (a, b) => Number(a) - Number(b)
        );

        for (let j = 0; j <= offerIds.length; j++) {
          if (!groupOffers.includes(offerIds[j])) {
            newOfferIds.push(offerIds[j]);
          }
        }

        offerIds = compact(newOfferIds);
      }
    }
  }

  return (
    <main className="pb-4">
      <span className="block text-4xl mt-3 text-theme-darkblue-5">
        Enrolled Curriculums
      </span>
      {(student &&
        student.StudentPathways &&
        student.StudentPathways.length &&
        student.StudentPathways.map((pathway, idx) => {
          const pathwayEntity = pathwayStore.entities[pathway.id];
          if (!pathwayEntity) {
            getPathway(pathway.id);
          }
          return (
            <UserPathwayContainer
              {...props}
              key={idx}
              pathway={pathwayEntity}
              student={student}
              completedEnrollments={completedEnrollments}
              enrollmentsByOfferId={enrollmentsByOfferId}
              myEnrollments={myEnrollments}
            />
          );
        })) || (
        <Alert
          className="mx-auto text-center rounded"
          type="info"
          message="You haven't enrolled in any curriculums yet."
        />
      )}
      <span className="block text-4xl mt-3 text-theme-darkblue-5">
        Enrolled Courses
      </span>
      <Row className="w-full flex-wrap" gutter={8}>
        {(offerIds.length &&
          offerIds.map((offerId, index) => {
            offerId = Number(offerId);
            const offer = offerStore.entities[offerId];
            let p = null;
            let latestEnrollment = null;
            if (!offer) {
              getOffer(offerId);
            }
            if (offer && offer.provider_id) {
              p = offer.Provider;
            }
            if (offerId && myEnrollments[offerId]) {
              latestEnrollment = last(myEnrollments[offerId]);
            }
            return offer && offer.id ? (
              <Col xs={24} sm={12} lg={12} key={uniqueId('card_')}>
                <InfoCard
                  className="mb-4 mx-auto"
                  style={{ minWidth: '278px', maxWidth: 500 }}
                  data={offer}
                  provider={p}
                  groupedDataFields={groupedDataFields}
                  latestEnrollment={latestEnrollment}
                  enableStatus={true}
                />
              </Col>
            ) : null;
          })) || (
          <Alert
            className="mx-auto text-center rounded w-full"
            type="info"
            message="You haven't enrolled in any courses yet."
          />
        )}
      </Row>
    </main>
  );
}
