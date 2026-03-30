import { Welcome } from '@ant-design/x';
import { Button, Flex, Space } from 'antd';
import { useStyle } from '../../hooks';
import { EllipsisOutlined, ShareAltOutlined } from '@ant-design/icons';
import locale from '../../utils/local';

export default function BaseWelcome() {
  const { styles } = useStyle();

  return (
    <Flex
      vertical
      style={{
        maxWidth: 840,
      }}
      gap={16}
      align="center"
      className={styles.placeholder}
    >
      <Welcome
        style={{
          width: '100%',
        }}
        variant="borderless"
        icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
        title={locale.welcome}
        description={locale.welcomeDescription}
        extra={
          <Space>
            <Button icon={<ShareAltOutlined />} />
            <Button icon={<EllipsisOutlined />} />
          </Space>
        }
      />
    </Flex>
  );
}
