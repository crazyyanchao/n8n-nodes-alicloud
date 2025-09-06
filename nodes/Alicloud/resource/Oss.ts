/*
 * OSS Module
 * =====================================================================
 * OSS Object Storage Function Module
 * ---------------------------------------------------------------------
 * Supported Operations:
 *   • Upload file (upload)
 *   • Download file (download)
 *   • List objects (list)
 *   • Delete file (delete)
 * ---------------------------------------------------------------------
 * Author: Yanchao Ma — 2025‑01‑06
 */

import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { Buffer } from 'buffer';
import OSS from 'ali-oss';

export interface OssCredentials {
	accessKeyId: string;
	accessKeySecret: string;
}

export class OssModule {
	constructor(private functions: IExecuteFunctions) {}

	async execute(itemIndex: number): Promise<INodeExecutionData> {
		const credentials = (await this.functions.getCredentials('alicloudCredentialsApi')) as OssCredentials;
		const operation = this.functions.getNodeParameter('ossOperation', itemIndex) as string;

		// Get configuration from node parameters
		const region = this.functions.getNodeParameter('ossRegion', itemIndex) as string;
		const bucket = this.functions.getNodeParameter('ossBucket', itemIndex) as string;
		const endpoint = this.functions.getNodeParameter('ossEndpoint', itemIndex) as string;

		// Create Alibaba Cloud OSS client
		const client = new OSS({
			region: region,
			accessKeyId: credentials.accessKeyId,
			accessKeySecret: credentials.accessKeySecret,
			bucket: bucket,
			endpoint: endpoint || undefined,
		});

		switch (operation) {
			case 'upload':
				return await this.uploadFile(client, itemIndex);
			case 'download':
				return await this.downloadFile(client, itemIndex);
			case 'list':
				return await this.listObjects(client, itemIndex);
			case 'delete':
				return await this.deleteFile(client, itemIndex);
			default:
				throw new NodeOperationError(this.functions.getNode(), `Unknown OSS operation: ${operation}`);
		}
	}

	private async uploadFile(client: any, itemIndex: number): Promise<INodeExecutionData> {
		const objectKey = this.functions.getNodeParameter('objectKey', itemIndex) as string;
		const binaryPropertyName = this.functions.getNodeParameter('binaryPropertyName', itemIndex) as string;
		const binaryData = this.functions.helpers.assertBinaryData(itemIndex, binaryPropertyName);

		const putRes = await client.put(objectKey, Buffer.from(binaryData.data));
		return {
			json: {
				success: true,
				url: putRes.url,
				objectKey,
				operation: 'upload'
			}
		};
	}

	private async downloadFile(client: any, itemIndex: number): Promise<INodeExecutionData> {
		const objectKey = this.functions.getNodeParameter('objectKey', itemIndex) as string;
		const binaryPropertyName = this.functions.getNodeParameter('binaryPropertyName', itemIndex) as string;

		const getRes = await client.get(objectKey);
		return {
			json: {
				success: true,
				objectKey,
				operation: 'download'
			},
			binary: {
				[binaryPropertyName]: await this.functions.helpers.prepareBinaryData(
					getRes.content as Buffer,
					objectKey,
				),
			},
		};
	}

	private async listObjects(client: any, itemIndex: number): Promise<INodeExecutionData> {
		const prefix = this.functions.getNodeParameter('prefix', itemIndex, '') as string;
		const listRes = await client.list(
			{
				prefix,
				'max-keys': 1000, // Default is 1000, customizable
			},
			{},
		);

		const objects = listRes.objects ?? [];
		return {
			json: {
				success: true,
				objects: objects,
				count: objects.length,
				operation: 'list',
				prefix
			}
		};
	}

	private async deleteFile(client: any, itemIndex: number): Promise<INodeExecutionData> {
		const objectKey = this.functions.getNodeParameter('objectKey', itemIndex) as string;
		await client.delete(objectKey);
		return {
			json: {
				success: true,
				objectKey,
				operation: 'delete'
			}
		};
	}
}
