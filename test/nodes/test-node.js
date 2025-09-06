// 测试节点加载
try {
    const Alicloud = require('../../dist/nodes/Alicloud/Alicloud.node.js');
    console.log('节点类加载成功:', Alicloud.Alicloud);
    console.log('节点描述:', Alicloud.Alicloud.prototype.description);
} catch (error) {
    console.error('节点加载失败:', error.message);
    console.error('错误堆栈:', error.stack);
}
