import React from 'react';
import AuthService from 'services/AuthService';
import { useParams, Redirect, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { reactLocalStorage } from 'reactjs-localstorage';

import axiosInstance from 'services/AxiosInstance';
import useAxios, { configure } from 'axios-hooks';
import RoleSelectionScreen from 'screens/RoleSelectionScreen/RoleSelectionScreen';
import EmailNotVerifiedScreen from 'screens/EmailNotVerifiedScreen';

configure({
  axios: axiosInstance,
});

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function UserAuth({ user_id }) {
  const [{ data: myProfile, loading, error }] = useAxios(`/users/${user_id}`);

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Spin size="large" />
      </div>
    );
  } else if (error) {
    return <Redirect to={{ pathname: '/error/500' }} />;
  } else {
    if (!myProfile.role) {
      return (
        <Redirect to={{ pathname: 'role_selection', state: { user_id } }} />
      );
    }

    AuthService.setCurrentSession({
      ...myProfile,
    });

    switch (myProfile.role) {
      case 'student': {
        const offerId = reactLocalStorage.get('offer_id');
        if (offerId) {
          reactLocalStorage.remove('offer_id');
          return <Redirect to={{ pathname: `/home/offer/${offerId}` }} />;
        }
        const pathwayId = reactLocalStorage.get('pathway_id');
        if (pathwayId) {
          reactLocalStorage.remove('pathway_id');
          return <Redirect to={{ pathname: `/home/pathway/${pathwayId}` }} />;
        }
        return <Redirect to={{ pathname: `/home/student` }} />;
      }
      case 'provider':
        return (
          <Redirect to={{ pathname: `/dashboard/${myProfile.provider_id}` }} />
        );
      case 'admin':
        return <Redirect to={{ pathname: '/dashboard' }} />;
      default:
        return <Redirect to={{ pathname: '/' }} />;
    }
  }
}

function Auth() {
  const params = useParams();
  const { action } = params;
  const query = useQuery();
  const user_id = query.get('user_id');

  switch (action) {
    case 'email_not_verified':
      return <EmailNotVerifiedScreen />;
    case 'role_selection':
      return <RoleSelectionScreen />;
    case 'logout':
      AuthService.logout();
      return <Redirect to={{ pathname: '/' }} />;
    case 'user':
      if (!user_id) {
        return <Redirect to={{ pathname: '/error/500' }} />;
      }
      return <UserAuth user_id={user_id} />;
    default:
      return <Redirect to={{ pathname: '/' }} />;
  }
}

export default Auth;
