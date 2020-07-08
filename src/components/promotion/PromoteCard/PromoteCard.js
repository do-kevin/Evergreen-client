import React from 'react';
import { Button, Popconfirm } from 'antd';
import { last, findIndex } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-regular-svg-icons';
import axiosInstance from 'services/AxiosInstance';
import useGlobalStore from 'store/GlobalStore';
import './promote-card.scss';

export default function ({ data = {}, session }) {
  const renameEntities = {
    provider: 'provider',
    offer: 'course',
    pathway: 'curriculum',
  };
  const { provider, offer, pathway } = useGlobalStore();
  const adminId = session.id;

  const update = async (id, endpoint, data, container) => {
    if (!id || !endpoint || !data) {
      return;
    }
    const response = await axiosInstance.put(
      `/${endpoint}/${id}?scope=with_files`,
      data
    );
    container.updateOne(response.data);
    return response;
  };

  const removeAdminId = (nameOfUserIdArr, userIdsArr, incomingPromoData) => {
    const foundAdminIndex = findIndex(userIdsArr, function (item) {
      return item === adminId;
    });
    const newMainPromotedByUserIds = userIdsArr;
    newMainPromotedByUserIds.splice(foundAdminIndex, 1);
    return {
      ...incomingPromoData,
      [nameOfUserIdArr]: newMainPromotedByUserIds,
    };
  };

  const includeAdminId = (promoData, nameOfUserIdArr, userIdArr) => {
    const newObj = {
      ...promoData,
      [nameOfUserIdArr]: [...userIdArr, adminId],
    };
    return newObj;
  };

  function togglePromo(data, promoType) {
    const {
      is_local_promo,
      entity_type,
      is_main_promo,
      local_promoted_by_user_ids,
      main_promoted_by_user_ids,
    } = data;
    let localPromoData = { is_local_promo: !is_local_promo };
    let mainPromoData = { is_main_promo: !is_main_promo };
    const resetPromoData = {
      is_main_promo: false,
      is_local_promo: false,
      local_promoted_by_user_ids: [],
      main_promoted_by_user_ids: [],
    };

    if (entity_type === 'offer') {
      if (promoType === 'local') {
        if (localPromoData.is_local_promo) {
          localPromoData = includeAdminId(
            localPromoData,
            'local_promoted_by_user_ids',
            local_promoted_by_user_ids
          );
        } else {
          localPromoData = removeAdminId(
            'local_promoted_by_user_ids',
            local_promoted_by_user_ids,
            localPromoData
          );
        }

        return update(data.id, 'offers', localPromoData, offer);
      }
      if (promoType === 'main') {
        if (mainPromoData.is_main_promo) {
          mainPromoData = includeAdminId(
            mainPromoData,
            'main_promoted_by_user_ids',
            main_promoted_by_user_ids
          );
        } else {
          mainPromoData = removeAdminId(
            'main_promoted_by_user_ids',
            main_promoted_by_user_ids,
            mainPromoData
          );
        }

        return update(data.id, 'offers', mainPromoData, offer);
      }
      return update(data.id, 'offers', resetPromoData, offer);
    }
    if (entity_type === 'provider') {
      if (promoType === 'local') {
        if (localPromoData.is_local_promo) {
          localPromoData = includeAdminId(
            localPromoData,
            'local_promoted_by_user_ids',
            local_promoted_by_user_ids
          );
        } else {
          localPromoData = removeAdminId(
            'local_promoted_by_user_ids',
            local_promoted_by_user_ids,
            localPromoData
          );
        }
        return update(data.id, 'providers', localPromoData, provider);
      }
      if (promoType === 'main') {
        if (mainPromoData.is_main_promo) {
          mainPromoData = includeAdminId(
            mainPromoData,
            'main_promoted_by_user_ids',
            main_promoted_by_user_ids
          );
        } else {
          mainPromoData = removeAdminId(
            'main_promoted_by_user_ids',
            main_promoted_by_user_ids,
            mainPromoData
          );
        }
        return update(data.id, 'providers', mainPromoData, provider);
      }
      return update(data.id, 'providers', resetPromoData, provider);
    }
    if (entity_type === 'pathway') {
      if (promoType === 'local') {
        if (localPromoData.is_local_promo) {
          localPromoData = includeAdminId(
            localPromoData,
            'local_promoted_by_user_ids',
            local_promoted_by_user_ids
          );
        } else {
          localPromoData = removeAdminId(
            'local_promoted_by_user_ids',
            local_promoted_by_user_ids,
            localPromoData
          );
        }
        return update(data.id, 'pathways', localPromoData, pathway);
      }
      if (promoType === 'main') {
        if (mainPromoData.is_main_promo) {
          mainPromoData = includeAdminId(
            mainPromoData,
            'main_promoted_by_user_ids',
            main_promoted_by_user_ids
          );
        } else {
          mainPromoData = removeAdminId(
            'main_promoted_by_user_ids',
            main_promoted_by_user_ids,
            mainPromoData
          );
        }
        return update(data.id, 'pathways', mainPromoData, pathway);
      }
      return update(data.id, 'pathways', resetPromoData, pathway);
    }
    return;
  }

  function confirm(e) {
    togglePromo(data);
  }

  let themeBorder = 'promote-card--offerBorder';
  let themeBackground = 'promote-card--offerBg';

  if (data && data.entity_type === 'provider') {
    themeBorder = 'promote-card--providerBorder';
    themeBackground = 'promote-card--providerBg';
  }

  if (data && data.entity_type === 'pathway') {
    themeBorder = 'promote-card--pathwayBorder';
    themeBackground = 'promote-card--pathwayBg';
  }

  return (
    <div
      className={`promote-card h-auto w-48 mr-3 mb-3 rounded border border-solid ${themeBorder} shadow`}
    >
      <header
        className={`py-1 px-2 text-center capitalize ${themeBackground}`}
        style={{
          borderTopRightRadius: '0.20rem',
          borderTopLeftRadius: '0.20rem',
        }}
      >
        {data && data.entity_type ? renameEntities[data.entity_type] : ''}
      </header>
      <figure className="block bg-gray-200">
        {(data && data.Files && data.Files.length && (
          <img
            className="object-cover mx-auto"
            style={{ height: 112 }}
            src={
              data.Files && data.Files.length
                ? last(data.Files).file_link
                : null
            }
            alt=""
          />
        )) || (
          <div className="mx-auto p-6">
            <FontAwesomeIcon
              className="text-6xl text-gray-400 mx-auto block"
              icon={faImage}
            />
          </div>
        )}
      </figure>
      <div className="flex flex-col pb-2 px-2">
        <span className="text-base break-all">
          {data && data.name ? data.name : '---'}
        </span>
        <footer>
          <Button
            size="small"
            className={`mr-1 rounded text-white border-none promote-card__toggleBtn promote-card__toggleBtn--main ${
              data && data.is_main_promo
                ? 'promote-card--toggledMain shadow-inner'
                : 'promote-card--notToggled shadow-md'
            }`}
            onClick={() => {
              if (data) {
                togglePromo(data, 'main');
              }
            }}
          >
            main
          </Button>
          <Button
            size="small"
            className={`rounded text-white border-none promote-card__toggleBtn promote-card__toggleBtn--local ${
              data && data.is_local_promo
                ? 'promote-card--toggledLocal shadow-inner'
                : 'promote-card--notToggled shadow-md'
            }`}
            onClick={() => {
              if (data) {
                togglePromo(data, 'local');
              }
            }}
          >
            local
          </Button>
          <Popconfirm
            title="Are you sure?"
            onConfirm={confirm}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" size="small" danger>
              reset
            </Button>
          </Popconfirm>
        </footer>
      </div>
    </div>
  );
}
