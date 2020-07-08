import React, { useEffect, useState, useRef } from 'react';
import { Modal, Form, Button, notification } from 'antd';
import useAxios, { configure } from 'axios-hooks';
import axiosInstance from 'services/AxiosInstance';
import DataFieldStore from 'store/DataField';
import PathwayForm from 'components/pathway/PathwayForm';
import {
  groupBy,
  isNil,
  orderBy,
  map,
  head,
  reject,
  sortBy,
  mapValues,
  flowRight,
} from 'lodash';
import AuthService from 'services/AuthService';
import UploaderService from 'services/Uploader';
import OfferStore from 'store/Offer';
import { useImageAndBannerImage } from 'hooks';
import 'assets/scss/antd-overrides.scss';

configure({
  axios: axiosInstance,
});

export default function PathwayUpdateModal({
  pathway,
  onCancel,
  visible,
  pathwayStore,
  providers,
  role,
}) {
  const formRef = useRef(null);
  const { id: userId, provider_id } = AuthService.currentSession;
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

  const [groupsOfOffers, setGroupsOfOffers] = useState([]);

  const [form] = Form.useForm();
  const datafieldStore = DataFieldStore.useContainer();
  const offerStore = OfferStore.useContainer();
  const [{ error: putError }, updatePathway] = useAxios(
    {
      method: 'PUT',
    },
    { manual: true }
  );

  const submitUpdate = async () => {
    try {
      const values = await form.validateFields([
        'description',
        'learn_and_earn',
        'frequency',
        'frequency_unit',
        'name',
        'topics',
        'outlook',
        'earnings',
        'type',
        'keywords',
        'provider_id',
        'is_local_promo',
        'is_main_promo',
        'external_url',
      ]);

      let groupOrderByYearNum = [];
      let groups_of_offers = map(groupsOfOffers, (g) => {
        const year = form.getFieldValue(g.group_name);
        groupOrderByYearNum.push(g.group_name);
        const results = {
          group_name: g.group_name,
          offer_ids: g.removed ? [] : map(g.offers, 'offer_id'),
          year,
        };
        const semester = form.getFieldValue(`${g.group_name}_semester`) || null;

        if (semester) {
          return {
            ...results,
            semester,
            year,
          };
        }

        return results;
      });

      const groupOrder = await form.validateFields(groupOrderByYearNum);
      let yearSubmission = [];
      for (const key in groupOrder) {
        yearSubmission.push({
          group_name: key,
          year: groupOrder[key],
        });
      }

      yearSubmission = sortBy(yearSubmission, ['year']).map(
        ({ group_name }) => group_name
      );

      const { data, status } = await updatePathway({
        url: `/pathways/${pathway.id}`,
        data: {
          ...values,
          group_sort_order: yearSubmission,
          groups_of_offers,
        },
      });

      const fileable_type = 'pathway';
      let filePayload = [];

      if (data && userId) {
        const pathwayEntity = pathwayStore.entities[data.id];
        filePayload = [...pathwayEntity.Files];

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
      }

      if (data) {
        pathwayStore.updateOne(data);
      }

      if (status === 200) {
        if (filePayload.length) {
          let clonedData = Object.assign(data);
          clonedData.Files = filePayload;
          pathwayStore.updateOne(clonedData);
        }
        notification.success({
          message: status,
          description: 'Successfully updated pathway',
        });
        onCancel();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const groupedDataFields = groupBy(pathway.DataFields, 'type') || [];

  let myTopics = [];

  if (!isNil(groupedDataFields.topic)) {
    myTopics = groupedDataFields.topic.reduce((acc, curr, index) => {
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
      frequency_unit: Number(p.frequency_unit),
      topics: myTopics,
    });
  }

  useEffect(() => {
    if (formRef.current) {
      populateFields(pathway);
    }

    if (formRef.current && role === 'provider') {
      if (providerEntities.length) {
        providerEntities = reject(providerEntities, (p) => {
          return !(p.id === provider_id);
        });

        form.setFieldsValue({
          provider_id: head(providerEntities).id || null,
        });
      }
    }

    if (putError) {
      const { status, statusText } = putError.request;
      notification.error({
        message: status,
        description: statusText,
      });
    }

    if (pathway.Files) {
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
        (v) => v.filter((f) => f.fileable_type === 'pathway'),
      ])(pathway.Files);

      if (!onFileChange && groupedFiles[null]) {
        setFile(head(groupedFiles[null]));
      }
      if (!onBannerFileChange && groupedFiles['banner-image']) {
        setBannerFile(head(groupedFiles['banner-image']));
      }
    }
  }, [pathway, putError, formRef, file, bannerFile]);

  let providerEntities = providers;

  return (
    <Modal
      forceRender={true}
      className="custom-modal"
      title={'Update Curriculum'}
      visible={visible}
      width={998}
      bodyStyle={{ backgroundColor: '#f0f2f5', padding: 0 }}
      footer={true}
      onCancel={onCancel}
      afterClose={() => {
        reset();
      }}
    >
      <Form
        form={form}
        ref={formRef}
        initialValues={{
          provider_id:
            role === 'provider' && providers && providers.length
              ? head(providers).id
              : null,
        }}
      >
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '32rem' }}>
          <PathwayForm
            pathway={pathway}
            datafields={datafieldStore.entities}
            offers={Object.values(offerStore.entities)}
            groupsOfOffers={groupsOfOffers}
            setGroupsOfOffers={setGroupsOfOffers}
            userId={userId}
            onChangeUpload={onChangeFileUpload}
            file={file}
            bannerFile={bannerFile}
            onChangeBannerUpload={onChangeBannerUpload}
            providers={providerEntities}
            role={role}
            form={form}
            offerStore={offerStore}
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
            onClick={submitUpdate}
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
