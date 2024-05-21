import { Avatar, Layout, List, Space, Typography } from 'antd';

import './App.scss';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

const data = [
    'https://www.facebook.com/groups/{社團名稱/ID}/permalink/{貼文ID}/',
    'https://www.facebook.com/groups/{社團名稱/ID}/posts/{貼文ID}/',
];

const App = () => {
    return (
        <div className="app">
            <Layout style={{ background: '#fff' }}>
                <Header style={{ background: '#fff', display: 'flex', alignItems: 'center' }}>
                    <Avatar src="icons/extension-icon-x128.png" size="large" />
                    <Title level={3} style={{ margin: '0 0 0 10px' }}>
                        矽羽+1智慧小幫手
                    </Title>
                </Header>
                <Content style={{ padding: '20px' }}>
                    <Title level={4}>社團貼文+1</Title>
                    <Paragraph>請在以下格式網址導出社團貼文和留言：</Paragraph>
                    <List
                        bordered
                        dataSource={data}
                        renderItem={(item) => (
                            <List.Item>
                                <Space>{item}</Space>
                            </List.Item>
                        )}
                    />
                </Content>
            </Layout>
        </div>
    );
};

export default App;
