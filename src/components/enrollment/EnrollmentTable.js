import React, { useEffect, useState } from 'react';
import { Table, Popconfirm, Button, Input, Col, Select, Form, Row } from 'antd';
import axiosInstance from 'services/AxiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import EnrollmentStore from 'store/Enrollment';
import { EnrollModal } from 'components/enrollment';
import matchSorter from 'match-sorter';
import { useForm } from 'antd/lib/form/util';
import dayjs from 'dayjs';
import 'assets/scss/antd-overrides.scss';

const { Column } = Table;
const { Option } = Select;

const substituteStatuses = {
  Inactivate: 'Applied',
  Approved: 'Enrolled',
  Activated: 'Enrolled',
  Completed: 'Completed',
  Unenrolled: 'Unenrolled',
  Failed: 'Failed',
};

function renderGradeOptions(letter) {
  return (
    <>
      <Option value={letter + '+'}>{letter + '+'}</Option>
      <Option value={letter}>{letter}</Option>
      <Option value={letter + '-'}>{letter + '-'}</Option>
    </>
  );
}

function GradeScaleOptions(props) {
  const { name, initialValue, enrollment } = props;
  const [enablePointGradeScale, setEnablePointGradeScale] = useState(false);
  return (
    <div className="flex flex-no-wrap">
      <Form.Item
        name={name}
        className="w-64 my-auto"
        initialValue={initialValue}
      >
        <Select
          className="rounded-r rounded-l-none"
          disabled={enrollment.student_id ? false : true}
        >
          {!enablePointGradeScale && (
            <>
              {renderGradeOptions('A')}
              {renderGradeOptions('B')}
              {renderGradeOptions('C')}
              {renderGradeOptions('D')}
              <Option value={'F'}>F</Option>
            </>
          )}
          {enablePointGradeScale && (
            <>
              <Option value={4.0}>4.0</Option>
              <Option value={3.5}>3.5</Option>
              <Option value={3.0}>3.0</Option>
              <Option value={2.5}>2.5</Option>
              <Option value={2.0}>2.0</Option>
              <Option value={1.5}>1.5</Option>
              <Option value={1.0}>1.0</Option>
              <Option value={0.5}>0.5</Option>
              <Option value={0.0}>0.0</Option>
            </>
          )}
        </Select>
      </Form.Item>
      <Button
        className="px-2"
        onClick={() => setEnablePointGradeScale(!enablePointGradeScale)}
        type={!enablePointGradeScale ? 'default' : 'primary'}
      >
        4.0 Scale
      </Button>
    </div>
  );
}

