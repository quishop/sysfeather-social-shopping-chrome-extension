import React, { useState } from 'react';
import { Typography, Button } from 'antd';
import { sendMessage } from 'webext-bridge';
import {
    getPostOwner,
    getCreationTime,
    getFBCommitLength,
    getPostNumInfo,
    getGroupID,
    getGroupNameClass,
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
                const [postNumInfo, postOwner, creationTime, commentList] = response;
                
                const groupID = getGroupID();
                const groupName = getGroupNameClass();
                const data = {
                    group: {
                        id: groupID,
                        name: groupName,
                    },
                    author: postOwner,
                    createTime: new Date((creationTime as number) * 1000),

                    commentsLength: commentList?.length || 0,
                    post: postNumInfo,
                    comments: commentList,
                };
                console.log('data:', data);
                chrome.runtime.sendMessage({ action: 'sendData', data: data }, (response) => {
                    console.log('sendData:0', response.status);
                });
                new Promise(() => {
                    return fetch(
                        'https://azzmqyfake.execute-api.ap-northeast-1.amazonaws.com/prod/v1/usage-logs',
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                socialAccount: {
                                    platform: 'fb_group',
                                    platformId: groupID,
                                    name: groupName,
                                },
                                serviceCode: 'group_plus',
                                featureCode: 'fetch_comments',
                                action: 'fetch_comments',
                            }),
                        },
                    );
                }).then((res) => {
                    console.log('log response:', res);
                });

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
