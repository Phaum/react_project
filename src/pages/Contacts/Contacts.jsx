import React from "react";
import { Card, Avatar, Typography, Row, Col, Divider } from "antd";
import { UserOutlined, MailOutlined, GithubOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const creators = [
    {
        id: 1,
        name: "Ферштадт Кирилл",
        role: "Full-Stack разработчик",
        email: "fershtadt.kirill@gmail.com",
        // github: "https://github.com/ivanivanov",
        telegram: "https://t.me/Phaum",
        avatar: "https://sun6-22.userapi.com/s/v1/ig2/cv2YYG6bVi2XcEId8gb4RKSRZbkiFBN0dSepGO40sDYCxuSh-WW1XZxGgx-YilCmKadQSsMVrd52WBSU6at4VwyX.jpg?quality=95&crop=468,84,1668,1668&as=32x32,48x48,72x72,108x108,160x160,240x240,360x360,480x480,540x540,640x640,720x720,1080x1080,1280x1280,1440x1440&ava=1&u=5rzJWg00wNkp40YPwBU9A98DoyyZp84Zo_LKr5ylGUk&cs=200x200"
    },
    {
        id: 2,
        name: "Андрей Корнюшин",
        role: "QA",
        email: "andrey.kornyshin2017@gmail.com",
        telegram: "https://t.me/AndewStark",
        avatar: "https://sun1-89.userapi.com/s/v1/ig2/aBUWW94R5hi_JvrcTqatWUe1ORhzWdyk93IAgjC5vkiZbOnMjMGdRN098a4kldxuwciRmZaAdDsRGOW6tFPLGC1r.jpg?quality=95&crop=17,461,703,703&as=32x32,48x48,72x72,108x108,160x160,240x240,360x360,480x480,540x540,640x640&ava=1&cs=200x200"
    }
];

const Contacts = () => {
    return (
        <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
            <Title level={2} style={{ textAlign: "center", marginBottom: "20px" }}>
                Контакты разработчиков
            </Title>

            <Divider />

            <Row gutter={[16, 16]} justify="center">
                {creators.map((creator) => (
                    <Col key={creator.id} xs={24} sm={12} md={8}>
                        <Card bordered hoverable style={{ textAlign: "center" }}>
                            <Avatar size={80} src={creator.avatar} icon={<UserOutlined />} />
                            <Title level={4} style={{ marginTop: "10px" }}>{creator.name}</Title>
                            <Text type="secondary">{creator.role}</Text>
                            <Divider />
                            <Text><MailOutlined /> <a href={`mailto:${creator.email}`}>{creator.email}</a></Text>
                            <br />
                            <Text><a href={creator.telegram} target="_blank" rel="noopener noreferrer">Telegram</a></Text>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default Contacts;
