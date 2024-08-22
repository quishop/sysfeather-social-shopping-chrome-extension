import React, { useState } from 'react';
import { Typography, Button } from 'antd';
import { sendMessage } from 'webext-bridge';
import {
    getPostOwner,
    getCreationTime,
    getFBCommitLength,
    getPostNumInfo,
    getGroupID,
    fetchComments,
} from '../../../all/index';
const { Title } = Typography;

const ActionPanel = () => {
    const [loadings, setLoadings] = useState<boolean>(false);

    function getPostDetail() {
        const fetchPostNumInfo = getPostNumInfo(1);
        const fetchPostOwner = getPostOwner();
        const fetchCreationTime = getCreationTime(1);
        const fetchCommentList = fetchComments();

        Promise.all([fetchPostNumInfo, fetchPostOwner, fetchCreationTime, fetchCommentList])
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
                    comments: response[3],
                };
                console.log('data:', data);
                chrome.runtime.sendMessage({ action: 'sendData', data: data }, (response) => {
                    console.log('sendData:0', response.status);
                });
                console.log('invoked send');
                // sendMessage('hello-from-content-script', JSON.stringify(data), 'background');
            })
            .catch((e) => {
                console.log('error:', e);
            })
            .finally(() => {
                {
                    setLoadings(false);
                }
            });
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: '70px',
                right: '20px',
                backgroundColor: 'white',
                borderStyle: 'none',
                padding: '10px',
                zIndex: 1000,
                minWidth: '150px',
                borderRadius: '20px',
                boxShadow: 'rgba(153, 153, 153, 0.57) 0px 0px 1em',
            }}
        >
            <div
                style={{
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: 'rgba(173, 216, 230, 0.34) 0px 10px 1em',
                    padding: '10px 0px',
                    borderRadius: '10px',
                }}
            >
                <Title level={4} style={{ margin: '0px 10px 0px 10px' }}>
                    矽羽+1智慧小幫手
                </Title>
            </div>
            <div style={{ width: '100%', textAlign: 'center', padding: '10px 0px' }}>
                <Title level={5}>獲取貼文</Title>
                <Button
                    type="primary"
                    loading={loadings}
                    onClick={() => {
                        getPostDetail();
                        setLoadings(true);
                    }}
                >
                    {loadings ? '獲取中' : '開始'}
                </Button>
            </div>
        </div>
    );
};

export default ActionPanel;
