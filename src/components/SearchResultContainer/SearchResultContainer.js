import React from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Button, Empty } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faMapMarkerAlt,
  faTree,
} from '@fortawesome/free-solid-svg-icons';
import { groupBy } from 'lodash';
import { LearnAndEarnIcons, TitleDivider } from 'components/shared';

const rename = {
  offer: 'Course',
  pathway: 'Curriculum',
  provider: 'Provider',
};

export default function ({ data = [], toggeables, setToggeables }) {
  const group = groupBy(data, 'entity_type');
  const groupKeys = Object.keys(group);

  if (!data.length) {
    return <Empty className="m-auto" />;
  }

  return (
    <div className="h-full">
      {data && data.length && (
        <p className="text-2xl text-center text-white">Results</p>
      )}
      {(data &&
        data.length &&
        groupKeys.map((key) => {
          return (
            <div key={key}>
              {(group[key] && group[key].length && (
                <TitleDivider
                  title={rename[key] + 's'}
                  align="center"
                  classNames={{ middleSpan: 'text-base capitalize text-white' }}
                />
              )) ||
                null}
              {(group[key] &&
                group[key].length &&
                group[key].map((d, index) => {
                  const link = `/home/${key}/${d.id}`;

                  let location = null;
                  let providerName = null;

                  if (d.location) {
                    location = d.location;
                  }

                  if (
                    (key === 'offer' || key === 'pathway') &&
                    d.provider_id &&
                    d.Provider.location
                  ) {
                    location = d.Provider.location;
                  }

                  if (d.provider_id && d.Provider) {
                    providerName = d.Provider.name;
                  }

                  return (
                    <div className="bg-white mb-2 rounded" key={index}>
                      <Row>
                        <Col
                          span={22}
                          className="bordered border border-solid p-1 rounded-l"
                        >
                          <span className="text-sm font-bold block">
                            {d.name || null}
                          </span>
                          <span className="text-xs block">
                            {providerName ? (
                              <FontAwesomeIcon
                                className="text-sm mr-1"
                                icon={faTree}
                              />
                            ) : null}
                            {providerName || null}
                          </span>
                          <div className="flex">
                            <span className="text-xs mr-2 flex items-center">
                              <FontAwesomeIcon
                                className="text-sm mr-1"
                                icon={faMapMarkerAlt}
                              />
                              {location || '---'}
                            </span>
                            <LearnAndEarnIcons
                              learnAndEarn={d.learn_and_earn}
                              style={{ width: 50 }}
                            />
                          </div>
                        </Col>
                        <Col span={2}>
                          <Link
                            className="block h-full w-full"
                            to={link}
                            onClick={() => {
                              setToggeables({
                                ...toggeables,
                                search: false,
                              });
                            }}
                          >
                            <Button
                              className="h-full w-full shadow-none rounded-l-none"
                              type="primary"
                              style={{
                                borderTopRightRadius: '0.2rem',
                                borderBottomRightRadius: '0.2rem',
                              }}
                            >
                              <FontAwesomeIcon
                                className="text-white text-base relative"
                                style={{ right: 3 }}
                                icon={faChevronRight}
                              />
                            </Button>
                          </Link>
                        </Col>
                      </Row>
                    </div>
                  );
                })) ||
                null}
            </div>
          );
        })) ||
        null}
    </div>
  );
}
