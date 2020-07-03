import React, { useState, useEffect } from 'react';
import { Layout, Button, Empty, Popover, Switch, Row, Col } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import matchSorter from 'match-sorter';
import useAxios, { configure } from 'axios-hooks';
import axiosInstance from 'services/AxiosInstance';
import { LogOutTopbar, SearchHeader, TitleDivider } from 'components/shared';
import useGlobalStore from 'store/GlobalStore';
import PromoteCard from 'components/promotion/PromoteCard/PromoteCard';

configure({
  axios: axiosInstance,
});

const { Content } = Layout;

export default function (props) {
  const { session } = props;
  const adminId = session.id;
  const [searchString, setSearchString] = useState('');
  const [showPromoted, setShowPromoted] = useState(true);
  const [filters, setFilters] = useState({
    offer: true,
    pathway: true,
    provider: true,
  });
  const {
    provider: providerStore,
    pathway: pathwayStore,
    offer: offerStore,
  } = useGlobalStore();

  const [{ data: getPathways }] = useAxios('/pathways?scope=with_files');

  const [{ data: getOffers }] = useAxios('/offers?scope=with_files');

  const [{ data: getProviders }] = useAxios('/providers?scope=with_files');

  const offers = Object.values(offerStore.entities).map((o) => {
    return {
      ...o,
      entity_type: 'offer',
    };
  });

  const providers = Object.values(providerStore.entities).map((p) => {
    return {
      ...p,
      entity_type: 'provider',
    };
  });

  const pathways = Object.values(pathwayStore.entities).map((p) => {
    return {
      ...p,
      entity_type: 'pathway',
    };
  });

  const data = [...offers, ...pathways, ...providers];

  function toggleFilter(key = 'offer') {
    setFilters({
      ...filters,
      [key]: !filters[key],
    });
  }

  function filterContent() {
    return (
      <div>
        <Row className="justify-between mb-1" gutter={6}>
          <Col>Providers</Col>
          <Col>
            <Switch
              size="small"
              defaultChecked={filters.provider}
              onClick={() => toggleFilter('provider')}
            />
          </Col>
        </Row>
        <Row className="justify-between mb-1" gutter={6}>
          <Col>Courses</Col>
          <Col>
            <Switch
              size="small"
              defaultChecked={filters.offer}
              onClick={() => toggleFilter('offer')}
            />
          </Col>
        </Row>
        <Row className="justify-between" gutter={6}>
          <Col>Curriculums</Col>
          <Col>
            <Switch
              size="small"
              defaultChecked={filters.pathway}
              onClick={() => toggleFilter('pathway')}
            />
          </Col>
        </Row>
      </div>
    );
  }

  const handleDataSearch = (searchVal) => {
    return setSearchString(searchVal);
  };

  const handleOnChange = (event) => {
    if (showPromoted) {
      setShowPromoted(false);
    }
    if (event.target.value.length === 0) {
      setShowPromoted(true);
    }
    setSearchString(event.target.value);
  };

  const handleDataAfterSearch = (data, keys = ['name', 'keywords']) => {
    return matchSorter(data, searchString, { keys });
  };

  let showData = handleDataAfterSearch(data);

  if (showPromoted) {
    showData = showData.filter((d) => {
      if (
        filters.offer &&
        d.entity_type === 'offer' &&
        (d.is_main_promo || d.is_local_promo)
      ) {
        return true;
      }

      if (
        filters.provider &&
        d.entity_type === 'provider' &&
        (d.is_main_promo || d.is_local_promo)
      ) {
        return true;
      }

      if (
        filters.pathway &&
        d.entity_type === 'pathway' &&
        (d.is_main_promo || d.is_local_promo)
      ) {
        return true;
      }
      return false;
    });
  } else {
    showData = showData.filter((d) => {
      if (filters.offer && d.entity_type === 'offer') {
        return true;
      }

      if (filters.provider && d.entity_type === 'provider') {
        return true;
      }

      if (filters.pathway && d.entity_type === 'pathway') {
        return true;
      }
      return false;
    });
  }

  useEffect(() => {
    if (getPathways) {
      pathwayStore.addMany(getPathways);
    }
    if (getOffers) {
      offerStore.addMany(getOffers);
    }
    if (getProviders) {
      providerStore.addMany(getProviders);
    }
  }, [getPathways, getOffers, getProviders]);

  return (
    <Layout className="bg-transparent h-auto">
      <LogOutTopbar>
        <SearchHeader
          title="PROMOTIONS"
          onSearch={handleDataSearch}
          onChange={handleOnChange}
        >
          <Popover content={filterContent} trigger="click">
            <Button
              className="rounded ml-1 px-4 text-center"
              type="primary"
              size="small"
            >
              <FontAwesomeIcon className="text-white text-xs" icon={faFilter} />
            </Button>
          </Popover>
        </SearchHeader>
      </LogOutTopbar>
      <Content className="p-6">
        <TitleDivider
          title="My Promotions"
          styles={{
            leftContainer: {
              backgroundColor: '#4a5568',
            },
            rightContainer: {
              backgroundColor: '#4a5568',
            },
          }}
        />
        <div className="shadow-md rounded-md w-full bg-white h-full pt-4 px-5 flex flex-wrap mb-1">
          {(showData.length &&
            showData
              .filter(function ({
                main_promoted_by_user_ids,
                local_promoted_by_user_ids,
              }) {
                return (
                  main_promoted_by_user_ids.includes(adminId) ||
                  local_promoted_by_user_ids.includes(adminId)
                );
              })
              .map((d, index) => {
                return <PromoteCard key={index} data={d} session={session} />;
              })) || <Empty className="m-auto" />}
        </div>
        <TitleDivider
          title="Other Promotions	&amp; Search Results"
          styles={{
            leftContainer: {
              backgroundColor: '#4a5568',
            },
            rightContainer: {
              backgroundColor: '#4a5568',
            },
          }}
        />
        <main className="shadow-md rounded-md w-full bg-white h-full pt-4 px-5 flex flex-wrap">
          {(showData.length &&
            showData.map((d, index) => {
              return <PromoteCard key={index} data={d} session={session} />;
            })) || <Empty className="m-auto" />}
        </main>
      </Content>
    </Layout>
  );
}
