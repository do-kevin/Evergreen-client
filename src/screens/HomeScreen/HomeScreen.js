import React, { useState, useEffect } from 'react';
import {
  Layout,
  Row,
  Col,
  Button,
  Popover,
  Input,
  Checkbox,
  Select,
  Switch,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSignInAlt,
  faUser,
  faArrowLeft,
  faSearch,
  faTimes,
  faHome,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { TopicCarouselContainer } from 'components/student';
import PromoCarouselsContainer from 'components/promotion/PromoCarouselsContainer/PromoCarouselsContainer';
import {
  Route,
  withRouter,
  useRouteMatch,
  useHistory,
  Link,
  Redirect,
} from 'react-router-dom';
import { imported } from 'react-imported-component/macro';
import matchSorter from 'match-sorter';
import { find } from 'lodash';
import useAxios, { configure } from 'axios-hooks';
import axiosInstance from 'services/AxiosInstance';
import AuthService from 'services/AuthService';
import useGlobalStore from 'store/GlobalStore';
import './home-screen.scss';

configure({
  axios: axiosInstance,
});

const { Header, Content } = Layout;
const { Search } = Input;
const { Option } = Select;

const OfferInfoContainer = imported(() =>
  import('components/student/OfferInfoContainer')
);

const ProviderInfoContainer = imported(() =>
  import('components/student/ProviderInfoContainer')
);

const PathwayInfoContainer = imported(() =>
  import('components/student/PathwayInfoContainer')
);

const StudentDashboard = imported(() =>
  import('components/student/StudentDashboard/StudentDashboard')
);

const SearchResultContainer = imported(() =>
  import('components/SearchResultContainer/SearchResultContainer')
);

function HomeScreen() {
  const [searchString, setSearchString] = useState('');
  const [filters, setFilters] = useState({
    offer: true,
    pathway: true,
    provider: true,
    learn: false,
    earn: false,
  });
  const {
    datafield: datafieldStore,
    provider: providerStore,
    pathway: pathwayStore,
    offer: offerStore,
  } = useGlobalStore();
  const [toggeables, setToggeables] = useState({
    search: false,
    popover: false,
  });
  const [results, setResults] = useState([]);

  const handleVisibleChange = (visible) => {
    setToggeables({
      ...toggeables,
      popover: visible,
    });
  };

  let match = useRouteMatch();
  const history = useHistory();

  const session = AuthService.currentSession;

  const [{ data: getDataFields }] = useAxios('/datafields?scope=with_offers');

  const [{ data: getPathways }] = useAxios('/pathways?scope=with_details');

  const [{ data: getOffers }] = useAxios('/offers?scope=with_details');

  const [{ data: getProviders }] = useAxios('/providers?scope=with_details');

  const offers = Object.values(offerStore.entities).map((o) => {
    return { ...o, entity_type: 'offer' };
  });

  const providers = Object.values(providerStore.entities).map((p) => {
    return { ...p, entity_type: 'provider' };
  });

  const pathways = Object.values(pathwayStore.entities).map((p) => {
    return { ...p, entity_type: 'pathway' };
  });

  const data = [...offers, ...pathways, ...providers];

  const handleSearch = (e) => {
    if (!e) {
      return '';
    }
    setSearchString(e.target.value);
    if (searchString.length > 0) {
      setToggeables({
        ...toggeables,
        isSearching: true,
      });
    } else {
      setToggeables({
        ...toggeables,
        isSearching: false,
      });
    }
    return searchString;
  };

  function handleLearnCheckbox(e) {
    setFilters({
      ...filters,
      learn: e.target.checked,
    });
  }

  function handleEarnCheckbox(e) {
    setFilters({
      ...filters,
      earn: e.target.checked,
    });
  }

  const handleDataAfterSearch = (data, keys = ['name', 'keywords']) => {
    return matchSorter(data, searchString, { keys });
  };

  const topics = Object.values(datafieldStore.entities).filter((df) => {
    return df.type === 'topic';
  });

  let showData = handleDataAfterSearch(data).filter((d) => {
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

  if (filters.learn && !filters.earn) {
    showData = showData.filter((d) => {
      if (!d.learn_and_earn) {
        return false;
      }
      return d.learn_and_earn === 'learn';
    });
  }

  if (filters.earn && !filters.learn) {
    showData = showData.filter((d) => {
      if (!d.learn_and_earn) {
        return false;
      }
      return d.learn_and_earn === 'earn';
    });
  }

  if (filters.earn && filters.learn) {
    showData = showData.filter((d) => {
      if (!d.learn_and_earn) {
        return false;
      }
      return d.learn_and_earn === 'both';
    });
  }

  function toggleFilter(key) {
    if (!key) {
      return;
    }
    setFilters({
      ...filters,
      [key]: !filters[key],
    });
  }

  function onSelectChange(dataFieldId) {
    const filteredByTopic = showData.filter((d) => {
      return find(d.DataFields, ['id', dataFieldId]);
    });
    setResults(filteredByTopic);
  }

  useEffect(() => {
    if (getDataFields) {
      datafieldStore.addMany(getDataFields);
    }
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

  const { search, popover } = toggeables;

  return (
    <Layout className="homeScreen h-full bg-gray-100">
      <div className="homeScreen__contentWrapper w-full bg-gray-100 pb-6">
        <Content className="homeScreen__carouselContent mx-auto h-auto bg-gray-100">
          {(!search && (
            <>
              <Route exact path={`${match.url}`}>
                <PromoCarouselsContainer />
                <div className="homeScreen__carouselContentTwo mx-auto">
                  <TopicCarouselContainer />
                </div>
              </Route>
              <div className="homeScreen__carouselContentTwo mx-auto">
                <Route
                  path={`${match.url}/offer/:id`}
                  component={(props) => (
                    <OfferInfoContainer {...props} session={session} />
                  )}
                />
                <Route
                  path={`${match.url}/pathway/:id`}
                  component={(props) => (
                    <PathwayInfoContainer {...props} session={session} />
                  )}
                />
                <Route
                  path={`${match.url}/provider/:id`}
                  component={ProviderInfoContainer}
                />
                <Route
                  exact
                  path={`${match.url}/student`}
                  component={(props) => {
                    return (
                      (session && session.role === 'student' && (
                        <StudentDashboard
                          {...props}
                          session={session}
                          toggeables={toggeables}
                          setToggeables={setToggeables}
                        />
                      )) || <Redirect to="/error/401" />
                    );
                  }}
                />
              </div>
            </>
          )) || (
            <div className="homeScreen__carouselContentTwo mx-auto">
              <SearchResultContainer
                data={results.length ? results : showData}
                setToggeables={setToggeables}
                toggeables={toggeables}
              />
            </div>
          )}
        </Content>
      </div>
      <Header className="homeScreen__navWrapper h-12 w-full bg-green-500 fixed bottom-0 z-10">
        <Row className="homeScreen__navbar mx-auto h-full">
          <Col span={!search ? 8 : 3} className="flex items-center">
            <div className="inherit">
              <Button
                className="mr-2"
                type="primary"
                shape="circle"
                onClick={() => {
                  history.goBack();
                  setToggeables({
                    ...toggeables,
                    search: false,
                    isSearching: false,
                  });
                }}
              >
                <FontAwesomeIcon className="text-white" icon={faArrowLeft} />
              </Button>
              <Button
                className="homeScreen__homeButton mr-2 p-0 z-10"
                type="primary"
                shape="circle"
              >
                <Link
                  className="flex w-full h-full"
                  to="/"
                  onClick={() => {
                    setToggeables({
                      ...toggeables,
                      search: false,
                      isSearching: false,
                    });
                  }}
                >
                  <FontAwesomeIcon
                    className="text-white m-auto"
                    icon={faHome}
                  />
                </Link>
              </Button>
            </div>
          </Col>
          <Col
            span={!search ? 8 : 18}
            className="flex justify-center items-center h-full"
          >
            {(!search && (
              <Row className="flex justify-center items-center select-none">
                <span className="homeScreen__brandName font-bold flex items-center">
                  SCHOOL SECTOR
                </span>
              </Row>
            )) || (
              <div className="flex flex-row">
                <Search
                  className="rounded-l rounded-r-none custom-searchbox"
                  onChange={handleSearch}
                  addonAfter={
                    <Popover
                      trigger="click"
                      placement="topRight"
                      content={
                        <Row gutter={8} style={{ width: 297 }}>
                          <Col className="w-full">
                            <Select
                              className="w-full mb-2"
                              size="small"
                              placeholder="Topics"
                              allowClear
                              onChange={onSelectChange}
                            >
                              {topics.map((t, index) => {
                                return (
                                  <Option
                                    className="text-xs"
                                    value={t.id}
                                    key={index}
                                  >
                                    {t.name}
                                  </Option>
                                );
                              })}
                            </Select>
                            <div>
                              <Checkbox
                                checked={filters.learn}
                                onChange={handleLearnCheckbox}
                              >
                                Learn
                              </Checkbox>
                              <Checkbox
                                checked={filters.earn}
                                onChange={handleEarnCheckbox}
                              >
                                Earn
                              </Checkbox>
                            </div>
                            <Row className="justify-between mb-1" gutter={6}>
                              <Col>Providers</Col>
                              <Col>
                                <Switch
                                  size={'small'}
                                  defaultChecked={filters.provider}
                                  onClick={() => toggleFilter('provider')}
                                />
                              </Col>
                            </Row>
                            <Row className="justify-between mb-1" gutter={6}>
                              <Col>Offers</Col>
                              <Col>
                                <Switch
                                  size="small"
                                  defaultChecked={filters.offer}
                                  onClick={() => toggleFilter('offer')}
                                />
                              </Col>
                            </Row>
                            <Row className="justify-between" gutter={6}>
                              <Col>Pathways</Col>
                              <Col>
                                <Switch
                                  size="small"
                                  defaultChecked={filters.pathway}
                                  onClick={() => toggleFilter('pathway')}
                                />
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                      }
                    >
                      <div className="h-full w-full px-3">
                        <FontAwesomeIcon
                          className="text-white"
                          icon={faFilter}
                        />
                      </div>
                    </Popover>
                  }
                />
              </div>
            )}
          </Col>
          <Col
            span={!toggeables.search ? 8 : 3}
            className="flex justify-end items-center h-full"
          >
            {search && (
              <>
                <Button
                  className="mr-2"
                  danger
                  type="primary"
                  shape="circle"
                  onClick={() =>
                    setToggeables({
                      ...toggeables,
                      search: false,
                      isSearching: false,
                    })
                  }
                >
                  <FontAwesomeIcon className="text-white" icon={faTimes} />
                </Button>
              </>
            )}
            {!search && (
              <Button
                className="mr-2"
                type="primary"
                shape="circle"
                onClick={() =>
                  setToggeables({
                    ...toggeables,
                    search: true,
                  })
                }
              >
                <FontAwesomeIcon className="text-white" icon={faSearch} />
              </Button>
            )}
            {(session && session.role === 'student' && (
              <div>
                <Popover
                  trigger="click"
                  placement="topRight"
                  visible={popover}
                  onVisibleChange={handleVisibleChange}
                  content={
                    <div className="flex flex-col items-start">
                      <Link
                        to={`${match.url}/student`}
                        style={{ borderBottom: '1px solid #edf2f7' }}
                        onClick={() =>
                          setToggeables({
                            ...toggeables,
                            search: false,
                            popover: false,
                          })
                        }
                      >
                        <Button
                          type="link"
                          className="py-0 px-0 pr-6 text-gray-500"
                          size="small"
                        >
                          User Pathway
                        </Button>
                      </Link>
                      <Button
                        type="link"
                        className="py-0 px-0 pr-6 text-gray-500"
                        size="small"
                        onClick={() => AuthService.logout()}
                      >
                        Sign out
                      </Button>
                    </div>
                  }
                >
                  <Button type="primary" shape="circle">
                    <FontAwesomeIcon className="text-white" icon={faUser} />
                  </Button>
                </Popover>
              </div>
            )) || (
              <Button
                type="primary"
                shape="circle"
                onClick={() => {
                  window.location.replace(
                    `${process.env.REACT_APP_API_URL}/login`
                  );
                }}
              >
                <FontAwesomeIcon className="text-white" icon={faSignInAlt} />
              </Button>
            )}
          </Col>
        </Row>
      </Header>
    </Layout>
  );
}

export default withRouter(HomeScreen);
