import React, { useEffect, useRef } from 'react';
import { Modal, Form, Table, Button, notification } from 'antd';
import ProviderForm from 'components/provider/ProviderForm';
import axiosInstance from 'services/AxiosInstance';
import { isNil, groupBy, orderBy, head, flowRight, mapValues } from 'lodash';
import { configure } from 'axios-hooks';
import useGlobalStore from 'store/GlobalStore';
import AuthService from 'services/AuthService';
import UploaderService from 'services/Uploader';
import { useImageAndBannerImage } from 'hooks';
import 'assets/scss/antd-overrides.scss';

configure({
  axios: axiosInstance,
});

const { Column } = Table;

const renderColumns = (nameTitle, descriptionTitle) => {
  return (
    <>
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
        title={nameTitle}
        dataIndex="name"
        key="name"
        render={(text, record) => ({
          children: text,
          props: {
            'data-title': nameTitle,
          },
        })}
      />
      <Column
        className="antd-col"
        title={descriptionTitle}
        dataIndex="description"
        key="index"
        render={(text, record) => {
          let children = 'N/A';
          if (text.length) {
            children = text;
          }
          return {
            children: children,
            props: {
              'data-title': descriptionTitle,
            },
          };
        }}
      />
    </>
  );
};

export default function ProviderUpdateModal(props) {
  const formRef = useRef(null);
  const { id: userId } = AuthService.currentSession;
  const [form] = Form.useForm();
  const { provider = {}, onCancel, visible, datafields, role } = props;
  const { Offers = [], Pathways = [] } = provider;

  const { provider: providerStore } = useGlobalStore();
  const [
    { file, newFile, onFileChange, setFile, onChangeFileUpload },
    {
      bannerFile,
      onBannerFileChange,
      newBannerFile,
      setBannerFile,
      onChangeBannerUpload,
    },
    reset,
  ] = useImageAndBannerImage();

  const groupedDataFields = groupBy(provider.DataFields, 'type') || [];
  let providerType = null;
  if (groupedDataFields.provider && groupedDataFields.provider.length) {
    providerType = groupedDataFields.provider[0].id;
  }

  let topics = [];

  if (!isNil(groupedDataFields.topic)) {
    topics = groupedDataFields.topic.reduce((acc, curr, index) => {
      if (isNil(acc)) {
        return [];
      }
      acc.push(curr.id);
      return acc;
    }, []);
  }

  function populateFields(p) {
    form.setFieldsValue({
      ...p,
      type: providerType,
      topics: topics,
    });
  }

  useEffect(() => {
    if (formRef.current) {
      populateFields(provider);
    }

    if (provider.Files) {
      let groupedFiles = flowRight([
        (v) =>
          mapValues(v, (f) =>
            orderBy(
              f,
              ['fileable_type', 'createdAt', 'id'],
              ['desc', 'desc', 'asc']
            )
          ),
        (v) => groupBy(v, 'meta'),
        (v) => v.filter((f) => f.fileable_type === 'provider'),
      ])(provider.Files);

      if (!onFileChange && groupedFiles[null]) {
        setFile(head(groupedFiles[null]));
      }
      if (!onBannerFileChange && groupedFiles['banner-image']) {
        setBannerFile(head(groupedFiles['banner-image']));
      }
    }
    return;
  }, [provider, provider.Files, formRef, file, bannerFile]);

  const submitUpdate = async () => {
    try {
      const values = await form.validateFields([
        'name',
        'location',
        'type',
        'learn_and_earn',
        'is_public',
        'industry',
        'description',
        'industry',
        'financial_aid',
        'credit',
        'news',
        'contact',
        'pay',
        'cost',
        'topics',
        'keywords',
        'is_local_promo',
        'is_main_promo',
        'external_url',
      ]);

      const { data, status } = await axiosInstance.put(
        `/providers/${provider.id}`,
        {
          ...values,
          topics: values.topics,
        }
      );

      const fileable_type = 'provider';
      let filePayload = [];

      if (data && userId) {
        const providerEntity = providerStore.entities[data.id];
        filePayload = [...providerEntity.Files];

        if (onFileChange && newFile) {
          const results = await UploaderService.uploadFile(newFile, {
            uploaded_by_user_id: userId,
            fileable_type,
            fileable_id: data.id,
          });

          if (results && results.file.data) {
            filePayload.push({
              ...results.file.data,
            });
          }

          if (results.success) {
            notification.success({
              message: 'Success',
              description: 'Main image is uploaded',
            });
          }
        }

        if (onBannerFileChange && newBannerFile) {
          const results = await UploaderService.uploadFile(newBannerFile, {
            uploaded_by_user_id: userId,
            fileable_type,
            fileable_id: data.id,
            meta: 'banner-image',
          });

          if (results && results.file.data) {
            filePayload.push({
              ...results.file.data,
            });
          }

          if (results.success) {
            notification.success({
              message: 'Success',
              description: 'Banner image is uploaded',
            });
          }
        }

        providerStore.updateOne(data);
      }

      if (status === 200) {
        if (filePayload.length) {
          let clonedData = Object.assign(data);
          clonedData.Files = filePayload;
          providerStore.updateOne(clonedData);
        }
        notification.success({
          message: status,
          description: 'Successfully updated provider',
        });
        onCancel();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      forceRender={true}
      className="custom-modal"
      title={'Update Provider'}
      visible={visible}
      width={998}
      bodyStyle={{ backgroundColor: '#f0f2f5', padding: 0 }}
      footer={true}
      onCancel={onCancel}
      afterClose={() => {
        reset();
      }}
    >
      <Form form={form} ref={formRef}>
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '32rem' }}>
          <ProviderForm
            role={role}
            datafields={datafields}
            userId={userId}
            onChangeUpload={onChangeFileUpload}
            file={file}
            bannerFile={bannerFile}
            onChangeBannerUpload={onChangeBannerUpload}
          />
          <section className="mt-2">
            <label className="mb-2 block">Courses - Table</label>
            <Table
              dataSource={Offers}
              rowClassName={() => 'antd-row'}
              className="ant-table-wrapper--responsive"
              rowKey="id"
              pagination={{ pageSize: 5 }}
            >
              {renderColumns('Offer Name', 'Offer Description')}
            </Table>
          </section>
          <section className="mt-2">
            <label className="mb-2 block">Curriculums - Table</label>
            <Table
              dataSource={Pathways}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              className="ant-table-wrapper--responsive w-full"
              rowClassName={() => 'antd-row'}
            >
              {renderColumns('Name', 'Description')}
            </Table>
          </section>
        </div>
        <section
          className="bg-white px-6 pt-5 pb-1 flex justify-center"
          style={{
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Button
            className="mr-3 px-10 rounded"
            size="small"
            type="primary"
            htmlType="submit"
            onClick={() => submitUpdate()}
          >
            Update
          </Button>
          <Button
            className="px-10 rounded"
            size="small"
            type="dashed"
            onClick={() => onCancel()}
          >
            Cancel
          </Button>
        </section>
      </Form>
    </Modal>
  );
}
