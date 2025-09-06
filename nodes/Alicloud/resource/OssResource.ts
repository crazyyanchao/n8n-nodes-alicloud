import { INodePropertyOptions } from 'n8n-workflow';

// const OssResource: INodePropertyOptions = {
// 	name: 'Object Storage Service (OSS)',
// 	value: 'oss',
// };
const OssResource: INodePropertyOptions = {
	name: '',
	value: 'oss',
	description: '阿里云对象存储服务',
	action: 'open'
};

export default OssResource;
