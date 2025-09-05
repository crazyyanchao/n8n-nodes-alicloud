/*
 * n8n Custom Node: Alicloud OSS Signed URL Generator
 * =====================================================================
 * Dependencies
 * ---------------------------------------------------------------------
 * - Depends on official SDK `ali-oss`.
 * ---------------------------------------------------------------------
 * Supported Operations
 *   • Generate Signed URL for OSS objects
 * ---------------------------------------------------------------------
 * Author: Yanchao Ma — 2025‑09‑06
 */

/* -------------------------------------------------------------------
 * Dependencies Import
 * ---------------------------------------------------------------- */
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

// @ts-ignore
import OSS from 'ali-oss';

/* -------------------------------------------------------------------
 * Node Implementation
 * ---------------------------------------------------------------- */
export class AlicloudOssSignedUrl implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Alicloud OSS Signed URL',
		name: 'alicloudOssSignedUrl',
		icon: 'file:./alicloud-signed-url.logo.svg',
		group: ['transform'],
		version: 1,
		description: 'Generate signed URLs for Alibaba Cloud OSS objects within n8n workflows.',
		defaults: {
			name: 'Alicloud OSS Signed URL',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'alicloudOssCredentialsApi',
				required: true,
			},
		],
		properties: [
			/* ------------------------------ General ------------------------------ */
			{
				displayName: 'Endpoint',
				name: 'endpoint',
				type: 'string',
				description: 'Alibaba Cloud service endpoint address (e.g., OSS endpoint)',
				default: 'https://oss-cn-beijing-internal.aliyuncs.com',
				required: true,
			},
			{
				displayName: 'Region',
				name: 'region',
				type: 'string',
				description: 'Alibaba Cloud region identifier',
				default: 'cn-beijing',
				required: true,
			},
			{
				displayName: 'Bucket Name',
				name: 'bucketName',
				type: 'string',
				description: 'The name of the OSS bucket',
				default: '',
				required: true,
			},
			{
				displayName: 'Object Key',
				name: 'objectKey',
				type: 'string',
				description: 'The key (path) of the object in the bucket (e.g., path/to/file.jpg)',
				default: '',
				required: true,
			},
			{
				displayName: 'HTTP Method',
				name: 'method',
				type: 'options',
				options: [
					{ name: 'DELETE', value: 'DELETE' },
					{ name: 'GET', value: 'GET' },
					{ name: 'HEAD', value: 'HEAD' },
					{ name: 'POST', value: 'POST' },
					{ name: 'PUT', value: 'PUT' },
				],
				default: 'GET',
				description: 'HTTP method for the signed URL',
			},
			{
				displayName: 'Expires (Seconds)',
				name: 'expires',
				type: 'number',
				description: 'URL expiration time in seconds',
				default: 3600,
				required: true,
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Headers',
						name: 'headers',
						type: 'json',
						description: 'HTTP headers to be signed (JSON format)',
						default: '{}',
					},
					{
						displayName: 'Query Parameters',
						name: 'params',
						type: 'json',
						description: 'Query parameters to be signed (JSON format)',
						default: '{}',
					},
					{
						displayName: 'Slash Safe',
						name: 'slashSafe',
						type: 'boolean',
						description: 'Whether to enable slash escape protection in object key',
						default: false,
					},
					{
						displayName: 'Additional Headers',
						name: 'additionalHeaders',
						type: 'json',
						description: 'Additional headers to be signed (JSON format)',
						default: '{}',
					},
				],
			},
		],
	};

	/* ------------------------------ Execution Entry ------------------------------ */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = (await this.getCredentials('alicloudOssCredentialsApi')) as {
			accessKeyId: string;
			accessKeySecret: string;
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const endpoint = this.getNodeParameter('endpoint', i) as string;
				const region = this.getNodeParameter('region', i) as string;
				const bucketName = this.getNodeParameter('bucketName', i) as string;
				const objectKey = this.getNodeParameter('objectKey', i) as string;
				const method = this.getNodeParameter('method', i) as string;
				const expires = this.getNodeParameter('expires', i) as number;
				const additionalOptions = this.getNodeParameter('additionalOptions', i) as any;

				// Create Alibaba Cloud OSS client
				const client = new OSS({
					accessKeyId: credentials.accessKeyId,
					accessKeySecret: credentials.accessKeySecret,
					endpoint: endpoint,
					region: region,
				});

				// Parse additional options
				let headers = {};
				let params = {};
				let slashSafe = false;
				let additionalHeaders = {};

				if (additionalOptions.headers) {
					try {
						headers = typeof additionalOptions.headers === 'string'
							? JSON.parse(additionalOptions.headers)
							: additionalOptions.headers;
					} catch (error) {
						throw new NodeOperationError(this.getNode(), 'Invalid headers JSON format');
					}
				}

				if (additionalOptions.params) {
					try {
						params = typeof additionalOptions.params === 'string'
							? JSON.parse(additionalOptions.params)
							: additionalOptions.params;
					} catch (error) {
						throw new NodeOperationError(this.getNode(), 'Invalid params JSON format');
					}
				}

				if (additionalOptions.slashSafe !== undefined) {
					slashSafe = additionalOptions.slashSafe;
				}

				if (additionalOptions.additionalHeaders) {
					try {
						additionalHeaders = typeof additionalOptions.additionalHeaders === 'string'
							? JSON.parse(additionalOptions.additionalHeaders)
							: additionalOptions.additionalHeaders;
					} catch (error) {
						throw new NodeOperationError(this.getNode(), 'Invalid additionalHeaders JSON format');
					}
				}

				// Generate signed URL
				const signedUrl = client.signUrl(objectKey, {
					method,
					expires,
					headers: Object.keys(headers).length > 0 ? headers : undefined,
					params: Object.keys(params).length > 0 ? params : undefined,
					slash_safe: slashSafe,
					additional_headers: Object.keys(additionalHeaders).length > 0 ? additionalHeaders : undefined,
				});

				returnData.push({
					json: {
						success: true,
						signedUrl: signedUrl,
						endpoint: endpoint,
						region: region,
						bucketName: bucketName,
						objectKey: objectKey,
						method: method,
						expires: expires,
						expiresAt: new Date(Date.now() + expires * 1000).toISOString(),
						options: {
							headers,
							params,
							slashSafe,
							additionalHeaders,
						},
					},
				});

			} catch (error) {
				const errMsg = (error as Error).message;
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							error: errMsg
						}
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
