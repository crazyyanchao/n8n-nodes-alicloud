/*
 * OSS Signed URL Module
 * =====================================================================
 * OSS Signed URL Generation Function Module
 * ---------------------------------------------------------------------
 * Supported Operations:
 *   • Generate signed URL (generate)
 * ---------------------------------------------------------------------
 * Author: Yanchao Ma — 2025‑01‑06
 */

import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import OSS from 'ali-oss';

export interface OssSignedUrlCredentials {
	accessKeyId: string;
	accessKeySecret: string;
}

export interface OssSignedUrlOptions {
	headers?: Record<string, any>;
	params?: Record<string, any>;
	slashSafe?: boolean;
	additionalHeaders?: Record<string, any>;
}

export class OssSignedUrlModule {
	constructor(private functions: IExecuteFunctions) {}

	async execute(itemIndex: number): Promise<INodeExecutionData> {
		const credentials = (await this.functions.getCredentials('alicloudCredentialsApi')) as OssSignedUrlCredentials;

		// Get configuration from node parameters
		const region = this.functions.getNodeParameter('ossRegion', itemIndex) as string;
		const bucket = this.functions.getNodeParameter('ossBucket', itemIndex) as string;
		const endpoint = this.functions.getNodeParameter('ossEndpoint', itemIndex) as string;
		const objectKey = this.functions.getNodeParameter('signedUrlObjectKey', itemIndex) as string;
		const method = this.functions.getNodeParameter('signedUrlMethod', itemIndex) as 'GET' | 'POST' | 'PUT' | 'DELETE';
		const expires = this.functions.getNodeParameter('signedUrlExpires', itemIndex) as number;
		const additionalOptions = this.functions.getNodeParameter('signedUrlAdditionalOptions', itemIndex) as any;

		const client = new OSS({
			accessKeyId: credentials.accessKeyId,
			accessKeySecret: credentials.accessKeySecret,
			endpoint: endpoint || `https://${region}.aliyuncs.com`,
			region: region,
		});

		// Parse additional options
		const options = this.parseAdditionalOptions(additionalOptions);

		// Generate signed URL
		const signedUrl = client.signatureUrl(objectKey, {
			method,
			expires,
			...options,
		});

		return {
			json: {
				success: true,
				signedUrl: signedUrl,
				endpoint: endpoint || `https://${region}.aliyuncs.com`,
				region: region,
				bucketName: bucket,
				objectKey: objectKey,
				method: method,
				expires: expires,
				expiresAt: new Date(Date.now() + expires * 1000).toISOString(),
				options: {
					headers: options.headers,
					params: options.params,
					slashSafe: options.slashSafe,
					additionalHeaders: options.additionalHeaders,
				},
				operation: 'signedUrl'
			},
		};
	}

	private parseAdditionalOptions(additionalOptions: any): OssSignedUrlOptions {
		const options: OssSignedUrlOptions = {
			headers: {},
			params: {},
			slashSafe: false,
			additionalHeaders: {},
		};

		if (additionalOptions.headers) {
			try {
				options.headers = typeof additionalOptions.headers === 'string'
					? JSON.parse(additionalOptions.headers)
					: additionalOptions.headers;
			} catch (error) {
				throw new NodeOperationError(this.functions.getNode(), 'Invalid headers JSON format');
			}
		}

		if (additionalOptions.params) {
			try {
				options.params = typeof additionalOptions.params === 'string'
					? JSON.parse(additionalOptions.params)
					: additionalOptions.params;
			} catch (error) {
				throw new NodeOperationError(this.functions.getNode(), 'Invalid params JSON format');
			}
		}

		if (additionalOptions.slashSafe !== undefined) {
			options.slashSafe = additionalOptions.slashSafe;
		}

		if (additionalOptions.additionalHeaders) {
			try {
				options.additionalHeaders = typeof additionalOptions.additionalHeaders === 'string'
					? JSON.parse(additionalOptions.additionalHeaders)
					: additionalOptions.additionalHeaders;
			} catch (error) {
				throw new NodeOperationError(this.functions.getNode(), 'Invalid additionalHeaders JSON format');
			}
		}

		return options;
	}
}