export default function EnrollmentTable({
  activateCreditAssignment,
  dataSource = [],
  offer,
  students,
}) {
  let filteredDataSource = dataSource;
  let presetOfferName = null;

  if (offer) {
    filteredDataSource = dataSource.filter((enrollment) => {
      if (
        enrollment.offer_id === offer &&
        presetOfferName !== enrollment.Offer.name
      ) {
        presetOfferName = enrollment.Offer.name;
      }
      return enrollment.offer_id === offer;
    });
  }

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [form] = useForm();

  const enrollmentStore = EnrollmentStore.useContainer();

  const updateEnrollment = async (enrollment) => {
    return axiosInstance.put(`/enrollments/${enrollment.id}`, {
      status: 'Approved',
    });
  };

  const setStatusToApprove = async (enrollment) => {
    try {
      const response = await updateEnrollment(enrollment);

      if (response.status === 200) {
        enrollmentStore.updateOne(response.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleData = async () => {
    const value = await form.validateFields(['offer_name']);
    let offerName = '';
    if (value) {
      offerName = value.offer_name;
    }
    const results = matchSorter(dataSource, offerName, {
      keys: ['Offer.name'],
    });
    setEnrollments(results);
  };

  const reset = () => {
    form.setFieldsValue({
      offer_name: null,
    });
    setEnrollments(dataSource);
  };

  const offerNames = [];

  let name = null;
  for (let i = 0; i < dataSource.length; i++) {
    if (!dataSource[i] || !dataSource[i].Offer) {
      break;
    }
    name = dataSource[i].Offer.name;
    if (!offerNames.includes(name)) {
      offerNames.push(name);
    }
  }

  useEffect(() => {
    if (dataSource) {
      setEnrollments(filteredDataSource);
    }
  }, [dataSource]);

  return (
    <>
      <Table
        dataSource={enrollments}
        bordered
        className="ant-table-wrapper--responsive"
        rowClassName={() => 'antd-row'}
        rowKey="id"
        pagination={{ pageSize: 8 }}
      >
        <Column
          className="antd-col"
          title="Course Name"
          dataIndex="Offer"
          key="index"
          render={(offer) => {
            let children = 'N/A';
            if (offer && offer.name) {
              children = offer.name;
            }
            return {
              children,
              props: {
                'data-title': 'Course Name',
              },
            };
          }}
          filterIcon={(filtered) => (
            <FontAwesomeIcon
              style={{
                color: filtered ? '#1890ff' : undefined,
              }}
              icon={faSearch}
            />
          )}
          filterDropdown={(params) => {
            return (
              <Form
                form={form}
                initialValues={{
                  offer_name: presetOfferName,
                }}
              >
                <Col className="p-2 rounded">
                  <Form.Item className="mb-2" name="offer_name">
                    <Select
                      className="custom-select"
                      style={{ minWidth: '12rem' }}
                      showSearch
                    >
                      {offerNames.map((name, index) => {
                        return (
                          <Option key={index.toString()} value={name}>
                            {name}
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                  <div>
                    <Button
                      className="mr-2 rounded"
                      type="primary"
                      size="small"
                      onClick={handleData}
                    >
                      Search
                    </Button>
                    <Button
                      className="rounded"
                      type="default"
                      size="small"
                      onClick={reset}
                    >
                      Reset
                    </Button>
                  </div>
                </Col>
              </Form>
            );
          }}
        />
        <Column
          className="antd-col"
          title="Student ID"
          dataIndex="student_id"
          key="student_id"
          render={(text, record) => ({
            children: record.student_id ? (
              record.student_id
            ) : (
              <Button
                className="rounded"
                type="primary"
                onClick={() => {
                  setSelectedEnrollment(record);
                  setEnrollModalOpen(true);
                }}
              >
                Enroll Student
              </Button>
            ),
            props: {
              'data-title': 'Student ID',
            },
          })}
        />
        <Column
          className="antd-col"
          title="Activation Code"
          dataIndex="activation_code"
          key="activation_code"
          render={(text, record) => ({
            children: text || 'N/A',
            props: {
              'data-title': 'Activation Code',
            },
          })}
        />
        <Column
          className="antd-col"
          title="Credit"
          dataIndex="credit"
          key="credit"
          width={200}
          render={(credit, enrollment) => {
            const { id, credit: _credit } = enrollment;
            return {
              children: activateCreditAssignment ? (
                <Row className="p-0 items-center flex-no-wrap">
                  <span
                    className="px-1 bg-gray-100 border bordered border-r-none rounded-l flex items-center"
                    style={{ height: 32 }}
                  >
                    Score
                  </span>
                  <GradeScaleOptions
                    name={`enrollment_${id}`}
                    initialValue={_credit}
                    enrollment={enrollment}
                  />
                </Row>
              ) : (
                credit || 'N/A'
              ),
              props: {
                'data-title': 'Credit',
              },
            };
          }}
          filterIcon={(filtered) => (
            <FontAwesomeIcon
              style={{
                color: filtered ? '#1890ff' : undefined,
              }}
              icon={faSearch}
            />
          )}
          filterDropdown={(params) => {
            return (
              <Col className="p-2 rounded">
                <Input
                  className="mb-2 w-48 rounded"
                  placeholder="Search credit"
                  disabled
                />
                <div>
                  <Button
                    disabled
                    className="mr-2 rounded"
                    type="primary"
                    size="small"
                    icon={<FontAwesomeIcon className="mr-1" icon={faSearch} />}
                  >
                    Search
                  </Button>
                  <Button
                    disabled
                    className="rounded"
                    type="default"
                    size="small"
                  >
                    Reset
                  </Button>
                </div>
              </Col>
            );
          }}
        />
        <Column
          className="antd-col"
          title="Status"
          dataIndex="status"
          key="status"
          render={(status, enrollment) => {
            status = substituteStatuses[status];
            if (!enrollment.student_id && enrollment.status === 'Inactivate') {
              status = 'Inactivate';
            }
            return {
              children: status,
              props: {
                'data-title': 'Status',
              },
            };
          }}
        />
        <Column
          title="Start Date"
          className="antd-col"
          dataIndex="start_date"
          key="start_date"
          render={(date, record, index) => {
            return {
              children: date ? dayjs(date).format('MM-DD-YYYY') : 'N/A',
              props: {
                'data-title': 'Start Date',
              },
            };
          }}
        />
        <Column
          className="antd-col"
          title="Action"
          key="index"
          render={(enrollment) => {
            return {
              children: (
                <Popconfirm
                  title={() => (
                    <p style={{ maxWidth: '15em' }}>
                      Do you want to approve this student’s enrollment in this
                      course?
                    </p>
                  )}
                  onConfirm={() => setStatusToApprove(enrollment)}
                  okText="Yes"
                  cancelText="No"
                  disabled={enrollment.status === 'Approved' ? true : null}
                >
                  <span
                    style={{
                      color:
                        enrollment.status === 'Approved'
                          ? '#cbd5e0'
                          : '#1890ff',
                      cursor:
                        enrollment.status === 'Approved'
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    Approve
                  </span>
                </Popconfirm>
              ),
              props: {
                'data-title': 'Action',
              },
            };
          }}
        />
      </Table>
      <EnrollModal
        enrollment={selectedEnrollment}
        visible={enrollModalOpen}
        students={students}
        onCancel={() => setEnrollModalOpen(false)}
      />
    </>
  );
}
