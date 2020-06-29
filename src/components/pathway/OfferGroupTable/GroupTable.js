import React, { Component } from 'react';
import { Form, Select, Table, Popconfirm, InputNumber, Row } from 'antd';
import { each, map, indexOf, uniqueId, head, uniqBy } from 'lodash';
import OfferStore from 'store/Offer';
import MiniOfferTable from './MiniOfferTable';

const { Option } = Select;
const { Column } = Table;

function getOfferOptions({ existingOffers = [] }) {
  const Store = OfferStore.useContainer();
  const { entities = {} } = Store;
  const offers = Object.values(entities);

  const allOptions = offers.map((offer, index) => (
    <Option value={offer.id} key={index}>
      {offer.name}
    </Option>
  ));

  const defaultValues = uniqBy(
    map(existingOffers, (o) => {
      return o.offer_id;
    })
  );

  return { allOptions, defaultValues };
}

class GroupTable extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.groupsData === nextProps.groupsData) {
      return false;
    }
    return true;
  }
  render() {
    const {
      groupsData,
      offerStore,
      onChangeAlsoValidate,
      pathway,
      updateGroupHandler,
      removeGroupHandler,
    } = this.props;

    return (
      <Table
        dataSource={groupsData}
        size="small"
        bordered
        className="ant-table-wrapper--responsive w-full mt-1"
        rowClassName={() => 'antd-row'}
        rowKey={(record) => {
          return uniqueId(record.group_name + '__');
        }}
      >
        <Column
          className="antd-col"
          title="Offer Group"
          dataIndex="group_name"
          key="group_name"
          render={(groupNameText, { offers }, index) => {
            const firstOffer = head(offers);
            let totalCost = 0;
            let totalPay = 0;
            let totalCredit = 0;
            each(offers, function (o) {
              if (offerStore && offerStore.entities[o.offer_id]) {
                const offer = offerStore.entities[o.offer_id];
                totalCost += offer.cost;
                totalPay += offer.pay;
                totalCredit += offer.credit;
              }
            });
            let defaultVal = null;
            if (pathway && pathway.group_sort_order) {
              defaultVal = indexOf(pathway.group_sort_order, groupNameText);
            }
            return {
              children: (
                <ul key={groupNameText + '__' + index}>
                  <li className="font-bold">{groupNameText}</li>
                  <li>Cost: ${totalCost}</li>
                  <li>Pay: ${totalPay}</li>
                  <li>Credit: {totalCredit}</li>
                  <li>
                    <Row className="items-center" style={{ width: 130 }}>
                      Year:
                      <Form.Item
                        className="my-auto mx-1"
                        name={groupNameText}
                        initialValue={defaultVal ? defaultVal + 1 : index + 1}
                        rules={[
                          { required: true, message: 'Please set a year' },
                        ]}
                      >
                        <InputNumber
                          size="small"
                          min={1}
                          max={groupsData.length}
                          onChange={onChangeAlsoValidate}
                        />
                      </Form.Item>
                    </Row>
                  </li>
                  <li>
                    <Row
                      className="items-center flex-no-wrap"
                      style={{ width: 130 }}
                    >
                      Semester:
                      <Form.Item
                        className="my-auto mx-1 w-full"
                        name={`${groupNameText}_semester`}
                        initialValue={
                          firstOffer && firstOffer.semester
                            ? firstOffer.semester
                            : 'fall'
                        }
                        rules={[
                          { required: true, message: 'Please set a semester' },
                        ]}
                      >
                        <Select size="small" style={{ minWidth: '6rem' }}>
                          <Option value="fall">Fall</Option>
                          <Option value="winter">Winter</Option>
                          <Option value="spring">Spring</Option>
                          <Option value="summer">Summer</Option>
                        </Select>
                      </Form.Item>
                    </Row>
                  </li>
                </ul>
              ),
              props: {
                'data-title': 'Offer Group',
              },
            };
          }}
        />
        <Column
          className="antd-col"
          title="Offers"
          dataIndex="inputName"
          key="inputName"
          render={(inputName, record) => {
            const { defaultValues, allOptions } = getOfferOptions({
              existingOffers: record.offers,
            });
            return {
              children: (
                <Form.Item className="my-auto" name={inputName}>
                  <MiniOfferTable
                    groupOfOffers={record.offers}
                    offerStore={offerStore}
                  />
                  <Select
                    className="mt-1 w-full rounded custom-select-rounded-tr-none"
                    showSearch
                    mode="multiple"
                    defaultValue={defaultValues}
                    onChange={(value) =>
                      updateGroupHandler(record.group_name, value)
                    }
                  >
                    {allOptions}
                  </Select>
                </Form.Item>
              ),
              props: {
                'data-title': 'Offers',
              },
            };
          }}
        />
        <Column
          className="antd-col"
          title="Action"
          render={(text, record, index) => ({
            children: (
              <Popconfirm
                key={index}
                className="text-red-500 cursor-pointer"
                title="Are you sure you want to delete this group?"
                onConfirm={() => removeGroupHandler(record.group_name)}
                okText="Yes"
                cancelText="No"
              >
                Remove
              </Popconfirm>
            ),
            props: {
              'data-title': 'Action',
            },
          })}
        />
      </Table>
    );
  }
}

function GroupTableHOC(props) {
  const offerStore = OfferStore.useContainer();
  return <GroupTable {...props} offerStore={offerStore} />;
}

export default GroupTableHOC;
