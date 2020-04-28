import React, { useEffect, useState } from 'react';
import { Modal, Form, Button, notification } from 'antd';
import ProviderSimpleForm from 'components/provider/ProviderSimpleForm';
import axiosInstance from 'services/AxiosInstance';
import { orderBy } from 'lodash';
import ProviderStore from 'store/Provider';
import AuthService from 'services/AuthService';
import UploaderService from 'services/Uploader';
import 'scss/antd-overrides.scss';

export default function ProviderSimpleUpdateModal(props) {
  const providerStore = ProviderStore.useContainer();
  const { id: userId } = AuthService.currentSession;
  const [form] = Form.useForm();
  const formRef = React.createRef();
  const { provider = {}, onCancel, visible } = props;

  const [file, setFile] = useState(null);

  const onChangeUpload = (e) => {
    const { file } = e;
    if (file) {
      setFile(file);
    }
  };

  function populateFields(p, ref) {
    ref.current.setFieldsValue({
      name: p.name,
      location: p.location,
      description: p.description,
    });
  }

  useEffect(() => {
    formRef.current = form;
    if (formRef.current) {
      populateFields(provider, formRef);
    }

    if (provider.Files) {
      const orderedFiles = orderBy(
        provider.Files,
        ['fileable_type', 'createdAt'],
        ['desc', 'desc']
      );
      for (let i = 0; i < orderedFiles.length; i++) {
        if (!orderedFiles[i]) {
          break;
        }

        if (orderedFiles[i].fileable_type === 'provider') {
          setFile(orderedFiles[i]);
          break;
        }
      }
    }
  }, [props, form, provider, provider.Files]);

  const submitUpdate = async () => {
    const values = form.getFieldsValue([
      'name',
      'location',
      'industry',
      'description',
    ]);

    try {
      const response = await axiosInstance.put(
        `/providers/${provider.id}`,
        values
      );

      if (response && response.status === 200) {
        if (response.data && file && userId) {
          const { name, type } = file;
          await UploaderService.upload({
            name,
            mime_type: type,
            uploaded_by_user_id: userId,
            fileable_type: 'provider',
            fileable_id: response.data.id,
            binaryFile: file.originFileObj,
          });
        }

        providerStore.updateOne(response.data);
        notification.success({
          message: response.status,
          description: 'Successfully updated provider',
        });
        onCancel();
      }
    } catch (e) {
      console.error(e);
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
        setFile(null);
      }}
    >
      <Form form={form}>
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '32rem' }}>
          <ProviderSimpleForm
            userId={userId}
            onChangeUpload={onChangeUpload}
            file={file}
          />
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
