import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import useGlobalStore from 'store/GlobalStore';
import axiosInstance from 'services/AxiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { TitleDivider } from 'components/shared';

import useAxios, { configure } from 'axios-hooks';
import { Card, Input, Button, Row, Col, Form } from 'antd';
import { filter, groupBy, property } from 'lodash';

configure({
  axios: axiosInstance,
});

export default function SelectOptionsContainer(props) {
  const history = useHistory();
  const { datafield: datafieldStore } = useGlobalStore();
  const [form] = Form.useForm();

  const [{ data: getData, error: getDataError }] = useAxios(
    '/datafields?type=frequency_unit&type=part_of_day_unit&type=credit_unit&type=payment_unit&type=length_unit'
  );

  if (getDataError) {
    history.push('/error/500');
  }

  const [{ data: postData }, executePost] = useAxios(
    {
      url: '/datafields',
      method: 'POST',
    },
    { manual: true }
  );

  async function createSelectOption(fieldValue) {
    if (!fieldValue) {
      return;
    }
    const data = form.getFieldValue(fieldValue);
    if (!data || !data.length) {
      return;
    }
    await executePost({
      data: {
        name: data,
        type: fieldValue,
      },
    });
    form.resetFields([fieldValue]);
  }

  async function deleteDataField(id) {
    const response = await axiosInstance.delete(`/datafields/${id}`);
    if (response.status === 200) {
      datafieldStore.removeOneByIdKey(id);
    }
  }

  useEffect(() => {
    if (getData) {
      datafieldStore.addMany(getData);
    }
    if (postData) {
      datafieldStore.addOne(postData);
    }
  }, [getData, postData]);

  const filtered = filter(
    Object.values(datafieldStore.entities),
    (datafield) =>
      datafield.type === 'frequency_unit' ||
      datafield.type === 'part_of_day_unit' ||
      datafield.type === 'credit_unit' ||
      datafield.type === 'payment_unit' ||
      datafield.type === 'length_unit' ||
      datafield.type === 'cost_unit'
  );

  const grouped = groupBy(filtered, property('type'));

  const {
    frequency_unit = [],
    part_of_day_unit = [],
    credit_unit = [],
    payment_unit = [],
    length_unit = [],
    cost_unit = [],
  } = grouped;

  const fields = [
    {
      fieldName: 'frequency_unit',
      title: 'Frequency Units',
      group: frequency_unit,
    },
    {
      fieldName: 'part_of_day_unit',
      title: 'Day/Time Options',
      group: part_of_day_unit,
    },
    {
      fieldName: 'credit_unit',
      title: 'Credits Units Options',
      group: credit_unit,
    },
    {
      fieldName: 'payment_unit',
      title: 'Payment Units Options',
      group: payment_unit,
    },
    {
      fieldName: 'length_unit',
      title: 'Length Units Options',
      group: length_unit,
    },
    {
      fieldName: 'cost_unit',
      title: 'Cost Units Options',
      group: cost_unit,
    },
  ];

  return (
    <Card title="Custom Select Options" className="shadow-md rounded-md mb-4">
      <div>
        <Form form={form}>
          {fields.map(({ title, fieldName, group }, index) => {
            return (
              <div key={index}>
                <TitleDivider title={title} />
                <Row className="flex-wrap pr-2" gutter={[10, 10]}>
                  {group.map((unit, index) => {
                    return (
                      <Col
                        lg={4}
                        md={6}
                        sm={24}
                        xs={24}
                        key={index.toString()}
                        className="h-10"
                      >
                        <div className="flex row">
                          <span className="border border-solid rounded-l px-1 w-full h-6">
                            {unit.name}
                          </span>
                          <Button
                            className="flex justify-center rounded-l-none rounded-r items-center"
                            type="primary"
                            size="small"
                            danger
                            onClick={() => deleteDataField(unit.id)}
                          >
                            <FontAwesomeIcon
                              className="text-xs"
                              icon={faMinus}
                            />
                          </Button>
                        </div>
                      </Col>
                    );
                  })}
                  <Col lg={4} md={6} sm={24} className="h-10">
                    <Form.Item
                      name={fieldName}
                      className="relative"
                      style={{ bottom: 4 }}
                    >
                      <Row>
                        <Col span={22}>
                          <Input
                            className="rounded-l rounded-r-none h-6 w-full"
                            name={fieldName}
                          />
                        </Col>
                        <Col span={2}>
                          <Button
                            className="rounded-l-none rounded-r"
                            type="primary"
                            size="small"
                            htmlType="submit"
                            onClick={() => createSelectOption(fieldName)}
                          >
                            <FontAwesomeIcon
                              className="text-xs"
                              icon={faPlus}
                            />
                          </Button>
                        </Col>
                      </Row>
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            );
          })}
        </Form>
      </div>
    </Card>
  );
}
