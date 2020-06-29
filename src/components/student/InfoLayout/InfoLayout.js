import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Tag, Button, Input, Form, message } from 'antd';
import {
  find,
  last,
  each,
  groupBy,
  sortBy,
  reject,
  flowRight,
  orderBy,
} from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faCalendarAlt,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { faHandshake } from '@fortawesome/free-regular-svg-icons';
import { reactLocalStorage } from 'reactjs-localstorage';
import dayjs from 'dayjs';
import axiosInstance from 'services/AxiosInstance';
import { LearnAndEarnIcons, UnitTag } from 'components/shared';
import useGlobalStore from 'store/GlobalStore';
import './info-layout.scss';
import 'assets/scss/antd-overrides.scss';

export default function ({
  children,
  type = 'offer',
  data = {},
  groupedDataFields,
  session = {},
}) {
  const [openCodeInput, setOpenCodeInput] = useState(false);
  const {
    id,
    cost,
    credit,
    pay,
    length,
    length_unit,
    frequency,
    frequency_unit,
    DataFields = [],
    Provider = { name: null, location: null },
    provider_id,
    name,
    is_public,
    industry,
    financial_aid,
    location,
    GroupsOfOffers = [],
    external_url,
  } = data;
  const [offerEnrollments, setOfferEnrollments] = useState([]);
  const [fetchEnrollments, setFetchEnrollments] = useState(false);
  const { offer: offerStore } = useGlobalStore();
  const [form] = Form.useForm();
  const myOfferEnrollments = sortBy(offerEnrollments, ['start_date']);

  useEffect(() => {
    const getAvailableEnrollmentByOffer = async (offerId) => {
      if (!fetchEnrollments) {
        const { data } = await axiosInstance.get(
          `/enrollments?status=Inactivate&student_id=null&offer_id=${offerId}`
        );
        if (!myOfferEnrollments.length) {
          setOfferEnrollments(data);
        }
      }
      setFetchEnrollments(true);
    };

    if (type === 'offer' && !fetchEnrollments && !myOfferEnrollments.length) {
      getAvailableEnrollmentByOffer(id);
    }
  }, []);

  const enrollOffer = async () => {
    const studentId = session.student_id;
    const offerId = id;
    try {
      const response = await axiosInstance.put(
        `/students/${studentId}/offers/${offerId}/provider/${provider_id}/enroll`,
        {
          start_date: dayjs().toISOString(),
        }
      );

      if (response.status === 200 && typeof response.data === 'string') {
        message.success(`You've already applied or enrolled in ${data.name}`);
        return response.data;
      }
      if (response.status === 200) {
        message.success(`You've enrolled in ${data.name}`);
      }
      if (response.status === 201) {
        message.info(
          `You've enrolled in ${data.name}. We will notify the provider`
        );
      }
      return response;
    } catch (e) {
      console.error(e);
      return;
    }
  };

  const enrollPathway = async () => {
    const studentId = session.student_id;
    const pathwayId = id;
    try {
      const response = await axiosInstance.post(
        `/students/${studentId}/pathways/${pathwayId}/enroll`
      );
      if (response.status === 200) {
        message.info(`You're already enrolled in ${data.name}`);
      }
      if (response.status === 201) {
        message.success(`You've enrolled in ${data.name}`);
      }
      return response;
    } catch (e) {
      console.error(e);
      return e;
    }
  };

  const onEnroll = () => {
    if (!Object.keys(session).length) {
      if (type === 'offer') {
        reactLocalStorage.set('offer_id', id);
      }
      if (type === 'pathway') {
        reactLocalStorage.set('pathway_id', id);
      }
      return window.location.replace(`${process.env.REACT_APP_API_URL}/login`);
    }
    if (
      type === 'offer' &&
      Object.keys(session).length &&
      session.role === 'student'
    ) {
      return enrollOffer();
    }
    if (
      type === 'pathway' &&
      Object.keys(session).length &&
      session.role === 'student'
    ) {
      return enrollPathway();
    }
  };

  const topics = DataFields.filter((d) => d.type === 'topic');
  const offerCategory = find(DataFields, ['type', 'offer_category']);
  const lengthUnit = find(groupedDataFields.length_unit, ({ id }) => {
    return id === Number(length_unit);
  });
  const frequencyUnit = find(groupedDataFields.frequency_unit, ({ id }) => {
    return id === Number(frequency_unit);
  });

  let src = null;
  let alt = '';

  if (data && data.Files && data.Files.length) {
    const notBanners = flowRight([
      (f) => orderBy(f, ['createdAt', 'asc']),
      (f) => reject(f, ['meta', 'banner-image']),
    ])(data.Files);
    const { file_link, location: fileLocation } = last(notBanners);
    src = file_link;
    alt = fileLocation;
  }
  let totalPay = 0;
  let totalCredit = 0;
  let totalCost = 0;

  if (type === 'pathway') {
    const groups = groupBy(GroupsOfOffers, 'group_name');

    each(Object.values(groups), function (_group) {
      each(_group, function (o) {
        const offer = offerStore.entities[o.offer_id];
        if (offer) {
          if (offer.pay) {
            totalPay += offer.pay;
          }
          if (offer.credit) {
            totalCredit += offer.credit;
          }
          if (offer.cost) {
            totalCost += offer.cost;
          }
        }
      });
    });
  }

  const EnrollAndExternalUrlRow = (
    <Row
      className={`w-full mx-auto ${
        external_url ? 'justify-between' : 'justify-center'
      }`}
    >
      <Button
        type="primary"
        className="rounded"
        style={{ width: '49%' }}
        onClick={() => onEnroll()}
      >
        Enroll
      </Button>
      {external_url ? (
        <Button type="primary" className="rounded" style={{ width: '49%' }}>
          <a href={external_url} target="_blank" rel="noopener noreferrer">
            View Website
          </a>
        </Button>
      ) : null}
    </Row>
  );

  return (
    <div className="infoLayout">
      <header className="mx-auto relative" style={{ minHeight: 52 }}>
        <span
          className="block text-white text-center text-lg absolute text-white w-full bottom-0 p-3"
          style={{
            background: 'rgba(0, 0, 0, 0.75)',
            borderTopLeftRadius: !src ? '1rem' : 'none',
            borderTopRightRadius: !src ? '1rem' : 'none',
          }}
        >
          {name || '---'}
        </span>
        {src && (
          <figure className="mx-auto">
            <img className="h-full w-full object-cover" src={src} alt={alt} />
          </figure>
        )}
      </header>
      <section
        className="bg-white px-2 pb-4"
        style={{
          borderBottomLeftRadius: '1rem',
          borderBottomRightRadius: '1rem',
        }}
      >
        <Row className="py-2">
          <Col span={12}>
            {type === 'provider' ? (
              <span>{industry}</span>
            ) : provider_id ? (
              <Link
                className={provider_id ? '' : 'pointer-events-none'}
                to={`/home/provider/${provider_id}`}
              >
                {Provider.name}
              </Link>
            ) : null}
          </Col>
          <Col span={12} className="flex flex-row-reverse items-center">
            <span className="block ml-1">
              {type === 'provider' && Provider ? Provider.location : '---'}
              {type !== 'provider' ? location || null : null}
            </span>
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </Col>
        </Row>
        <hr />
        <Row className="py-2">
          <Col span={12} className="flex items-center">
            <LearnAndEarnIcons learnAndEarn={data.learn_and_earn} />
          </Col>
          <Col span={12} className="flex flex-col items-right text-right">
            <span className="text-gray-600">TOPICS</span>
            <div className="flex flex-row-reverse flex-wrap items-right">
              {topics.map((t, index) => {
                if (t.type !== 'topic') {
                  return null;
                }
                return (
                  <Tag
                    className="mr-0 ml-1 mb-1"
                    color={index % 2 ? 'blue' : 'orange'}
                    key={index.toString()}
                  >
                    {t.name}
                  </Tag>
                );
              })}
            </div>
          </Col>
        </Row>
        <hr />
        <Row className="mt-2 mb-1">
          <Col span={8}>
            Cost :{' '}
            {type === 'pathway'
              ? totalCost
                ? `$${totalCost}`
                : '---'
              : cost
              ? `$${cost}`
              : '---'}
          </Col>
          <Col span={8} className="flex justify-center">
            Credit :{' '}
            {type === 'pathway' ? totalCredit || '---' : credit || '---'}
          </Col>
          <Col span={8} className="flex flex-row-reverse">
            Pay :{' '}
            {type === 'pathway'
              ? totalPay
                ? `$${totalPay}`
                : '---'
              : pay
              ? `$${pay}`
              : '---'}
          </Col>
        </Row>
        <Row className="mt-1 mb-2">
          <Col span={12} className="flex flex-row items-center">
            {type !== 'provider' && length && (
              <UnitTag number={length} unit={lengthUnit} />
            )}
            {type !== 'provider' && frequency && (
              <UnitTag number={frequency} unit={frequencyUnit} />
            )}
            {type === 'provider' && (
              <>
                <FontAwesomeIcon icon={faHandshake} className="mr-1" />
                <span>{financial_aid}</span>
              </>
            )}
          </Col>
          <Col span={12} className="flex flex-row-reverse items-center">
            {type === 'provider' ? (
              <Tag className="mr-0" color="purple">
                {is_public ? 'Public' : 'Private'}
              </Tag>
            ) : null}
            {(type === 'offer' &&
              myOfferEnrollments &&
              myOfferEnrollments.length && (
                <>
                  <span className="ml-1">
                    {dayjs(last(myOfferEnrollments).start_date).format(
                      'MMM D, YYYY'
                    ) || null}
                  </span>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                </>
              )) ||
              null}
          </Col>
        </Row>
        <hr />
        <section className="flex flex-col justify-center">
          <p className="text-center break-words">{data.description}</p>
          {type === 'offer' && (
            <Tag className="mx-auto">
              {offerCategory ? offerCategory.name : null}
            </Tag>
          )}
        </section>
        <div>
          {type === 'provider' && external_url ? (
            <div className="flex justify-center w-full">
              <Button type="primary" className="rounded w-1/2">
                <a
                  href={external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Website
                </a>
              </Button>
            </div>
          ) : null}
          {type === 'pathway' && (
            <Row
              className={`flex-col mt-2 ${
                external_url
                  ? 'items-start justify-left'
                  : 'justify-center items-center'
              }`}
            >
              {EnrollAndExternalUrlRow}
            </Row>
          )}
          {type === 'offer' && (
            <Form form={form}>
              <Row
                className={`flex-col mt-2 ${
                  external_url
                    ? 'items-start justify-left'
                    : 'justify-center items-center'
                }`}
              >
                {EnrollAndExternalUrlRow}
                {openCodeInput && (
                  <Row
                    className={`${external_url ? 'w-full' : 'w-1/2'} ${
                      openCodeInput ? 'mt-2' : ''
                    }`}
                  >
                    <Col span={external_url ? 22 : 20}>
                      <Form.Item
                        name="activation_code"
                        rules={[
                          {
                            required: true,
                            message: 'Requires code',
                          },
                        ]}
                      >
                        <Input
                          className="flex items-center rounded-l rounded-r-none ant-input-group-add-on-border-none-p-0"
                          style={{ paddingBottom: 4.5, zIndex: 2 }}
                          allowClear
                        />
                      </Form.Item>
                    </Col>
                    <Col span={external_url ? 2 : 4}>
                      <Button
                        className={`rounded-l-none rounded-r`}
                        onClick={() => setOpenCodeInput(false)}
                        icon={<FontAwesomeIcon icon={faTimes} />}
                      />
                    </Col>
                  </Row>
                )}
                {!openCodeInput && (
                  <Button
                    className={external_url ? 'pl-0' : ''}
                    type="link"
                    onClick={() => setOpenCodeInput(!openCodeInput)}
                  >
                    Already have code?
                  </Button>
                )}
              </Row>
            </Form>
          )}
        </div>
      </section>
      <section>{children}</section>
    </div>
  );
}
