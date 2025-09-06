import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';

const OssSignedUrlGenerateOperate: ResourceOperations = {
	name: 'Generate Signed URL',
	value: 'ossSignedUrl:generate',
	description: 'Generate signed URL for OSS object',
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
			displayName: 'HTTP Method',
			name: 'signedUrlMethod',
			type: 'options',
			options: [
				{ name: 'DELETE', value: 'DELETE' },
				{ name: 'GET', value: 'GET' },
				{ name: 'POST', value: 'POST' },
				{ name: 'PUT', value: 'PUT' },
			],
			default: 'GET',
			description: 'HTTP method for the signed URL',
		},
		{
			displayName: 'Expiration Time (Seconds)',
			name: 'signedUrlExpires',
			type: 'number',
			description: 'URL expiration time in seconds',
			default: 3600,
			required: true,
		},
		{
			displayName: 'Additional Options',
			name: 'signedUrlAdditionalOptions',
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			options: [
				{
					displayName: 'Headers',
					name: 'headers',
					type: 'json',
					description: 'HTTP headers to sign (JSON format)',
					default: '{}',
				},
				{
					displayName: 'Query Parameters',
					name: 'params',
					type: 'json',
					description: 'Query parameters to sign (JSON format)',
					default: '{}',
				},
				{
					displayName: 'Slash Safe',
					name: 'slashSafe',
					type: 'boolean',
					description: 'Whether to enable slash escaping protection in object key',
					default: false,
				},
				{
					displayName: 'Additional Headers',
					name: 'additionalHeaders',
					type: 'json',
					description: 'Additional headers to sign (JSON format)',
					default: '{}',
				},
			],
		},
	],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const ossRegion = this.getNodeParameter('ossRegion', index) as string;
		const ossBucket = this.getNodeParameter('ossBucket', index) as string;
		const objectKey = this.getNodeParameter('objectKey', index) as string;
		const signedUrlMethod = this.getNodeParameter('signedUrlMethod', index) as string;
		const signedUrlExpires = this.getNodeParameter('signedUrlExpires', index) as number;
		const additionalOptions = this.getNodeParameter('signedUrlAdditionalOptions', index) as IDataObject;

		// Use Alibaba Cloud OSS SDK to generate signed URL
		const OSS = require('ali-oss');
		const credentials = await this.getCredentials('alicloudCredentialsApi');

		const client = new OSS({
			region: ossRegion,
			accessKeyId: credentials.accessKeyId,
			accessKeySecret: credentials.accessKeySecret,
			bucket: ossBucket,
		});

		try {
			const options: any = {
				expires: signedUrlExpires,
			};

			// Handle additional options
			if (additionalOptions.headers) {
				options.headers = JSON.parse(additionalOptions.headers as string);
			}
			if (additionalOptions.params) {
				options.params = JSON.parse(additionalOptions.params as string);
			}
			if (additionalOptions.slashSafe !== undefined) {
				options.slashSafe = additionalOptions.slashSafe;
			}
			if (additionalOptions.additionalHeaders) {
				options.additionalHeaders = JSON.parse(additionalOptions.additionalHeaders as string);
			}

			const signedUrl = client.signatureUrl(objectKey, {
				method: signedUrlMethod,
				...options,
			});

			// Generate internal URL by replacing region with internal region
			const signedInternalUrl = signedUrl.replace(
				new RegExp(`https://${ossBucket}\\.${ossRegion}\\.`),
				`https://${ossBucket}.${ossRegion}-internal.`
			);

			return {
				success: true,
				signedUrl,
				signedInternalUrl,
				objectKey,
				method: signedUrlMethod,
				expires: signedUrlExpires,
				options,
			};
		} catch (error) {
			throw new Error(`OSS signed URL generation failed: ${error.message}`);
		}
	},
};

export default OssSignedUrlGenerateOperate;
