import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';

const OssDeleteOperate: ResourceOperations = {
	name: 'Delete Object',
	value: 'oss:delete',
	description: 'Delete object from OSS',
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
			displayName: 'OSS Custom Endpoint',
			name: 'ossEndpoint',
			type: 'string',
			default: '',
			description: 'Optional custom OSS endpoint URL (overrides region-based endpoint)',
		},
		{
			displayName: 'Object Key',
			name: 'objectKey',
			type: 'string',
			description: 'Key (path) of the object in the bucket (e.g., path/to/file.jpg)',
			default: '',
			required: true,
		},
	],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const ossRegion = this.getNodeParameter('ossRegion', index) as string;
		const ossBucket = this.getNodeParameter('ossBucket', index) as string;
		const objectKey = this.getNodeParameter('objectKey', index) as string;

		// Use Alibaba Cloud OSS SDK for delete operation
		const OSS = require('ali-oss');
		const credentials = await this.getCredentials('alicloudCredentialsApi');

		const client = new OSS({
			region: ossRegion,
			accessKeyId: credentials.accessKeyId,
			accessKeySecret: credentials.accessKeySecret,
			bucket: ossBucket,
		});

		try {
			const result = await client.delete(objectKey);

			return {
				success: true,
				objectKey,
				res: result.res,
				deleteResult: result,
			};
		} catch (error) {
			throw new Error(`OSS delete operation failed: ${error.message}`);
		}
	},
};

export default OssDeleteOperate;
