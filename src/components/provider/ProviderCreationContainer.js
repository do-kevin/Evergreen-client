import React, { useEffect } from 'react';
import ProviderForm from 'components/provider/ProviderForm';
import { Table, Button, Form, notification } from 'antd';
import useProviderDataFieldStore from 'components/provider/useProviderDataFieldStore';
import useAxios, { configure } from 'axios-hooks';
import axiosInstance from 'services/AxiosInstance';
import { isNil } from 'lodash';

configure({
    axios: axiosInstance,
})

const offerColumns = [
    {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
    },
    {
        title: 'Offer Name',
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: 'Offer Description',
        dataIndex: 'description',
        key: 'description',
    }
];

const pathwayColumns = [
    {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
    },
    {
        title: 'Pathways Name',
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: 'Pathways Description',
        dataIndex: 'description',
        key: 'description',
    }
];

const ProviderCreationContainer = (({ className, closeModal }, ref) => {
    const [ form ] = Form.useForm();
    const store = useProviderDataFieldStore();
    const { datafield: datafieldStore, provider: providerStore } = store;
    const [{ data: postData, error: postError, response }, executePost ] = useAxios({
        url: '/providers',
        method: 'POST'
    }, { manual: true });
    
    const submit = async () => {
        const values = form.getFieldsValue([
            "name",
            "location",
            "type",
            "learn_and_earn",
            "is_public",
            "industry",
            "description",
            "industry",
            "financial_aid",
            "credit",
            "news",
            "contact",
            "pay",
            "cost",
            "topics"
        ]);

        const { name, location, type, learn_and_earn, is_public } = values;

        if (
            name && location && type && learn_and_earn && !isNil(is_public)
        ) {
            const response = await executePost({
                data: {
                    ...values,
                    topics: values.topics,
                }
            });

            if (response && response.status === 201) {
                form.resetFields();
                closeModal();
            }
        }
    }

    useEffect(() => {
        if (postData) {
            providerStore.addOne(postData);
        }
        if (postError) {
            const { status, statusText } = postError.request;
            notification.error({
                message: status,
                description: statusText,
            })
        }
        if (response && response.status === 201) {
            notification.success({
                message: response.status,
                description: 'Successfully created provider'
            })
        }
    }, [postData, response, postError]);


    return (
        <div>
            <Form
                form={form}
                name="providerForm"
            >
                <div
                    className="p-6 overflow-y-auto"
                    style={{ maxHeight: "32rem" }}
                >
                    <ProviderForm
                        datafields={Object.values(datafieldStore.entities)}
                    />
                    <section className="mt-2">
                        <label className="mb-2 block">
                            Offers - Table
                        </label>
                        <Table
                            columns={offerColumns}
                            dataSource={[]}
                            rowKey="id"
                        />
                    </section>
                    <section className="mt-2">
                        <label className="mb-2 block">
                            Pathways - Table
                        </label>
                        <Table
                            columns={pathwayColumns}
                            dataSource={[]}
                            rowKey="id"
                        />
                    </section>
                </div>
                <section
                    className="bg-white px-6 pt-5 pb-1 flex justify-center"
                    style={{
                        borderTop: "1px solid #f0f0f0"
                    }}
                >
                    <Button
                        className="mr-3 px-10 rounded"
                        type="primary"
                        size="small"
                        htmlType="submit"
                        onClick={submit}
                    >
                        Create
                    </Button>
                    <Button
                        className="px-10 rounded"
                        size="small"
                        type="dashed"
                        onClick={() => closeModal()}
                    >
                        Cancel
                    </Button>
                </section>
            </Form>
        </div>
    );
})

export default ProviderCreationContainer;
