// 测试OSS签名URL生成中的URL替换逻辑
console.log('开始测试OSS签名URL的URL替换逻辑...\n');

// 模拟URL替换函数
function testUrlReplacement(ossRegion, signedUrl) {
    console.log(`测试区域: ${ossRegion}`);
    console.log(`原始URL: ${signedUrl}`);

    // 这是修复后的代码逻辑
    const signedInternalUrl = signedUrl.replace(
        new RegExp(`\\.${ossRegion}\\.`),
        `.${ossRegion}-internal.`
    );

    console.log(`内部URL: ${signedInternalUrl}`);
    console.log('---');

    return signedInternalUrl;
}

// 测试用例
const testCases = [
    {
        name: '标准HTTP URL',
        ossRegion: 'oss-cn-beijing',
        signedUrl: 'http://develop-073260xc.oss-cn-beijing.aliyuncs.com/ai-video/public/test.m4a?OSSAccessKeyId=xxx&Expires=1757152220&Signature=xxx'
    },
    {
        name: 'HTTPS URL',
        ossRegion: 'oss-cn-hongkong',
        signedUrl: 'https://my-bucket.oss-cn-hongkong.aliyuncs.com/path/to/file.jpg?OSSAccessKeyId=xxx&Expires=1757152220&Signature=xxx'
    },
    {
        name: '带查询参数的URL',
        ossRegion: 'oss-us-west-1',
        signedUrl: 'http://test-bucket.oss-us-west-1.aliyuncs.com/folder/subfolder/file.pdf?OSSAccessKeyId=xxx&Expires=1757152220&Signature=xxx&response-content-disposition=attachment'
    },
    {
        name: '复杂路径URL',
        ossRegion: 'oss-cn-shenzhen',
        signedUrl: 'https://company-bucket.oss-cn-shenzhen.aliyuncs.com/uploads/2024/01/15/document-12345.pdf?OSSAccessKeyId=xxx&Expires=1757152220&Signature=xxx'
    }
];

// 执行测试
testCases.forEach((testCase, index) => {
    console.log(`测试用例 ${index + 1}: ${testCase.name}`);
    const result = testUrlReplacement(testCase.ossRegion, testCase.signedUrl);

    // 验证结果
    const expectedPattern = new RegExp(`\\.${testCase.ossRegion}-internal\\.`);
    const isCorrect = expectedPattern.test(result);

    console.log(`结果验证: ${isCorrect ? '✅ 通过' : '❌ 失败'}`);
    console.log('');
});

// 测试边界情况
console.log('边界情况测试:');
console.log('');

// 测试1: 空字符串
try {
    const result1 = testUrlReplacement('oss-cn-beijing', '');
    console.log('空字符串测试: ✅ 通过');
} catch (error) {
    console.log('空字符串测试: ❌ 失败 -', error.message);
}

// 测试2: 不匹配的region
const result2 = testUrlReplacement('oss-cn-shanghai', 'http://bucket.oss-cn-beijing.aliyuncs.com/file.txt');
console.log('不匹配region测试:', result2 === 'http://bucket.oss-cn-beijing.aliyuncs.com/file.txt' ? '✅ 通过' : '❌ 失败');

// 测试3: 多次匹配的情况
const result3 = testUrlReplacement('oss', 'http://bucket.oss.oss.aliyuncs.com/file.txt');
console.log('多次匹配测试:', result3 === 'http://bucket.oss-internal.oss.aliyuncs.com/file.txt' ? '✅ 通过' : '❌ 失败');

console.log('\n测试完成！');
