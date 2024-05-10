import React, { useState } from 'react';
import { Typography, Button } from 'antd';
const { Title } = Typography;

const ActionPanel = () => {
    const [loadings, setLoadings] = useState<boolean>(false);

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
                <Button type="primary" loading={loadings} onClick={() => setLoadings(true)}>
                    開始
                </Button>
            </div>
        </div>
    );
};

export default ActionPanel;
