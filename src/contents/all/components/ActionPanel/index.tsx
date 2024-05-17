import React, { useState } from 'react';
import { Typography, Button } from 'antd';
import {
    getPostOwnerId,
    getCreationTime,
    getFBCommitLength,
    getAuthorFromClass,
} from '../../../all/index';
const { Title } = Typography;

const ActionPanel = () => {
    const [loadings, setLoadings] = useState<boolean>(false);

    function getPostDetail() {
        // console.log('invoded:');
        const fetch1 = getPostOwnerId();
        const fetch2 = getCreationTime(1);
        Promise.all([fetch1, fetch2]).then((response) => {
            const data = {
                author: getAuthorFromClass(),
                authorId: response[0],
                createTime: new Date((response[1] as number) * 1000),
                commentsLength: getFBCommitLength(),
            };
            console.log('data:', data);

            // sendMessage('hello-from-content-script', data, 'background');
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
