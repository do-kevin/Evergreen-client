import React, { useEffect, useState } from 'react';
import { imported } from 'react-imported-component/macro';
import { useHistory } from 'react-router-dom';
import { Card, Layout, Col } from 'antd';
import useAxios, { configure } from 'axios-hooks';
import PathwaysTable from 'components/pathway/PathwaysTable';
import useGlobalStore from 'store/GlobalStore';
import axiosInstance from 'services/AxiosInstance';
import matchSorter from 'match-sorter';
import {
  SearchHeader,
  ProviderLogOutTopbar,
  FaPlusCircleButton,
} from 'components/shared';

const FormModal = imported(() => import('components/shared/FormModal'));

const PathwayCreationContainer = imported(() =>
  import('components/pathway/PathwayCreationContainer')
);

const PathwayUpdateModal = imported(() =>
  import('components/pathway/PathwayUpdateModal')
);

configure({
  axios: axiosInstance,
});

const { Content } = Layout;

export default function PathwayContainer({
  role,
  providerId,
  openProviderUpdateModal,
}) {
  const [searchString, setSearchString] = useState('');
  const history = useHistory();
  const [modalStates, setModalStates] = useState({
    pathwayCreation: false,
    pathwayUpdate: false,
  });
  const [selectedPathway, setSelectedPathway] = useState({});
  const {
    datafield,
    provider: providerStore,
    pathway: pathwayStore,
    offer: offerStore,
  } = useGlobalStore();

  let getPathwaysUrl =
    role === 'provider'
      ? `/pathways?scope=with_details&provider_id=${providerId}`
      : '/pathways?scope=with_details';

  const [{ data: getPathways, error: getPathwaysError }] = useAxios(
    getPathwaysUrl
  );

  const [{ data: getDataFields, error: getDataFieldsError }] = useAxios(
    '/datafields'
  );

  const [{ data: getOffers, error: getOffersError }] = useAxios('/offers');

  let getProviderUrl =
    role === 'provider' ? `/providers/${providerId}` : '/providers';

  const [{ data: getProviders }] = useAxios(getProviderUrl);

  const openAndPopulateUpdateModal = (pathway) => {
    setSelectedPathway(pathway);
    setModalStates({ ...modalStates, pathwayUpdate: true });
  };

  if (getPathwaysError || getOffersError || getDataFieldsError) {
    history.push('/error/500');
  }

  useEffect(() => {
    if (getPathways) {
      pathwayStore.addMany(getPathways);
    }
    if (getOffers) {
      offerStore.addMany(getOffers);
    }
    if (getProviders) {
      if (role === 'provider') {
        providerStore.addOne(getProviders);
      } else {
        providerStore.addMany(getProviders);
      }
    }
    if (getDataFields) {
      datafield.addMany(getDataFields);
    }
  }, [getPathways, getOffers, getProviders, getDataFields]);

  const handleDataAfterSearch = (data, keys = ['name', 'keywords']) => {
    return matchSorter(data, searchString, { keys });
  };

  const handleDataSearch = (searchVal) => {
    return setSearchString(searchVal);
  };

  let showData = handleDataAfterSearch(Object.values(pathwayStore.entities));

  if (role === 'provider') {
    showData = showData.filter((p) => {
      return p.provider_id === providerId;
    });
  }

  return (
    <Layout className="bg-transparent">
      <ProviderLogOutTopbar role={role} onClick={openProviderUpdateModal}>
        <Col span={14}>
          <SearchHeader title="CURRICULUMS" onSearch={handleDataSearch}>
            <FaPlusCircleButton
              onMouseEnter={() => {
                FormModal.preload();
                PathwayCreationContainer.preload();
              }}
              onClick={() =>
                setModalStates({ ...modalStates, pathwayCreation: true })
              }
              text="CURRICULUM"
            />
          </SearchHeader>
        </Col>
      </ProviderLogOutTopbar>
      <Content className="p-6">
        <Card className="shadow-md rounded-md">
          <PathwaysTable
            datafields={datafield.entities}
            providers={providerStore.entities}
            data={showData}
            handleUpdateModal={openAndPopulateUpdateModal}
            offers={offerStore.entities}
          />
          <FormModal
            title="New Curriculum"
            visible={modalStates.pathwayCreation}
            FormComponent={PathwayCreationContainer}
            role={role}
            providerId={providerId}
            onCancel={() =>
              setModalStates({ ...modalStates, pathwayCreation: false })
            }
          />
          <PathwayUpdateModal
            pathway={selectedPathway}
            visible={modalStates.pathwayUpdate}
            onCancel={() =>
              setModalStates({ ...modalStates, pathwayUpdate: false })
            }
            pathwayStore={pathwayStore}
            role={role}
            providers={Object.values(providerStore.entities)}
          />
        </Card>
      </Content>
    </Layout>
  );
}
