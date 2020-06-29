import React, { PureComponent } from 'react';
import { Table } from 'antd';
import { flowRight, uniqBy, sortBy, uniqueId } from 'lodash';
import dayjs from 'dayjs';

const { Column } = Table;

class MiniOfferTable extends PureComponent {
  render() {
    let { groupOfOffers = [], offerStore } = this.props;

    groupOfOffers = flowRight([
      (g) => sortBy(g, (date) => new Date(date.createdAt)),
      (g) => uniqBy(g, 'offer_id'),
    ])(groupOfOffers);

    return (
      <Table
        dataSource={groupOfOffers}
        pagination={{ position: ['topRight'], pageSize: 4 }}
        rowKey={(record) => {
          return uniqueId(record.group_name + '__');
        }}
      >
        <Column
          dataIndex="group_name"
          render={(text, record, index) => ({
            children: index + 1,
          })}
        />
        <Column
          title="Offer"
          dataIndex="offer_id"
          key="offer_id"
          render={(offerId, record, index) => {
            const offer = offerStore ? offerStore.entities[offerId] : null;
            return {
              children: offer ? offer.name : '',
            };
          }}
        />
        <Column
          title="Created"
          dataIndex="offer_id"
          key="createdAt"
          render={(offerId, record, index) => {
            const offer = offerStore ? offerStore.entities[offerId] : null;
            if (!offer) {
              return {
                children: null,
              };
            }
            return {
              children: offer.createdAt
                ? dayjs(offer.createdAt).format('MM-DD-YYYY')
                : null,
            };
          }}
        />
      </Table>
    );
  }
}

export default MiniOfferTable;
