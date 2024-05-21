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

    return (
        <div className="app" style={{ paddingTop: '10px' }}>
            {contextHolder}
            <Paragraph style={{ textAlign: 'center' }}>
                <Title level={2}>貼文內容</Title>
            </Paragraph>
            {data && (
                <Card
                    title={
                        <>
                            <Paragraph>
                                <Text strong>Group id:</Text> {data.group.id}
                                <Text strong> </Text>
                                <Text strong>Group name:</Text> {data.group.name}
                            </Paragraph>
                            <Paragraph>
                                <a
                                    href={`https://www.facebook.com/groups/${data.group.id}/user/${data.author.id}/`}
                                    target="_blank"
                                >
                                    <Text strong>Post by </Text> {data.author.name}（
                                    {data.author.id}）
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
                        <Text strong>Post id:</Text> {`${data.post.num}`}
                        <Text strong> </Text>
                        <Text strong>Post Content:</Text> {data.post.text}
                    </Paragraph>
                    <Paragraph>
                        <Text strong>Post URL:</Text>{' '}
                        <a href={data.post.url} target="_blank" rel="noopener noreferrer">
                            {data.post.url}
                        </a>
                    </Paragraph>
                    <Paragraph>
                        <Text strong>Created At:</Text> {new Date(data.createTime).toLocaleString()}
                    </Paragraph>
                    <Paragraph>
                        <Text strong>Post Comments length:</Text> {data.commentsLength}
                    </Paragraph>
                    <List
                        itemLayout="horizontal"
                        dataSource={data.comments}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={
                                        <a
                                            href={`https://www.facebook.com/groups/${data.group.id}/user/${item.author.id}/`}
                                            target="_blank"
                                        >
                                            <Avatar src={item.author.avata} />
                                        </a>
                                    }
                                    title={
                                        <a
                                            style={{ color: '#1677ff' }}
                                            href={`https://www.facebook.com/groups/${data.group.id}/user/${item.author.id}/`}
                                            target="_blank"
                                        >
                                            {`${item.author.name}（${item.author.id})`}
                                        </a>
                                    }
                                    description={item.message}
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
