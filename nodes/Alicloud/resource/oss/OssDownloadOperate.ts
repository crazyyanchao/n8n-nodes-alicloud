import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';

const OssDownloadOperate: ResourceOperations = {
	name: 'Download File',
	value: 'oss:download',
	description: 'Download file from OSS',
	options: [
		{
			displayName: 'OSS Region',
			name: 'ossRegion',
			type: 'string',
			default: 'oss-cn-beijing',
			description: 'OSS region endpoint (e.g., oss-cn-hongkong, oss-cn-beijing)',
			required: true,
		},
		{
			displayName: 'OSS Bucket Name',
			name: 'ossBucket',
			type: 'string',
			default: '',
			description: 'Name of the OSS bucket to operate on',
			required: true,
		},
		{
			displayName: 'Object Key',
			name: 'objectKey',
			type: 'string',
			description: 'Key (path) of the object in the bucket (e.g., path/to/file.jpg)',
			default: '',
			required: true,
		},
		{
			displayName: 'Binary Property',
			name: 'binaryPropertyName',
			type: 'string',
			description: 'Binary property name for download',
			default: 'data',
			required: true,
		},
	],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const ossRegion = this.getNodeParameter('ossRegion', index) as string;
		const ossBucket = this.getNodeParameter('ossBucket', index) as string;
		const objectKey = this.getNodeParameter('objectKey', index) as string;
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index) as string;

		// Use Alibaba Cloud OSS SDK for download
		const OSS = require('ali-oss');
		const credentials = await this.getCredentials('alicloudCredentialsApi');

		const client = new OSS({
			region: ossRegion,
			accessKeyId: credentials.accessKeyId,
			accessKeySecret: credentials.accessKeySecret,
			bucket: ossBucket,
		});

		try {
			const result = await client.get(objectKey);

			// Convert downloaded data to binary format
			const binaryData = await this.helpers.prepareBinaryData(
				result.content,
				objectKey.split('/').pop() || 'download',
				result.res.headers['content-type'] || 'application/octet-stream'
			);

			return {
				success: true,
				objectKey,
				binaryData: {
					[binaryPropertyName]: binaryData,
				},
				downloadResult: {
					url: result.url,
					name: result.name,
					res: result.res,
				},
			};
		} catch (error) {
			throw new Error(`OSS download failed: ${error.message}`);
		}
	},
};

export default OssDownloadOperate;
