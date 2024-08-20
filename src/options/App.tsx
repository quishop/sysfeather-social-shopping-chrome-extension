import './App.scss';
import { useEffect, useState } from 'react';
import { Card, Avatar, List, Typography, Button, message } from 'antd';

const { Text, Paragraph, Title } = Typography;
const App = () => {
    const [data, setData] = useState<any>(null);
    const [messageApi, contextHolder] = message.useMessage();
    useEffect(() => {
        chrome.storage.local.get('data', (result) => {
            if (result.data) {
                setData(result.data);
            } else {
                console.log('No data found');
            }
        });
    }, []);

    function formatTimestamp(isoString: string) {
        // Parse the ISO date string
        const date = new Date(isoString);

        const year = date.getFullYear();
        const month = date.getMonth() + 1; // Months are 0-indexed
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    }

    return (
        <div className="app" style={{ paddingTop: '10px' }}>
            {contextHolder}
            <Paragraph style={{ textAlign: 'center' }}>
                <Title level={2}>社團貼文</Title>
            </Paragraph>
            {data && (
                <Card
                    title={
                        <>
                            <Paragraph>
                                <Text strong>社團 id:</Text> {data.group.id}
                                <Text strong> </Text>
                                <Text strong>社團名稱:</Text> {data.group.name}
                            </Paragraph>
                            <Paragraph>
                                <a
                                    href={`https://www.facebook.com/groups/${data.group.id}/user/${data.author.id}/`}
                                    target="_blank"
                                >
                                    {data.author.name}（{data.author.id}）{' '}
                                    <Text strong>的貼文</Text>
                                </a>
                            </Paragraph>
                        </>
                    }
                    extra={
                        <Button
                            type="primary"
                            onClick={(e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText(JSON.stringify(data)).then(() => {
                                    messageApi.open({
                                        type: 'success',
                                        content: '複製貼文數據成功',
                                    });
                                });
                            }}
                        >
                            複製數據
                        </Button>
                    }
                    style={{ margin: 20 }}
                >
                    <Paragraph>
                        <Text strong>貼文 id:</Text> {`${data.post.num}`}
                        <Text strong> </Text>
                        <Text strong>貼文連結:</Text>
                        <a href={data.post.url} target="_blank" rel="noopener noreferrer">
                            {data.post.url}
                        </a>
                    </Paragraph>
                    <Paragraph>
                        <Text strong>貼文內容:</Text> {data.post.text}
                    </Paragraph>
                    <Paragraph>
                        <Text strong>貼文時間:</Text> {formatTimestamp(data.createTime)}
                        <Text strong> </Text>
                        <Text strong>留言數量:</Text> {data.commentsLength}
                    </Paragraph>

                    <List
                        itemLayout="horizontal"
                        dataSource={data.comments}
                        renderItem={(item) => (
                            <List.Item
                                className="clickable-list-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.stopPropagation();
                                    window.open(item.url, '_blank');
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <a
                                            href={`https://www.facebook.com/groups/${data.group.id}/user/${item.author.id}/`}
                                            target="_blank"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Avatar src={item.author.avata} />
                                        </a>
                                    }
                                    title={
                                        <a
                                            style={{ color: '#1677ff' }}
                                            href={`https://www.facebook.com/groups/${data.group.id}/user/${item.author.id}/`}
                                            target="_blank"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {`${item.author.name}（${item.author.id})`}
                                        </a>
                                    }
                                    description={
                                        <div>
                                            <div style={{ color: '#050505' }}>{item.message}</div>
                                            <div>{item.time}</div>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            )}
        </div>
    );
};
export default App;
