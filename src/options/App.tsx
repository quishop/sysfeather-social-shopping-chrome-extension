import './App.scss';
import { useEffect, useState } from 'react';
import { Card, Avatar, List, Typography } from 'antd';

const { Text, Paragraph } = Typography;
const App = () => {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        chrome.storage.local.get('data', (result) => {
            if (result.data) {
                // let dataElement = document.getElementById('data');
                // dataElement.textContent = JSON.stringify(result.data, null, 2);
                setData(JSON.stringify(result.data));
            } else {
                console.log('No data found');
            }
        });
    }, []);

    return (
        <div className="app">
            <h1 className="title">貼文內容</h1>
            {/* {data} */}
            <div>{JSON.parse(data).author.id}</div>
            <div>{JSON.parse(data).author.name}</div>
            {/* {JSON.stringify(data)} */}
            {/* <Card title={`Post by ${data.author.name}`} style={{ margin: 20 }}>
                <Paragraph>
                    <Text strong>Post Text:</Text> {data.post.text}
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
                <List
                    itemLayout="horizontal"
                    dataSource={data.comments}
                    renderItem={(item) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<Avatar src={item.author.avata} />}
                                title={item.author.name}
                                description={item.message}
                            />
                        </List.Item>
                    )}
                /> */}
            {/* </Card> */}
        </div>
    );
};
export default App;
