const { Alicloud } = require('../../dist/nodes/Alicloud/Alicloud.node');

// Mock n8n execution context
const mockExecuteFunctions = {
    getInputData: () => [{}],
    getNodeParameter: (param, index) => {
        const params = {
            'resource': 'speechSynthesizer',
            'operation': 'speechSynthesizer:synthesize',
            'serviceUrl': 'wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1',
            'appKey': 'test-appkey',
            'accessToken': 'test-token',
            'text': '你好，这是一个测试文本',
            'voice': 'xiaoyun',
            'format': 'wav',
            'sampleRate': 16000,
            'volume': 50,
            'speechRate': 0,
            'pitchRate': 0,
            'enableSubtitle': false,
            'outputFormat': 'base64'
        };
        return params[param];
    },
    getCredentials: async (name) => {
        return {
            accessKeyId: 'test-access-key-id',
            accessKeySecret: 'test-access-key-secret'
        };
    },
    logger: {
        debug: console.log,
        error: console.error,
        info: console.log
    },
    continueOnFail: () => false,
    getNode: () => ({}),
    helpers: {
        constructExecutionMetaData: (data, meta) => data,
        returnJsonArray: (data) => [data]
    }
};

async function testSpeechSynthesizer() {
    console.log('Testing Speech Synthesizer Node...');

    try {
        const alicloudNode = new Alicloud();
        console.log('Node description:', alicloudNode.description.displayName);
        console.log('Available resources:', alicloudNode.description.properties[0].options.map(opt => opt.name));

        // Check if speechSynthesizer resource is available
        const resources = alicloudNode.description.properties[0].options;
        const speechResource = resources.find(r => r.value === 'speechSynthesizer');

        if (speechResource) {
            console.log('✅ Speech Synthesizer resource found:', speechResource.name);
        } else {
            console.log('❌ Speech Synthesizer resource not found');
        }

        // Check operations
        const operations = alicloudNode.description.properties[1].options;
        const speechOps = operations.filter(op => op.value.startsWith('speechSynthesizer:'));

        if (speechOps.length > 0) {
            console.log('✅ Speech Synthesizer operations found:', speechOps.map(op => op.name));
        } else {
            console.log('❌ Speech Synthesizer operations not found');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSpeechSynthesizer();
