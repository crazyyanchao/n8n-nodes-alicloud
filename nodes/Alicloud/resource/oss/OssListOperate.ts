import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';

const OssListOperate: ResourceOperations = {
	name: 'List Objects',
	value: 'oss:list',
	description: 'List objects in OSS bucket',
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
			displayName: 'Prefix',
			name: 'prefix',
			type: 'string',
			description: 'Prefix filter when listing objects',
			default: '',
		},
		{
			displayName: 'Max Return Count',
			name: 'maxKeys',
			type: 'number',
			description: 'Maximum number of objects to return',
			default: 100,
		},
		{
			displayName: 'Marker',
			name: 'marker',
			type: 'string',
			description: 'Pagination marker',
			default: '',
		},
	],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const ossRegion = this.getNodeParameter('ossRegion', index) as string;
		const ossBucket = this.getNodeParameter('ossBucket', index) as string;
		const prefix = this.getNodeParameter('prefix', index) as string;
		const maxKeys = this.getNodeParameter('maxKeys', index) as number;
		const marker = this.getNodeParameter('marker', index) as string;

		// Use Alibaba Cloud OSS SDK for list operation
		const OSS = require('ali-oss');
		const credentials = await this.getCredentials('alicloudCredentialsApi');

		const client = new OSS({
			region: ossRegion,
			accessKeyId: credentials.accessKeyId,
			accessKeySecret: credentials.accessKeySecret,
			bucket: ossBucket,
		});

		try {
			const result = await client.list({
				prefix,
				'max-keys': maxKeys,
				marker,
			});

			return {
				success: true,
				objects: result.objects,
				prefix: result.prefix,
				marker: result.marker,
				nextMarker: result.nextMarker,
				maxKeys: result.maxKeys,
				isTruncated: result.isTruncated,
				listResult: result,
			};
		} catch (error) {
			throw new Error(`OSS list operation failed: ${error.message}`);
		}
	},
};

export default OssListOperate;
