import React, { useEffect, useState } from 'react';
import { imported } from 'react-imported-component/macro';
import { useHistory } from 'react-router-dom';
import { Card, Drawer, Button, message, Layout, Col } from 'antd';
import useAxios, { configure } from 'axios-hooks';
import OfferTable from 'components/offer/OfferTable';
import useGlobalStore from 'store/GlobalStore';
import axiosInstance from 'services/AxiosInstance';
import {
  SearchHeader,
  ProviderLogOutTopbar,
  FaPlusCircleButton,
} from 'components/shared';
import matchSorter from 'match-sorter';

const { Content } = Layout;

const FormModal = imported(() => import('components/shared/FormModal'));

const OfferCreationContainer = imported(() =>
  import('components/offer/OfferCreationContainer')
);

const OfferUpdateModal = imported(() =>
  import('components/offer/OfferUpdateModal')
);

const BatchEnrollmentModal = imported(() =>
  import('components/enrollment/BatchEnrollmentModal')
);

configure({
  axios: axiosInstance,
});

export default function OfferContainer(props) {
  const [searchString, setSearchString] = useState('');
  const { basePath, openProviderUpdateModal, role, providerId } = props;
  const history = useHistory();
  const [openable, setOpenable] = useState({
    drawer: false,
    updateModal: false,
    batchEnrollModal: false,
    formModal: false,
  });
  const [selectedOffer, setSelectedOffer] = useState({});
  const { datafield, provider, offer: offerStore } = useGlobalStore();
  const { entities = [] } = offerStore;

  const [{ data: getProviderData = [], error: providerError }] = useAxios(
    '/providers?scope=with_datafields'
  );

  const [{ data: datafieldsData, error: datafieldError }] = useAxios(
    '/datafields'
  );

  let getOffersUrl =
    role === 'provider'
      ? `/offers?scope=with_details&provider_id=${providerId}`
      : '/offers?scope=with_details';

  const [{ data: offersData, error: offerError }] = useAxios(getOffersUrl);

  const openAndPopulateUpdateModal = (offer) => {
    setSelectedOffer(offer);
    setOpenable({
      ...openable,
      updateModal: true,
    });
  };

  const handleRowSelection = (record, rowIndex) => {
    if (record) {
      setSelectedOffer(record);
      setOpenable({
        ...openable,
        drawer: true,
      });
      return;
    }
    message.error("Could not receive course's information.");
  };

  const openBatchEnrollmentModal = () => {
    setOpenable({
      ...openable,
      batchEnrollModal: true,
      drawer: true,
    });
  };

  const viewEnrollments = (offer) => {
    if (offer) {
      history.push(`${basePath}/enrollments?offer=${offer.id}`);
      return;
    }
    message.error("Could not receive course's information.");
  };

  if (providerError || datafieldError || offerError) {
    history.push('/error/500');
  }

  const handleDataAfterSearch = (data, keys = ['name', 'keywords']) => {
    return matchSorter(data, searchString, { keys });
  };

  const handleDataSearch = (searchVal) => {
    return setSearchString(searchVal);
  };

  let showData = handleDataAfterSearch(Object.values(entities));

  if (role === 'provider') {
    showData = showData.filter((offer) => {
      return offer.provider_id === providerId;
    });
  }

  useEffect(() => {
    if (getProviderData) {
      provider.addMany(getProviderData);
    }
    if (datafieldsData) {
      datafield.addMany(datafieldsData);
    }
    if (offersData) {
      offerStore.addMany(offersData);
    }
  }, [getProviderData, datafieldsData, offersData]);

  return (
    <Layout className="bg-transparent">
      <ProviderLogOutTopbar role={role} onClick={openProviderUpdateModal}>
        <Col span={14}>
          <SearchHeader title="COURSES" onSearch={handleDataSearch}>
            <FaPlusCircleButton
              onMouseEnter={() => {
                FormModal.preload();
                OfferCreationContainer.preload();
              }}
              onClick={() => setOpenable({ ...openable, formModal: true })}
              text="COURSE"
            />
          </SearchHeader>
        </Col>
      </ProviderLogOutTopbar>
      <Content className="p-6">
        <Card className="shadow-md rounded-md">
          <OfferTable
            datafields={datafield.entities}
            providers={provider.entities}
            data={showData}
            handleUpdateModal={openAndPopulateUpdateModal}
            handleRowSelection={handleRowSelection}
            viewEnrollments={viewEnrollments}
            role={role}
          />
          <FormModal
            title="New Course"
            visible={openable.formModal}
            FormComponent={OfferCreationContainer}
            role={role}
            providerId={providerId}
            onCancel={() => setOpenable({ ...openable, formModal: false })}
          />
          <OfferUpdateModal
            offer={selectedOffer}
            visible={openable.updateModal}
            onCancel={() => setOpenable({ ...openable, updateModal: false })}
            offerStore={offerStore}
            scopedToProvider={false}
            role={role}
          />
          <Drawer
            placement="bottom"
            visible={openable.drawer}
            onClose={() => setOpenable({ ...openable, drawer: false })}
            height={85}
          >
            <Button
              className="rounded"
              type="primary"
              onClick={() => openBatchEnrollmentModal()}
              onMouseEnter={() => BatchEnrollmentModal.preload()}
            >
              Batch Enroll
            </Button>
            <BatchEnrollmentModal
              offer={selectedOffer}
              visible={openable.batchEnrollModal}
              onSubmit={() =>
                setOpenable({
                  ...openable,
                  batchEnrollModal: false,
                  drawer: false,
                })
              }
              onCancel={() =>
                setOpenable({
                  ...openable,
                  batchEnrollModal: false,
                })
              }
            />
          </Drawer>
        </Card>
      </Content>
    </Layout>
  );
}
