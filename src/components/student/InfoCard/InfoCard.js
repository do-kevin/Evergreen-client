import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Row } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { find } from 'lodash';
import dayjs from 'dayjs';
import { LearnAndEarnIcons } from 'components/shared';
import './info-card.scss';

const statuses = {
  Inactivate: {
    substituteStatus: 'Applied',
    statusColor: 'rgb(148,0,211)',
    textColor: 'text-white',
  },
  Activated: {
    substituteStatus: 'Enrolled',
    statusColor: 'rgb(0,0,255)',
    textColor: 'text-white',
  },
  Enrolled: {
    substituteStatus: 'Enrolled',
    statusColor: 'rgb(0,0,255)',
    textColor: 'text-white',
  },
  Completed: {
    substituteStatus: 'Passed',
    statusColor: 'rgb(0,255,0)',
    textColor: 'text-gray',
  },
  Approved: {
    substituteStatus: 'Enrolled',
    statusColor: 'rgb(0,0,255)',
    textColor: 'text-white',
  },
  Unenrolled: {
    substituteStatus: 'Unenrolled',
    statusColor: 'rgb(211,211,211)',
    textColor: 'text-gray',
  },
  Failed: {
    substituteStatus: 'Failed',
    statusColor: 'rgb(255,99,132)',
    textColor: 'text-gray',
  },
};

function InfoCardFooter(props) {
  const { enrollment = null } = props;
  let text = (
    <p className="text-gray-600 font-bold" style={{ minWidth: 68 }}>
      Unenrolled
    </p>
  );
  let backgroundColor = 'rgb(211,211,211)';

  if (enrollment && enrollment.status) {
    text = (
      <p
        className={`${
          enrollment && enrollment.status
            ? statuses[enrollment.status]
              ? statuses[enrollment.status].textColor
              : null
            : 'text-gray-600'
        } font-bold info-card__statusText`}
        style={{ minWidth: 68 }}
      >
        {enrollment.status === 'Completed' || enrollment.status === 'Failed' ? (
          <span>Credit&nbsp;&nbsp;{enrollment.credit}</span>
        ) : statuses[enrollment.status] ? (
          statuses[enrollment.status].substituteStatus
        ) : null}
      </p>
    );
    backgroundColor = statuses[enrollment.status]
      ? statuses[enrollment.status].statusColor
      : 'rgb(211,211,211)';
  }

  return (
    <div
      className="h-auto flex flex-col justify-center text-center"
      style={{
        width: 31,
        background: backgroundColor,
        borderTopRightRadius: '1rem',
        borderBottomRightRadius: '1rem',
      }}
    >
      <aside
        className="h-auto relative w-auto"
        style={{
          bottom: '1.5em',
          transform: 'rotate(90deg)',
          right: '0.4em',
        }}
      >
        {text}
      </aside>
    </div>
  );
}

export default function ({
  data,
  provider = {},
  groupedDataFields,
  style,
  className,
  actions = [],
  enableStatus = false,
  latestEnrollment,
}) {
  if (!data) {
    return null;
  }

  let {
    name,
    learn_and_earn,
    cost,
    pay,
    credit,
    length_unit,
    frequency_unit,
    length,
    frequency,
    provider_id,
    start_date,
    external_url,
  } = data;

  if (start_date) {
    start_date = dayjs(start_date).format('MMM DD, YYYY');
  }
  const lengthUnit = find(groupedDataFields.length_unit, ({ id }) => {
    return id === Number(length_unit);
  });
  const frequencyUnit = find(groupedDataFields.frequency_unit, ({ id }) => {
    return id === Number(frequency_unit);
  });

  return (
    <div className={`flex flex-row shadow ${className}`}>
      <Card
        className={`info-card`}
        style={{
          ...style,
          borderTopRightRadius: !enableStatus ? '1rem' : 'none',
          borderBottomRightRadius: !enableStatus ? '1rem' : 'none',
          borderTopLeftRadius: '1rem',
          borderBottomLeftRadius: '1rem',
        }}
      >
        <Row>
          <Col span={12}>
            <Row className="mb-1 flex-col">
              {data && data.id ? (
                <Link
                  className="text-left font-bold"
                  to={`/home/offer/${data.id}`}
                >
                  {name}
                </Link>
              ) : (
                <span className="text-left font-bold">{name}</span>
              )}
              <Link
                className={`text-xs font-normal text-left ${
                  provider_id ? '' : 'pointer-events-none'
                }`}
                to={`/home/provider/${provider_id}`}
                onClick={(e) => e.stopPropagation()}
              >
                {provider && provider.name ? provider.name : null}
              </Link>
            </Row>
            <Row className="my-1">
              <LearnAndEarnIcons learnAndEarn={learn_and_earn} />
            </Row>
          </Col>
          <Col span={12} className="text-right">
            <a
              className="text-center bg-blue-500 hover:bg-blue-700 hover:text-white text-white py-1 px-3 text-xs rounded w-auto"
              onClick={(e) => e.stopPropagation()}
              style={{ zIndex: 33 }}
              href={external_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Website
            </a>
            <div className="mt-1">
              <FontAwesomeIcon icon={faMapMarkerAlt} />{' '}
              {provider && provider.location ? provider.location : '-'}
            </div>
            <Row className="mt-1 flex-row-reverse">
              {length && (
                <div className="unit-tag ml-2 text-white rounded px-1">
                  {Number(length) || null} {lengthUnit ? lengthUnit.name : null}
                </div>
              )}
              {frequency && (
                <div className="unit-tag text-white rounded px-1">
                  {Number(frequency) || null}{' '}
                  {frequencyUnit ? frequencyUnit.name : null}
                </div>
              )}
            </Row>
          </Col>
        </Row>
        <Row className="w-full">
          <Col span={8} className="text-left">
            <span className="block font-bold text-gray-600 text-sm">Cost</span>
            <span className="font-bold text-black text-xl bottom-1 relative">{`$${
              Number(cost) || '---'
            }`}</span>
          </Col>
          <Col span={8} className="text-center">
            <span className="block font-bold text-gray-600 text-sm">Pay</span>
            <span className="font-bold text-black text-xl bottom-1 relative">{`$${
              Number(pay) || '---'
            }`}</span>
          </Col>
          <Col span={8} className="text-right">
            <span className="block font-bold text-gray-600 text-sm">
              Credit
            </span>
            <span className="font-bold text-black text-xl bottom-1 relative">{`${
              Number(credit) || '---'
            }`}</span>
          </Col>
        </Row>
      </Card>
      {(enableStatus && <InfoCardFooter enrollment={latestEnrollment} />) ||
        null}
    </div>
  );
}
