import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Tag, Button, Input, Form } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faTimes,
  faEdit,
  faCheck,
  faCalendarAlt,
  faChartBar,
  faChartLine,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { Carousel } from 'react-responsive-carousel';
import { find, groupBy, each, uniqBy, sortBy, last, head } from 'lodash';
import axiosInstance from 'services/AxiosInstance';
import useGlobalStore from 'store/GlobalStore';
import { LearnAndEarnIcons } from 'components/shared';
import { UserPathwayChart, ExpenseEarningChart } from 'components/student';
import './user-pathway.scss';
import 'assets/scss/antd-overrides.scss';

const { TextArea } = Input;

export default function ({
  children,
  pathway = {},
  studentsPathways,
  completedEnrollments,
  enrollmentsByOfferId,
  student,
}) {
  const [fetchPathwayChartData, setFetchPathwayChartData] = useState(false);
  const [pathwayChartData, setPathwayChartData] = useState({});
  const [groupChartData, setGroupChartData] = useState({});
  const [currentGroupChartData, setCurrentGroupChartData] = useState({});

  const [totalPay, setTotalPay] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const [openNotes, setOpenNotes] = useState(false);

  const [switchChart, setSwitchChart] = useState(false);
  const [toggleFilterByGroup, setToggleFilterByGroup] = useState(false);

  const [formRef, setFormRef] = useState();
  const {
    id: pathwayId,
    DataFields = [],
    Provider,
    provider_id,
    name,
    StudentsPathways,
    GroupsOfOffers,
    external_url,
  } = pathway;

  const { pathway: pathwayStore, offer: offerStore } = useGlobalStore();

  const { student_id } = studentsPathways.StudentPathway;

  const [form] = Form.useForm();

  const topics = DataFields.filter((d) => d.type === 'topic');

  let pathwayOfferIds = [];

  each(pathway.GroupsOfOffers, (offerGroup) => {
    if (offerGroup.offer_id) {
      pathwayOfferIds.push(offerGroup.offer_id);
    }
  });

  pathwayOfferIds = uniqBy(pathwayOfferIds);

  let latestDates = [];

  each(pathwayOfferIds, (offerId) => {
    const enrollments = sortBy(enrollmentsByOfferId[offerId], ['start_date']);
    if (last(enrollments)) {
      latestDates.push(last(enrollments).start_date);
    }
  });

  latestDates = sortBy(latestDates, ['start_date']);

  let latestEnrollmentDate = head(latestDates);
  latestEnrollmentDate = dayjs(latestEnrollmentDate).format('MMMM D, YYYY');

  const updatePathwayNotes = async (_studentId, _pathwayId) => {
    try {
      const values = await form.validateFields(['notes']);
      const response = await axiosInstance.put(
        `/students/${_studentId}/pathways/${pathwayId}?scope=with_details`,
        { notes: values.notes }
      );
      pathwayStore.updateOne(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  let notes = null;

  const _StudentsPathways = find(StudentsPathways, function (item) {
    return item.StudentPathway.student_id === student_id;
  });

  if (_StudentsPathways && _StudentsPathways.StudentPathway.notes) {
    notes = _StudentsPathways.StudentPathway.notes;
  }

  const groups = groupBy(GroupsOfOffers, 'group_name');
  const groupNames = Object.keys(groups);

  let _totalPay = 0;
  let _totalCredit = 0;
  let _totalCost = 0;
  let creditEarned = 0;

  const earningByGroup = {};
  const costByGroup = {};

  each(Object.values(groups), function (_group, index) {
    let totalPayOfGroup = 0;
    let totalCostOfGroup = 0;

    each(_group, function (o) {
      const offer = offerStore.entities[o.offer_id];

      if (offer) {
        if (completedEnrollments[offer.id]) {
          creditEarned += offer.credit;
        }
        if (offer.pay) {
          _totalPay += offer.pay;
          totalPayOfGroup += offer.pay;
        }
        if (offer.credit) {
          _totalCredit += offer.credit;
        }
        if (offer.cost) {
          _totalCost += offer.cost;
          totalCostOfGroup += offer.cost;
        }
      }
    });

    earningByGroup[groupNames[index]] = totalPayOfGroup;
    costByGroup[groupNames[index]] = totalCostOfGroup;
  });

  const getChartData = async (student_id, pathway_id, group_name) => {
    let sendingBody = {
      student_id,
      pathway_id,
    };

    if (group_name) {
      sendingBody = {
        ...sendingBody,
        group_name,
      };
    }

    const response = await axiosInstance.post(
      '/pathways/generate_userpathway_chart_data',
      sendingBody
    );

    return response;
  };

  useEffect(() => {
    if (formRef) {
      form.setFieldsValue({
        notes,
      });
    }
    if (_totalPay > 0) {
      setTotalPay(_totalPay);
    }
    if (_totalCredit > 0) {
      setTotalCredit(_totalCredit);
    }
    if (_totalCost > 0) {
      setTotalCost(_totalCost);
    }
  }, [
    formRef,
    totalPay,
    totalCost,
    totalCredit,
    groupChartData,
    currentGroupChartData,
  ]);

  useEffect(() => {
    if (!fetchPathwayChartData) {
      const generateChartData = async () => {
        const { data } = await getChartData(student_id, pathwayId);

        if (data) {
          setPathwayChartData(data);
        }
        setFetchPathwayChartData(true);
      };
      generateChartData();
    }
  }, [fetchPathwayChartData]);

  const handleCurrentItem = (current, total) => {
    const groupName = groupNames[current - 1];
    if (toggleFilterByGroup) {
      if (!groupChartData[groupName]) {
        const generateGroupChart = async () => {
          const { data } = await getChartData(student_id, pathwayId, groupName);
          setGroupChartData({
            ...groupChartData,
            [groupName]: {
              fetched: true,
              data,
            },
          });
          if (groupChartData[groupName] && groupChartData[groupName].data) {
            setCurrentGroupChartData(groupChartData[groupName].data);
          }
        };

        generateGroupChart();
      }
    }
    return null;
  };

  let chartWidth = 423;
  if (pathwayChartData && pathwayChartData.labels) {
    chartWidth = chartWidth + pathwayChartData.labels.length * 15;
  }

  return (
    <div className="infoLayout mb-3">
      <span className="block text-white text-left text-5xl w-full bottom-0">
        {name || 'Curriculum Name Unavailable'}
        {external_url ? (
          <a
            className="ml-2 text-lg"
            style={{ hieght: 25 }}
            href={'//' + external_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} />
          </a>
        ) : null}
      </span>
      <div className="flex flex-row justify-between infoRow">
        <Col
          className="bg-white infoRow__col p-3"
          style={{
            borderRadius: '1rem',
          }}
        >
          {Provider && (Provider.name || Provider.location) ? (
            <Row className="py-2">
              <Col span={12}>
                {Provider && Provider.name ? (
                  <Link
                    className={provider_id ? '' : 'pointer-events-none'}
                    to={`/home/provider/${provider_id}`}
                  >
                    {Provider.name}
                  </Link>
                ) : null}
              </Col>
              <Col span={12} className="flex flex-row-reverse items-center">
                {Provider && Provider.location && (
                  <>
                    <span className="block ml-1">{Provider.location}</span>
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                  </>
                )}
              </Col>
            </Row>
          ) : null}
          {Provider && (Provider.name || Provider.location) ? <hr /> : null}
          <Row className="py-2">
            <Col span={12} className="flex items-center">
              <LearnAndEarnIcons learnAndEarn={pathway.learn_and_earn} />
            </Col>
            <Col span={12} className="flex flex-col items-right text-right">
              {(topics && topics.length && (
                <span className="text-gray-600 font-bold text-sm">TOPICS</span>
              )) ||
                null}
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
              <span className="font-bold text-gray-600 text-base">Cost</span>
              <br />
              <span className="font-bold text-black text-2xl relative bottom-1">
                {totalCost > 0 ? `$${totalCost}` : '---'}
              </span>
            </Col>
            <Col span={8} className="flex justify-center">
              <div>
                <span className="font-bold text-gray-600 text-base">
                  Credit
                </span>
                <br />
                <span className="font-bold text-black text-2xl relative bottom-1">
                  {totalCredit > 0 ? `${creditEarned}` : '---'}/
                  {totalCredit > 0 ? `${totalCredit}` : '---'}
                </span>
              </div>
            </Col>
            <Col span={8} className="flex flex-row-reverse">
              <div>
                <span className="font-bold text-gray-600 text-base">Pay</span>
                <br />
                <span className="font-bold text-black text-2xl relative bottom-1">
                  {totalPay > 0 ? `$${totalPay}` : '---'}
                </span>
              </div>
            </Col>
          </Row>
          <Row className="mt-1 justify-center items-center pb-3 pt-2">
            <Col className="flex flex-col items-center justify-center text-xl">
              <span className="block text-sm font-bold text-gray-600">
                Latest enrollment date
              </span>
              <div>
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  className="mr-1 relative"
                  style={{ bottom: '0.10rem' }}
                />
                <span>{latestEnrollmentDate || '---'}</span>
              </div>
            </Col>
          </Row>
        </Col>
        <Col
          className="bg-white infoRow__col pt-3 px-3 pb-4"
          style={{
            borderRadius: '1rem',
          }}
        >
          <Row className="justify-between items-center">
            <span className="block my-auto text-lg text-gray-600">Notes</span>
            {!openNotes && (
              <Button
                className="pl-2 rounded"
                type="primary"
                size="small"
                shape="circle"
                onClick={() => setOpenNotes(true)}
                icon={
                  <FontAwesomeIcon
                    className="relative"
                    style={{ left: 1 }}
                    icon={faEdit}
                  />
                }
              />
            )}
            {openNotes && (
              <div>
                <Button
                  className="px-2 rounded mr-1"
                  type="primary"
                  size="small"
                  shape="circle"
                  onClick={() => updatePathwayNotes(student_id, pathwayId)}
                  icon={<FontAwesomeIcon icon={faCheck} />}
                />
                <Button
                  className="px-2 rounded"
                  type="default"
                  size="small"
                  danger
                  shape="circle"
                  onClick={() => setOpenNotes(false)}
                  icon={<FontAwesomeIcon icon={faTimes} />}
                />
              </div>
            )}
          </Row>
          {openNotes && (
            <Form ref={setFormRef} form={form} className=" mt-2 h-auto">
              <Form.Item name="notes">
                <TextArea
                  className="rounded shadow-inner bg-gray-200"
                  style={{ minHeight: 200 }}
                  maxLength={510}
                />
              </Form.Item>
            </Form>
          )}
          {!openNotes && (
            <div
              style={{ minHeight: 200 }}
              className="w-full rounded bg-gray-100 p-2 mt-1"
            >
              <p>{notes}</p>{' '}
            </div>
          )}
        </Col>
      </div>
      <section
        className="mx-auto relative bg-white pt-2 pb-4 mt-12"
        style={{
          borderRadius: '1rem',
        }}
      >
        {
          <>
            <div
              className={`overflow-x-hidden ${
                !switchChart ? 'block' : 'hidden'
              }`}
            >
              <div className={`${toggleFilterByGroup ? 'chartWrapper' : ''}`}>
                <div
                  className={`chartAreaWrapper chartAreaWrapper--scaleUp mx-auto`}
                  style={{
                    width: `${chartWidth}px`,
                    height: 'auto',
                  }}
                >
                  <Carousel
                    className={`cursor-grab mb-4 ${
                      toggleFilterByGroup ? 'block' : 'hidden'
                    }`}
                    centerMode
                    infiniteLoop
                    centerSlidePercentage={100}
                    showArrows={true}
                    showIndicators={false}
                    swipeable={toggleFilterByGroup ? false : true}
                    emulateTouch={true}
                    showStatus={true}
                    showThumbs={false}
                    swipeScrollTolerance={1}
                    statusFormatter={handleCurrentItem}
                  >
                    {groupNames.map((group_name, index) => {
                      let data = {};
                      if (
                        groupChartData[group_name] &&
                        groupChartData[group_name].data
                      ) {
                        data = groupChartData[group_name].data;
                      }
                      return (
                        <UserPathwayChart
                          className="mx-auto"
                          groups={groups}
                          groupName={group_name}
                          key={index}
                          student={student}
                          pathway={pathway}
                          data={data}
                          redraw={true}
                        />
                      );
                    }) || 'N/A'}
                  </Carousel>
                </div>
              </div>
              <div className={`${toggleFilterByGroup ? '' : 'chartWrapper'}`}>
                <div
                  className={`chartAreaWrapper chartAreaWrapper--scaleUp mx-auto`}
                  style={{
                    width: `${chartWidth}px`,
                  }}
                >
                  <UserPathwayChart
                    className={`mb-2 ${
                      !toggleFilterByGroup ? 'block' : 'hidden'
                    }`}
                    groups={groups}
                    student={student}
                    pathway={pathway}
                    data={pathwayChartData}
                    redraw={true}
                  />
                </div>
              </div>
            </div>
            <ExpenseEarningChart
              className={`${!switchChart ? 'hidden' : 'block'}`}
              pathway={pathway}
              earningByGroup={earningByGroup}
              costByGroup={costByGroup}
            />
          </>
        }
        <div className="flex bg-white justify-end px-2">
          {!switchChart && (
            <Button
              className="flex justify-center items-center mx-2"
              type={toggleFilterByGroup ? 'primary' : 'default'}
              size="small"
              onClick={() => setToggleFilterByGroup(!toggleFilterByGroup)}
              disabled={groupNames && groupNames.length > 1 ? false : true}
            >
              Filter by group
            </Button>
          )}
          <Button
            className="rounded flex justify-center items-center"
            style={{ paddingRight: '1rem', paddingLeft: '1rem' }}
            type="primary"
            size="small"
            onClick={() => setSwitchChart(!switchChart)}
            icon={
              !switchChart ? (
                <FontAwesomeIcon icon={faChartBar} />
              ) : (
                <FontAwesomeIcon icon={faChartLine} />
              )
            }
          />
        </div>
      </section>
      <section>{children}</section>
    </div>
  );
}
