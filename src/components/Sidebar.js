import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout, Menu, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faDollarSign,
  faHandHoldingUsd,
  faTree,
  faRoute,
  faCog,
  faNewspaper,
} from '@fortawesome/free-solid-svg-icons';
import { findIndex } from 'lodash';

const { Sider } = Layout;

const routesList = (role) => {
  return [
    {
      path: 'providers',
      name: 'Providers',
      icon: faTree,
      enabled: role === 'admin',
    },
    {
      path: 'offers',
      name: 'Courses',
      icon: faDollarSign,
      enabled: ['admin', 'provider'].includes(role),
    },
    {
      path: 'enrollments',
      name: 'Enrollments',
      icon: faHandHoldingUsd,
      enabled: ['admin', 'provider'].includes(role),
    },
    {
      path: 'pathways',
      name: 'Curriculums',
      icon: faRoute,
      enabled: ['admin', 'provider'].includes(role),
    },
    {
      path: 'promotions',
      name: 'Promotions',
      icon: faNewspaper,
      enabled: role === 'admin',
    },
    {
      path: 'settings',
      name: 'Settings',
      icon: faCog,
      enabled: role === 'admin',
    },
  ];
};

function Sidebar(props) {
  const { role, history, match } = props;
  const { url: basePath } = match;
  const route = history.location.pathname;
  const currentRoute = route.split('/').pop();
  const [collapsed, setCollapse] = useState(true);
  const toggleSider = () => {
    setCollapse(!collapsed);
  };

  let routes = routesList(role).filter((i) => i.enabled);

  let selectedKeys = currentRoute
    ? findIndex(routes, (r) => r.path === currentRoute)
    : 1;

  return (
    <Sider
      className="min-h-full bg-green-500"
      trigger={null}
      collapsible
      collapsed={collapsed}
    >
      <div className="flex justify-center bg-green-600">
        <Button
          className="mx-auto h-12 w-full"
          type="link"
          onClick={() => toggleSider()}
        >
          <FontAwesomeIcon className="text-white" icon={faBars} />
        </Button>
      </div>
      <Menu
        className="bg-green-500"
        theme="dark"
        selectedKeys={[selectedKeys.toString()]}
      >
        {routes.map(({ path, name, icon }, index) => (
          <Menu.Item
            className="bg-green-500 text-center text-white bg-green-800-selected"
            style={{ marginTop: 0, marginBottom: 0 }}
            key={index.toString()}
            title={name}
          >
            <Link to={`${basePath}/${path}`}>
              <FontAwesomeIcon className="text-white" icon={icon} />
              {collapsed ? null : ' ' + name}
            </Link>
          </Menu.Item>
        ))}
      </Menu>
    </Sider>
  );
}

export default Sidebar;
