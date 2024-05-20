import React, { useState } from 'react';
import { Typography, Button } from 'antd';
import {
    getPostOwner,
    getCreationTime,
    getFBCommitLength,
    getPostNumInfo,
    getTargetPostClassFromDocumentBody,
    getGroupID,
} from '../../../all/index';
const { Title } = Typography;

const ActionPanel = () => {
    const [loadings, setLoadings] = useState<boolean>(false);

    function getPostDetail() {
        console.log('getHeader:', getTargetPostClassFromDocumentBody());

        const fetchPostNumInfo = getPostNumInfo(1);
        const fetchPostOwner = getPostOwner();
        const fetchCreationTime = getCreationTime(1);
        Promise.all([fetchPostNumInfo, fetchPostOwner, fetchCreationTime])
            .then((response) => {
                const data = {
                    group: {
                        name: '',
                        id: getGroupID(),
                    },
                    author: response[1],
                    createTime: new Date((response[2] as number) * 1000),
                    commentsLength: getFBCommitLength(),
                    post: response[0],
                };
                console.log('data:', data);

                // sendMessage('hello-from-content-script', data, 'background');
            })
            .catch((e) => {
                console.log('error:', e);
            });
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: '0',
                right: '20px',
                backgroundColor: 'white',
                border: '1px solid black',
                padding: '10px',
                zIndex: 1000,
                minWidth: '200px',
            }}
        >
            <div style={{ width: '100%', textAlign: 'center' }}>
                <Title level={3}>獲取留言</Title>
                <Button
                    type="primary"
                    loading={loadings}
                    onClick={() => {
                        getPostDetail();
                        setLoadings(true);
                    }}
                >
                    開始
                </Button>
            </div>
        </div>
    );
};

export default ActionPanel;
