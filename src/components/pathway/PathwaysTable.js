import React from 'react';
import { Table, Tag, Button } from 'antd';
import { groupBy } from 'lodash';
import 'assets/scss/antd-overrides.scss';

const { Column } = Table;

function PathwaysTable(props) {
  const { data, handleUpdateModal, providers } = props;
  return (
    <Table
      dataSource={data}
      bordered
      className="ant-table-wrapper--responsive"
      rowClassName={() => 'antd-row'}
      rowKey="id"
      pagination={{ pageSize: 8 }}
    >
      <Column
        className="antd-col"
        title="ID"
        dataIndex="id"
        key="id"
        render={(text, record) => ({
          children: text,
          props: {
            'data-title': 'ID',
          },
        })}
      />
      <Column
        className="antd-col"
        title="Name"
        dataIndex="name"
        key="name"
        render={(text, record) => ({
          children: text,
          props: {
            'data-title': 'Name',
          },
        })}
      />
      <Column
        className="antd-col"
        title="Provider"
        dataIndex="provider_id"
        key="provider_id"
        render={(id, record) => {
          let children = 'N/A';
          if (providers[id]) {
            children = providers[id].name;
          }
          return {
            children: children,
            props: { 'data-title': 'Provider' },
          };
        }}
      />
      <Column
        className="antd-col"
        title="Generic Type"
        dataIndex="type"
        key="type"
        render={(text, record) => ({
          children: text,
          props: {
            'data-title': 'Generic Type',
          },
        })}
      />
      <Column
        className="antd-col"
        title="Course Groups"
        dataIndex="GroupsOfOffers"
        key="index"
        render={(groups, record) => {
          let children = 'N/A';

          const grouped = groupBy(groups, 'group_name');
          const groupNames = Object.keys(grouped);

          if (groupNames.length) {
            children = (
              <>
                {groupNames.map((group_name, index) => {
                  const count = grouped[group_name].length;
                  return (
                    <Tag
                      color={index % 2 ? 'cyan' : 'green'}
                      key={index.toString()}
                    >
                      {`${group_name} ( ${count} )`}
                    </Tag>
                  );
                }) || 'N/A'}
              </>
            );
          }

          return {
            children,
            props: {
              'data-title': 'Course Groups',
            },
          };
        }}
      />
      <Column
        className="antd-col"
        title="Topics"
        dataIndex="DataFields"
        key="DataFields"
        render={(datafields = [], record) => {
          let children = 'N/A';

          if (datafields.length) {
            children = (
              <>
                {datafields.map((datafield, index) => {
                  if (datafield.type !== 'topic') {
                    return null;
                  }
                  return (
                    <Tag
                      color={index % 2 ? 'blue' : 'orange'}
                      key={index.toString()}
                    >
                      {datafield.name}
                    </Tag>
                  );
                }) || 'N/A'}
              </>
            );
          }

          return {
            children,
            props: {
              'data-title': 'Topics',
            },
          };
        }}
      />
      <Column
        className="antd-col"
        title=""
        key="update"
        render={(text, record) => ({
          children: (
            <Button type="link" onClick={() => handleUpdateModal(record)}>
              Update
            </Button>
          ),
          props: {
            'data-title': '',
          },
        })}
      />
    </Table>
  );
}

export default PathwaysTable;
