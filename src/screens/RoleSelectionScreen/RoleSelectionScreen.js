import React from 'react';
import { withRouter, Redirect } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChalkboardTeacher,
  faUserGraduate,
  faUsersCog,
} from '@fortawesome/free-solid-svg-icons';
import { get } from 'lodash';

import AuthService from 'services/AuthService';
import axiosInstance from 'services/AxiosInstance';
import './role-selection-screen.scss';

import { Layout, Row, Col, Card, Button, Alert } from 'antd';
const { Content } = Layout;

function RoleSelectionScreen(props) {
  const { history, location } = props;

  const user_id = get(location, 'state.user_id');

  if (!user_id) {
    return <Redirect to={{ pathname: '/' }} />;
  }

  const roles = [
    {
      name: 'Administrator',
      type: 'admin',
      icon: faUsersCog,
    },
    {
      name: 'Provider',
      type: 'provider',
      icon: faChalkboardTeacher,
    },
    {
      name: 'Student',
      type: 'student',
      icon: faUserGraduate,
    },
  ];

  const createUserProfile = async (role) => {
    try {
      let user;
      if (role === 'provider') {
        const { data } = await axiosInstance.post('/providers', {
          user_id,
        });
        ({ data: user } = await axiosInstance.put(`/users/${user_id}`, {
          role,
          provider_id: data.id,
        }));
      } else {
        const { data } = await axiosInstance.post('/students', {
          user_id,
        });
        ({ data: user } = await axiosInstance.put(`/users/${user_id}`, {
          role,
          student_id: data.id,
        }));

        AuthService.setCurrentSession(user);
        history.push(`/`);
        return;
      }

      AuthService.setCurrentSession(user);
      history.push(`/dashboard/${user.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  if (!user_id) {
    return <Redirect to={{ pathname: '/error/500' }} />;
  }

  return (
    <Layout className="h-full bg-gray-300">
      <div className="w-full bg-gray-300">
        <Content className="mx-auto max-w-6xl h-full bg-gray-300 flex items-center flex-col justify-center selection">
          <h2 className="text-4xl mt-12 mb-6 question font-medium font-bold uppercase">
            Select Your User Type
          </h2>
          <Row className="w-full justify-around user-selection-row" gutter={8}>
            {roles.map(({ name, type, icon }) => {
              return (
                <Col className="flex justify-center">
                  <Button
                    className="h-full"
                    type="link"
                    onClick={() => createUserProfile(type)}
                  >
                    <Card
                      className="w-72 h-88 rounded user-card flex justify-center flex-col border-none"
                      cover={
                        <FontAwesomeIcon
                          className="mx-auto bordered text-blue-600 user-card__icon"
                          style={{
                            fontSize: '8rem',
                            color: 'rgba(0, 0, 0, 0.85)',
                          }}
                          icon={icon}
                        />
                      }
                    >
                      <span
                        className="text-xl"
                        style={{ color: 'rgb(57, 107, 86)' }}
                      >
                        {name}
                      </span>
                    </Card>
                  </Button>
                </Col>
              );
            })}
          </Row>
          <Alert
            className="text-center rounded mt-4 mx-4"
            type="warning"
            message="Administrator selection is currently available for demonstrative purposes."
          />
        </Content>
      </div>
    </Layout>
  );
}

export default withRouter(RoleSelectionScreen);
