import React, { useState } from 'react';
import { Typography, Button } from 'antd';
import {
    getPostOwnerId,
    getCreationTime,
    getFBCommitLength,
    getAuthorFromClass,
    getHeader,
    getGroupNameClass,
    getPostNumInfo,
    getContentFn,
    getTargetPostClassFromDocumentBody,
    getGroupID,
    getFbGroupId,
    getfbPostNum,
} from '../../../all/index';
import e from 'cors';
const { Title } = Typography;

const ActionPanel = () => {
    const [loadings, setLoadings] = useState<boolean>(false);

    function getPostDetail() {
        // post text console.log('getHeader:', getContentFn().trim());
        // post number and url getPostNumInfo(1).then((res) => {
        //     console.log('getPostNumInfo:', res);
        // });
        getPostNumInfo(1).then((res) => {
            console.log('getPostNumInfo:', res);
        });
        getGroupNameClass().then((res) => {
            console.log('getGroupNameClass:', res);
        });
        console.log(
            'getHeader1:',
            // getHeader(1),
            // getTargetPostClassFromDocumentBody(),
            // getGroupNameClass(),
            getFbGroupId(1),
            // getGroupID(),
        );
        console.log(
            'getHeader2:',
            // getHeader(1),
            // getTargetPostClassFromDocumentBody(),
            // getGroupNameClass(),
            // getFbGroupId(1),
            getGroupID(),
            getfbPostNum(1),
        );
        const fetch1 = getPostOwnerId();
        const fetch2 = getCreationTime(1);
        Promise.all([fetch1, fetch2])
            .then((response) => {
                const data = {
                    author: getAuthorFromClass(),
                    authorId: response[0],
                    createTime: new Date((response[1] as number) * 1000),
                    commentsLength: getFBCommitLength(),
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
