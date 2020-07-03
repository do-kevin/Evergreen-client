import React, { useEffect, useState } from 'react';
import { Layout, Row, Col, Input, Form, Upload, message, Alert } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import 'assets/scss/antd-overrides.scss';

function getBase64(image, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  return reader.readAsDataURL(image);
}

function ImageUploadAndNameInputs(props) {
  const {
    children,
    onChangeUpload,
    onChangeBannerUpload,
    file = null,
    bannerFile = null,
  } = props;

  const [imageUrl, setImageUrl] = useState(null);
  const [bannerImageUrl, setBannerImageUrl] = useState(null);

  const displayImageFile = (file, imageUrlCall) => {
    if (file) {
      if (file.file_link) {
        imageUrlCall(file.file_link);
        return;
      }
      getBase64(
        new Blob([file.originFileObj], { type: file.type }),
        (_imageUrl) => {
          imageUrlCall(_imageUrl);
        }
      );
    } else {
      imageUrlCall(null);
    }
  };

  useEffect(() => {
    displayImageFile(file, setImageUrl);
    displayImageFile(bannerFile, setBannerImageUrl);
  }, [file, bannerFile]);

  function beforeUpload(file) {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    return isJpgOrPng;
  }

  return (
    <Layout className="h-auto mb-6">
      <Row className="justify-center" gutter={8}>
        <Col>
          <span className="text-gray-700">Main Image</span>
          <Form.Item className="w-full h-full form-item-control-input-h-full-w-full justify-center flex mb-0">
            <Upload
              customRequest={() => {}}
              className="custom-ant-upload"
              name="file"
              listType="picture-card"
              showUploadList={false}
              onChange={onChangeUpload}
              beforeUpload={beforeUpload}
              disabled
            >
              {imageUrl ? (
                <img src={imageUrl} alt="upload" />
              ) : (
                <div>
                  <FontAwesomeIcon
                    className="text-black text-6xl"
                    icon={faCloudUploadAlt}
                  />
                </div>
              )}
            </Upload>
          </Form.Item>
        </Col>
        <Col>
          <span className="text-gray-700">Banner Image</span>
          <Form.Item className="w-full h-full form-item-control-input-h-full-w-full justify-center flex mb-0">
            <Upload
              customRequest={() => {}}
              className="custom-ant-upload-2"
              name="file"
              listType="picture-card"
              showUploadList={false}
              onChange={onChangeBannerUpload}
              beforeUpload={beforeUpload}
              disabled
            >
              {bannerImageUrl ? (
                <img src={bannerImageUrl} alt="upload" />
              ) : (
                <div>
                  <FontAwesomeIcon
                    className="text-black text-6xl"
                    icon={faCloudUploadAlt}
                  />
                </div>
              )}
            </Upload>
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Alert
          className="rounded w-full text-center"
          type="warning"
          message="Image uploading is disabled."
        />
      </Row>
      <Row gutter={8}>
        <Col span={24}>
          <Form.Item
            label="Name"
            name="name"
            style={{ display: 'inherit' }}
            labelAlign={'left'}
            colon={false}
            className="mb-0 w-full"
            rules={[
              { required: true, message: 'Please enter a provider name' },
            ]}
          >
            <Input className="rounded" name="name" />
          </Form.Item>
          {children}
        </Col>
      </Row>
    </Layout>
  );
}

export default ImageUploadAndNameInputs;
